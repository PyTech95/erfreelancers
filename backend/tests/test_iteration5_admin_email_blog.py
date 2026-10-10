"""Iteration 5 regression tests for admin email settings, leads/outbox, reports, and blog CRUD."""
import os
import smtplib
import uuid

import pytest
import requests
from pymongo import MongoClient

import email_service


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")


@pytest.fixture(scope="session")
def base_url():
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is required for integration tests")
    return BASE_URL.rstrip("/")


@pytest.fixture(scope="session")
def admin_token(base_url):
    response = requests.post(
        f"{base_url}/api/auth/login",
        json={"email": os.environ['ADMIN_EMAIL'], "password": os.environ['ADMIN_PASSWORD']},
        timeout=20,
    )
    assert response.status_code == 200, response.text
    token = response.json().get("token")
    assert isinstance(token, str) and token
    return token


@pytest.fixture
def admin_session(admin_token):
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def mongo_db():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("MONGO_URL and DB_NAME are required for restore-safe tests")
    client = MongoClient(mongo_url)
    try:
        yield client[db_name]
    finally:
        client.close()


@pytest.fixture(scope="module")
def restore_gmail_settings(mongo_db):
    original = mongo_db.integration_settings.find_one({"id": "gmail"})
    yield
    if original is None:
        mongo_db.integration_settings.delete_one({"id": "gmail"})
    else:
        mongo_db.integration_settings.replace_one({"id": "gmail"}, original, upsert=True)


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_leads(mongo_db):
    yield
    ids = [row['id'] for row in mongo_db.leads.find({'idempotencyKey': {'$regex': '^TEST_ITER5_'}}, {'id': 1})]
    for name in ('outbox', 'lead_events', 'whatsapp_alerts'):
        mongo_db[name].delete_many({'leadId': {'$in': ids}})
    mongo_db.leads.delete_many({'id': {'$in': ids}})


# ----- Admin email settings + test-email route -----
def test_admin_email_settings_requires_auth(base_url):
    response = requests.get(f"{base_url}/api/admin/email/settings", timeout=20)
    assert response.status_code in (401, 403)


def test_admin_email_settings_get_no_secrets(admin_session, base_url):
    response = admin_session.get(f"{base_url}/api/admin/email/settings", timeout=20)
    assert response.status_code == 200, response.text
    data = response.json()
    assert "passwordCiphertext" not in data
    assert "appPassword" not in data
    assert "gmailAddress" in data
    assert "passwordSet" in data


def test_admin_email_settings_rejects_invalid_password_pattern(admin_session, base_url):
    response = admin_session.put(
        f"{base_url}/api/admin/email/settings",
        json={
            "gmailAddress": "dummy.erf.test@gmail.com",
            "senderName": "ER Freelancer",
            "notificationEmail": None,
            "enabled": False,
            "appPassword": "invalid-123",
        },
        timeout=20,
    )
    assert response.status_code == 400
    assert "Google App Password" in response.text


def test_admin_email_settings_rejects_header_injection(admin_session, base_url):
    response = admin_session.put(
        f"{base_url}/api/admin/email/settings",
        json={
            "gmailAddress": "dummy.erf.test@gmail.com",
            "senderName": "ER Freelancer\nInjected",
            "notificationEmail": None,
            "enabled": False,
            "appPassword": "abcdefghijklmnop",
        },
        timeout=20,
    )
    assert response.status_code == 422


