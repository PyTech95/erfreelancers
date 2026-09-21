"""Iteration 5 unit tests for email worker claim/retry behavior (isolated, no live SMTP)."""
import copy
import asyncio
import os

import pytest
from cryptography.fernet import Fernet

import email_service


class FakeCursor:
    def __init__(self, items):
        self.items = list(items)

    def limit(self, _n):
        return self

    def __aiter__(self):
        self._idx = 0
        return self

    async def __anext__(self):
        if self._idx >= len(self.items):
            raise StopAsyncIteration
        item = self.items[self._idx]
        self._idx += 1
        return item


class FakeLeads:
    def __init__(self, leads):
        self.leads = leads

    def find(self, _query, _projection):
        return FakeCursor(self.leads)


class FakeIntegrationSettings:
    def __init__(self, config):
        self.config = config

    async def find_one(self, _query, _projection=None):
        return copy.deepcopy(self.config)


class FakeOutbox:
    def __init__(self, rows):
        self.rows = rows

    async def update_many(self, _flt, _upd):
        # Lease recovery: move expired sending -> pending
        for row in self.rows:
            if row.get("status") == "sending":
                row["status"] = "pending"

    async def find_one_and_update(self, flt, upd, projection=None, sort=None, return_document=None):
        for row in self.rows:
            if row.get("kind") not in flt["kind"]["$in"]:
                continue
            if row.get("status") not in flt["status"]["$in"]:
                continue
            row.update(upd.get("$set", {}))
            for key, value in upd.get("$inc", {}).items():
                row[key] = row.get(key, 0) + value
            return copy.deepcopy(row)
        return None

    async def update_one(self, flt, upd):
        for row in self.rows:
            if row.get("id") == flt.get("id") and row.get("status") == flt.get("status"):
                row.update(upd.get("$set", {}))
                for key in (upd.get("$unset") or {}):
                    row.pop(key, None)
                return


class FakeDB:
    def __init__(self, leads, config, outbox_rows):
        self.leads = FakeLeads(leads)
        self.integration_settings = FakeIntegrationSettings(config)
        self.outbox = FakeOutbox(outbox_rows)


def test_process_outbox_recovers_unqueued_leads(monkeypatch):
    recovered = []

    async def fake_enqueue(lead):
        recovered.append(lead["id"])

    db = FakeDB(
        leads=[{"id": "lead-a", "emailQueued": False}],
        config={"id": "gmail", "enabled": False, "passwordCiphertext": ""},
        outbox_rows=[],
    )
    monkeypatch.setattr(email_service, "db", db)
    monkeypatch.setattr(email_service, "enqueue_lead_emails", fake_enqueue)

    asyncio.run(email_service.process_outbox())
    assert recovered == ["lead-a"]


def test_process_outbox_claims_and_marks_sent(monkeypatch):
    row = {
        "id": "mail-1",
        "kind": "confirmation",
        "status": "pending",
        "attempts": 0,
        "nextAttemptAt": "2000-01-01T00:00:00+00:00",
        "recipient": "user@example.com",
        "subject": "Subject",
        "body": "Body",
    }
    config = {
        "id": "gmail",
        "enabled": True,
        "gmailAddress": "sender@example.com",
        "passwordCiphertext": email_service.cipher.encrypt(b"abcdefghijklmnop").decode(),
        "senderName": "ER Freelancer",
    }
    db = FakeDB(leads=[], config=config, outbox_rows=[row])

    async def fake_to_thread(_fn, _config, _row):
        return None

    monkeypatch.setattr(email_service, "db", db)
    monkeypatch.setattr(email_service.asyncio, "to_thread", fake_to_thread)

    asyncio.run(email_service.process_outbox())

    assert row["attempts"] == 1
    assert row["status"] == "sent"
    assert row.get("lastError") is None


def test_process_outbox_retry_failure_and_lease_recovery(monkeypatch):
    expired_sending = {
        "id": "mail-expired",
        "kind": "confirmation",
        "status": "sending",
        "attempts": 1,
        "nextAttemptAt": "2000-01-01T00:00:00+00:00",
        "recipient": "old@example.com",
        "subject": "Old",
        "body": "Old",
    }
    retry_row = {
        "id": "mail-2",
        "kind": "admin_notification",
        "status": "pending",
        "attempts": 2,
        "nextAttemptAt": "2000-01-01T00:00:00+00:00",
        "recipient": "admin@example.com",
        "subject": "Subject",
        "body": "Body",
    }
    config = {
        "id": "gmail",
        "enabled": True,
        "gmailAddress": "sender@example.com",
        "passwordCiphertext": email_service.cipher.encrypt(b"abcdefghijklmnop").decode(),
        "senderName": "ER Freelancer",
    }
    db = FakeDB(leads=[], config=config, outbox_rows=[expired_sending, retry_row])

    async def fake_to_thread(_fn, _config, _row):
        raise TimeoutError("timeout")

    monkeypatch.setattr(email_service, "db", db)
    monkeypatch.setattr(email_service.asyncio, "to_thread", fake_to_thread)

    asyncio.run(email_service.process_outbox())

    assert expired_sending["status"] in ("pending", "failed")
    assert retry_row["attempts"] == 3
    assert retry_row["status"] == "failed"
    assert "gmail" in (retry_row.get("lastError") or "").lower()