def test_admin_email_settings_save_dummy_and_no_secret_leak(admin_session, base_url, restore_gmail_settings):
    response = admin_session.put(
        f"{base_url}/api/admin/email/settings",
        json={
            "gmailAddress": "dummy.erf.test@gmail.com",
            "senderName": "ER Freelancer QA",
            "notificationEmail": None,
            "enabled": False,
            "appPassword": "abcdefghijklmnop",
        },
        timeout=20,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["gmailAddress"] == "dummy.erf.test@gmail.com"
    assert data["enabled"] is False
    assert data["passwordSet"] is True
    assert "passwordCiphertext" not in data


def test_admin_email_settings_changing_gmail_requires_fresh_password(admin_session, base_url):
    response = admin_session.put(
        f"{base_url}/api/admin/email/settings",
        json={
            "gmailAddress": "other.dummy.erf.test@gmail.com",
            "senderName": "ER Freelancer QA",
            "notificationEmail": None,
            "enabled": False,
        },
        timeout=20,
    )
    assert response.status_code == 400
    assert "required" in response.text.lower()


def test_admin_email_settings_blank_password_keeps_existing(admin_session, base_url):
    response = admin_session.put(
        f"{base_url}/api/admin/email/settings",
        json={
            "gmailAddress": "dummy.erf.test@gmail.com",
            "senderName": "ER Freelancer QA Updated",
            "notificationEmail": None,
            "enabled": False,
        },
        timeout=20,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["passwordSet"] is True
    assert data["senderName"] == "ER Freelancer QA Updated"


def test_admin_email_test_route_sanitized_failure_and_rate_limit(admin_session, base_url):
    statuses = []
    messages = []
    for _ in range(4):
        response = admin_session.post(f"{base_url}/api/admin/email/test", timeout=25)
        statuses.append(response.status_code)
        messages.append(response.text.lower())
    assert any(code in (429, 502) for code in statuses)
    combined = "\n".join(messages)
    assert "passwordciphertext" not in combined
    assert "abcdefghijklmnop" not in combined


# ----- Isolated SMTP transport unit tests (no live send) -----
def test_send_sync_success_uses_tls_and_message_headers(monkeypatch):
    captured = {}

    class FakeSMTP:
        def __init__(self, host, port, context=None, timeout=None):
            captured["host"] = host
            captured["port"] = port
            captured["context_present"] = context is not None
            captured["timeout"] = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def login(self, username, password):
            captured["username"] = username
            captured["password"] = password

        def send_message(self, message):
            captured["message"] = message

    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", FakeSMTP)

    config = {
        "gmailAddress": "sender.test@gmail.com",
        "senderName": "ER Freelancer",
        "passwordCiphertext": email_service.cipher.encrypt(b"abcdefghijklmnop").decode(),
    }
    row = {
        "id": "email-test-1",
        "recipient": "client@example.com",
        "subject": "Test Subject",
        "body": "Hello from unit test",
        "replyTo": "reply@example.com",
    }

    email_service.send_sync(config, row)

    assert captured["host"] == email_service.SMTP_HOST
    assert captured["port"] == email_service.SMTP_PORT
    assert captured["context_present"] is True
    assert captured["timeout"] == 20
    assert captured["username"] == "sender.test@gmail.com"
    assert captured["password"] == "abcdefghijklmnop"
    assert captured["message"]["From"] == "ER Freelancer <sender.test@gmail.com>"
    assert captured["message"]["To"] == "client@example.com"
    assert captured["message"]["Reply-To"] == "reply@example.com"
    assert captured["message"]["Subject"] == "Test Subject"
    assert "Hello from unit test" in captured["message"].get_content()


def test_send_sync_auth_error_is_sanitized(monkeypatch):
    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def login(self, *_args, **_kwargs):
            raise smtplib.SMTPAuthenticationError(535, b"5.7.8 Username and Password not accepted")

        def send_message(self, _message):
            return None

    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", FakeSMTP)
    config = {
        "gmailAddress": "sender.test@gmail.com",
        "senderName": "ER Freelancer",
        "passwordCiphertext": email_service.cipher.encrypt(b"abcdefghijklmnop").decode(),
    }
    row = {"id": "email-test-2", "recipient": "client@example.com", "subject": "Auth", "body": "Body"}

    with pytest.raises(smtplib.SMTPAuthenticationError) as err:
        email_service.send_sync(config, row)

    msg = email_service.safe_error(err.value)
    assert "credentials" in msg.lower()
    assert "username" not in msg.lower()
    assert "password" not in msg.lower() or "app password" in msg.lower()


def test_send_sync_timeout_is_sanitized(monkeypatch):
    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def login(self, *_args, **_kwargs):
            raise TimeoutError("socket timed out")

        def send_message(self, _message):
            return None

    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", FakeSMTP)
    config = {
        "gmailAddress": "sender.test@gmail.com",
        "senderName": "ER Freelancer",
        "passwordCiphertext": email_service.cipher.encrypt(b"abcdefghijklmnop").decode(),
    }
    row = {"id": "email-test-3", "recipient": "client@example.com", "subject": "Timeout", "body": "Body"}

    with pytest.raises(TimeoutError) as err:
        email_service.send_sync(config, row)

    msg = email_service.safe_error(err.value)
    assert "retried" in msg.lower()
    assert "timed out" not in msg.lower()


# ----- Leads / outbox / reports -----
def test_create_lead_email_generates_two_outbox_rows(admin_session, base_url):
    key = f"TEST_ITER5_EMAIL_{uuid.uuid4().hex[:10]}"
    create = requests.post(
        f"{base_url}/api/leads",
        json={
            "idempotencyKey": key,
            "clientName": "TEST Iter5 Email Lead",
            "contactValue": "iter5.lead@example.com",
            "serviceId": "S01",
            "projectDescription": "Need landing page and tracking integration.",
        },
        timeout=20,
    )
    assert create.status_code in (200, 201), create.text
    lead = create.json()["lead"]
    lead_id = lead["id"]
    leads_payload = admin_session.get(f"{base_url}/api/leads", timeout=20)
    assert leads_payload.status_code == 200
    data = leads_payload.json()
    lead_row = next(x for x in data["leads"] if x["id"] == lead_id)
    assert lead_row["emailQueued"] is True
    outbox_rows = [m for m in data["outbox"] if m.get("leadId") == lead_id and m.get("kind") in ("admin_notification", "confirmation")]
    assert len(outbox_rows) == 2
    assert sorted([m["kind"] for m in outbox_rows]) == ["admin_notification", "confirmation"]


def test_duplicate_idempotency_does_not_create_extra_outbox(admin_session, base_url):
    key = f"TEST_ITER5_DUP_{uuid.uuid4().hex[:10]}"
    payload = {
        "idempotencyKey": key,
        "clientName": "TEST Iter5 Duplicate",
        "contactValue": "iter5.dup@example.com",
        "serviceId": "S02",
        "projectDescription": "Duplicate guard check",
    }
    first = requests.post(f"{base_url}/api/leads", json=payload, timeout=20)
    second = requests.post(f"{base_url}/api/leads", json=payload, timeout=20)
    assert first.status_code in (200, 201)
    assert second.status_code == 200
    first_id = first.json()["lead"]["id"]
    second_id = second.json()["lead"]["id"]
    assert first_id == second_id
    data = admin_session.get(f"{base_url}/api/leads", timeout=20).json()
    outbox_rows = [m for m in data["outbox"] if m.get("leadId") == first_id and m.get("kind")]
    assert len(outbox_rows) == 2


def test_phone_contact_skips_confirmation_with_reason(admin_session, base_url):
    key = f"TEST_ITER5_PHONE_{uuid.uuid4().hex[:10]}"
    create = requests.post(
        f"{base_url}/api/leads",
        json={
            "idempotencyKey": key,
            "clientName": "TEST Iter5 Phone Lead",
            "contactValue": "+14155550123",
            "serviceId": "S03",
            "projectDescription": "Phone-only contact test",
        },
        timeout=20,
    )
    assert create.status_code in (200, 201), create.text
    lead_id = create.json()["lead"]["id"]
    data = admin_session.get(f"{base_url}/api/leads", timeout=20).json()
    rows = [m for m in data["outbox"] if m.get("leadId") == lead_id and m.get("kind")]
    admin_row = next(m for m in rows if m["kind"] == "admin_notification")
    confirm_row = next(m for m in rows if m["kind"] == "confirmation")
    assert admin_row["status"] in ("pending_setup", "pending", "sending", "sent", "failed")
    assert confirm_row["status"] == "skipped"
    assert "no email" in (confirm_row.get("lastError") or "").lower()


def test_admin_reports_csv_is_formula_escaped(admin_session, base_url):
    requests.post(
        f"{base_url}/api/leads",
        json={
            "idempotencyKey": f"TEST_ITER5_CSV_{uuid.uuid4().hex[:10]}",
            "clientName": "=2+2",
            "contactValue": "csv.escape@example.com",
            "serviceId": "S01",
            "projectDescription": "CSV escape regression",
        },
        timeout=20,
    )
    csv_response = admin_session.get(f"{base_url}/api/admin/reports/inquiries.csv", timeout=20)
    assert csv_response.status_code == 200
    assert "text/csv" in (csv_response.headers.get("content-type") or "")
    assert "'=2+2" in csv_response.text


# ----- Blog CRUD -----
def test_blog_crud_and_public_visibility(admin_session, base_url):
    suffix = uuid.uuid4().hex[:6]
    slug = f"marketplace-hardened-{suffix}"
    create = admin_session.post(
        f"{base_url}/api/admin/blog",
        json={
            "title": f"Marketplace Hardened {suffix}",
            "slug": slug,
            "excerpt": "Draft excerpt",
            "content": "This is a draft markdown body with enough content.",
            "author": "TEST_ITER5",
            "category": "Insights",
            "status": "draft",
        },
        timeout=20,
    )
    assert create.status_code == 201, create.text
    post = create.json()
    post_id = post["id"]

    # Draft is not public
    draft_public = requests.get(f"{base_url}/api/blog/{slug}", timeout=20)
    assert draft_public.status_code == 404

    # Publish
    publish = admin_session.put(
        f"{base_url}/api/admin/blog/{post_id}",
        json={
            "title": f"Marketplace Hardened {suffix} Updated",
            "slug": slug,
            "excerpt": "Published excerpt",
            "content": "Published markdown with [safe link](javascript:alert(1)) and <script>alert(1)</script>.",
            "author": "TEST_ITER5",
            "category": "Guides",
            "status": "published",
        },
        timeout=20,
    )
    assert publish.status_code == 200, publish.text
    assert publish.json()["status"] == "published"

    public = requests.get(f"{base_url}/api/blog/{slug}", timeout=20)
    assert public.status_code == 200
    assert public.json()["title"].endswith("Updated")

    # Duplicate slug should conflict
    dup = admin_session.post(
        f"{base_url}/api/admin/blog",
        json={
            "title": "Another title",
            "slug": slug,
            "excerpt": "x",
            "content": "Long enough content for duplicate slug test.",
            "author": "TEST_ITER5",
            "category": "Insights",
            "status": "draft",
        },
        timeout=20,
    )
    assert dup.status_code == 409

    # Unpublish removes public access
    unpublish = admin_session.put(
        f"{base_url}/api/admin/blog/{post_id}",
        json={
            "title": f"Marketplace Hardened {suffix} Updated",
            "slug": slug,
            "excerpt": "Back to draft",
            "content": "Back to draft content body for hidden state.",
            "author": "TEST_ITER5",
            "category": "Guides",
            "status": "draft",
        },
        timeout=20,
    )
    assert unpublish.status_code == 200
    hidden = requests.get(f"{base_url}/api/blog/{slug}", timeout=20)
    assert hidden.status_code == 404

    # Cleanup
    delete = admin_session.delete(f"{base_url}/api/admin/blog/{post_id}", timeout=20)
    assert delete.status_code == 200
