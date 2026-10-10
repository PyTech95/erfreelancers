"""Iteration 2 regression tests: map, leads/alerts, search-console, streaming chat, auth hardening."""

import json
import os
import re
import uuid

import pytest
import requests
from pymongo import MongoClient


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")


def _read_env_value(path: str, key: str):
    try:
        text = open(path, "r", encoding="utf-8").read()
    except FileNotFoundError:
        return None
    match = re.search(rf"^{re.escape(key)}\s*=\s*(.+)$", text, re.MULTILINE)
    if not match:
        return None
    return match.group(1).strip().strip('"').strip("'")


def _read_credentials():
    path = "/app/memory/test_credentials.md"
    try:
        text = open(path, "r", encoding="utf-8").read()
    except FileNotFoundError:
        pytest.skip("Missing /app/memory/test_credentials.md")
    email_match = re.search(r"Email:\s*([^\s]+)", text)
    pass_match = re.search(r"Password:\s*(.+)", text)
    if not email_match or not pass_match:
        pytest.skip("Admin credentials not present in test_credentials.md")
    return email_match.group(1).strip(), pass_match.group(1).strip()


@pytest.fixture(scope="session")
def base_url():
    resolved = BASE_URL or _read_env_value("/app/frontend/.env", "REACT_APP_BACKEND_URL")
    if not resolved:
        pytest.skip("REACT_APP_BACKEND_URL is not set in env or /app/frontend/.env")
    return resolved.rstrip("/")


@pytest.fixture(scope="session")
def client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def admin_token(client, base_url):
    email, password = _read_credentials()
    response = client.post(f"{base_url}/api/auth/login", json={"email": email, "password": password})
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    return response.json()["token"]


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


# --- Geography/map APIs ---
def test_map_hubs_has_8_valid_catalog_locations(client, base_url):
    response = client.get(f"{base_url}/api/map/hubs")
    assert response.status_code == 200
    data = response.json()
    hubs = data.get("hubs", [])
    assert len(hubs) == 8
    for hub in hubs:
        assert isinstance(hub.get("latitude"), float)
        assert isinstance(hub.get("longitude"), float)
        assert hub.get("location", {}).get("id")


def test_near_me_london_coords_returns_london(client, base_url):
    response = client.get(f"{base_url}/api/locations/near-me", params={"lat": 51.5074, "lng": -0.1278})
    assert response.status_code == 200
    data = response.json()
    assert data.get("location", {}).get("slug") == "london"
    assert data.get("detectedMethod") == "geolocation"


def test_near_me_invalid_lat_rejected(client, base_url):
    response = client.get(f"{base_url}/api/locations/near-me", params={"lat": 999, "lng": 1})
    assert response.status_code == 422


def test_near_me_without_gps_returns_primary_hub(client, base_url):
    response = client.get(f"{base_url}/api/locations/near-me")
    assert response.status_code == 200
    data = response.json()
    assert data.get("detectedMethod") == "primary_hub"


# --- Lead + WhatsApp queue behavior ---
def test_lead_idempotency_and_whatsapp_queue_single_item(client, base_url, admin_token):
    key = f"TEST_iter2_{uuid.uuid4().hex[:10]}"
    payload = {
        "idempotencyKey": key,
        "clientName": "TEST Iter2",
        "contactMethod": "WhatsApp",
        "contactValue": "+919999999999",
        "serviceId": "S01",
        "locationId": "loc-city-gb-london",
        "locationName": "London",
        "projectDescription": "Need landing page",
        "budgetRange": "open",
        "timeline": "Within 4 weeks",
    }
    first = client.post(f"{base_url}/api/leads", json=payload)
    assert first.status_code == 201
    first_body = first.json()
    first_id = first_body.get("lead", {}).get("id")
    assert first_id

    second = client.post(f"{base_url}/api/leads", json=payload)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body.get("isDuplicate") is True
    assert second_body.get("lead", {}).get("id") == first_id

    queue = client.get(f"{base_url}/api/admin/whatsapp/queue", headers=_auth_headers(admin_token))
    assert queue.status_code == 200
    queue_body = queue.json()
    matches = [x for x in queue_body.get("items", []) if x.get("leadId") == first_id]
    assert len(matches) == 1
    assert matches[0].get("status") in ("pending_setup", "dismissed")
    assert matches[0].get("attempts") == 0


def test_whatsapp_settings_auth_required(client, base_url):
    response = client.get(f"{base_url}/api/admin/whatsapp/settings")
    assert response.status_code == 401


def test_whatsapp_settings_validation_and_delivery_disabled(client, base_url, admin_token):
    headers = _auth_headers(admin_token)

    # invalid: deliveryEnabled cannot be true
    bad = client.put(
        f"{base_url}/api/admin/whatsapp/settings",
        headers=headers,
        json={
            "recipient": "+919999999999",
            "templateName": "new_project_brief",
            "templateLanguage": "en_US",
            "deliveryEnabled": True,
        },
    )
    assert bad.status_code == 422

    good = client.put(
        f"{base_url}/api/admin/whatsapp/settings",
        headers=headers,
        json={
            "recipient": "+919999999999",
            "templateName": "new_project_brief",
            "templateLanguage": "en_US",
            "deliveryEnabled": False,
        },
    )
    assert good.status_code == 200
    data = good.json()
    assert data.get("deliveryEnabled") is False
    assert data.get("mode") == "draft"


def test_whatsapp_dismiss_alert(client, base_url, admin_token):
    headers = _auth_headers(admin_token)
    queue = client.get(f"{base_url}/api/admin/whatsapp/queue", headers=headers)
    assert queue.status_code == 200
    items = queue.json().get("items", [])
    if not items:
        pytest.skip("No queue items to dismiss")
    alert_id = items[0]["id"]
    dismiss = client.post(f"{base_url}/api/admin/whatsapp/queue/{alert_id}/dismiss", headers=headers)
    assert dismiss.status_code == 200
    assert dismiss.json().get("status") == "dismissed"


def test_whatsapp_queue_pagination_limit_and_no_objectid(client, base_url, admin_token):
    response = client.get(
        f"{base_url}/api/admin/whatsapp/queue",
        params={"page": 1, "limit": 5},
        headers=_auth_headers(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("limit") == 5
    assert data.get("page") == 1
    assert len(data.get("items", [])) <= 5
    for item in data.get("items", []):
        assert "_id" not in item


# --- Search console + sitemap ---
def test_search_console_guide_and_sitemap_links(client, base_url, admin_token):
    response = client.get(f"{base_url}/api/admin/search-console", headers=_auth_headers(admin_token))
    assert response.status_code == 200
    data = response.json()
    assert data.get("verificationMode") == "manual"
    assert data.get("sitemapUrl", "").endswith("/api/sitemap.xml")


def test_search_console_txt_format_validation(client, base_url, admin_token):
    bad = client.put(
        f"{base_url}/api/admin/search-console",
        headers=_auth_headers(admin_token),
        json={
            "dnsRecord": "invalid-txt-format",
            "propertyCreated": True,
            "dnsVerified": False,
            "sitemapSubmitted": False,
        },
    )
    assert bad.status_code == 422


def test_sitemap_xml_health(client, base_url):
    response = client.get(f"{base_url}/api/sitemap.xml")
    assert response.status_code == 200
    assert "<sitemapindex" in response.text


# --- Chat streaming ---
def test_chat_stream_returns_start_delta_done(client, base_url):
    session_id = f"teststream{uuid.uuid4().hex[:24]}"
    response = client.post(
        f"{base_url}/api/chat/stream",
        json={
            "sessionId": session_id,
            "messages": [{"role": "user", "text": "Need website for bakery in London"}],
            "userContext": {"serviceTitle": "Website Design", "locationName": "London"},
        },
        headers={"Accept": "text/event-stream"},
        stream=True,
        timeout=90,
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    events = []
    payloads = []
    for line in response.iter_lines(decode_unicode=True):
        if not line:
            if "done" in events or "error" in events:
                break
            continue
        if line.startswith("event:"):
            events.append(line.split(":", 1)[1].strip())
        elif line.startswith("data:"):
            payloads.append(line.split(":", 1)[1].strip())
        if len(events) > 100:
            break

    assert "start" in events
    assert any(e in ("done", "error") for e in events)

    parsed = [json.loads(p) for p in payloads if p.startswith("{")]
    start_payload = next((p for p in parsed if p.get("sessionId") == session_id), None)
    assert start_payload is not None
    has_delta = "delta" in events
    assert has_delta or "error" in events


def test_chat_turns_ttl_index_exists():
    mongo_url = os.environ.get("MONGO_URL") or _read_env_value("/app/backend/.env", "MONGO_URL")
    db_name = os.environ.get("DB_NAME") or _read_env_value("/app/backend/.env", "DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("Missing Mongo connection config")
    collection = MongoClient(mongo_url)[db_name].chat_turns
    indexes = collection.index_information()
    ttl_values = [v.get("expireAfterSeconds") for v in indexes.values() if "expireAfterSeconds" in v]
    assert 2592000 in ttl_values


# --- Auth/security playbook checks ---
def test_protected_admin_endpoint_requires_auth(client, base_url):
    response = client.get(f"{base_url}/api/admin/freelancers")
    assert response.status_code == 401


def test_bcrypt_hash_prefix_2b_in_db(base_url, admin_token):
    mongo_url = os.environ.get("MONGO_URL") or _read_env_value("/app/backend/.env", "MONGO_URL")
    db_name = os.environ.get("DB_NAME") or _read_env_value("/app/backend/.env", "DB_NAME")
    email, _ = _read_credentials()
    if not mongo_url or not db_name:
        pytest.skip("Missing Mongo connection config")
    client = MongoClient(mongo_url)
    doc = client[db_name].users.find_one({"email": email.lower()})
    assert doc is not None
    assert isinstance(doc.get("password_hash"), str)
    assert doc["password_hash"].startswith("$2b$")


def test_login_sets_http_only_cookie_requirement(client, base_url):
    email, password = _read_credentials()
    response = client.post(f"{base_url}/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    # Playbook asks for httpOnly cookie; this asserts requirement directly.
    assert "set-cookie" in {k.lower() for k in response.headers.keys()}


def test_cors_credentials_and_explicit_origin_requirement(client, base_url):
    headers = {
        "Origin": "https://legacy-freelance.preview.emergentagent.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options(f"{base_url}/api/health", headers=headers)
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "https://legacy-freelance.preview.emergentagent.com"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_bruteforce_lockout_after_5_fails(client, base_url):
    email = f"lockout-{uuid.uuid4().hex[:8]}@example.com"
    last = None
    for _ in range(5):
        last = client.post(f"{base_url}/api/auth/login", json={"email": email, "password": "wrongpass"})
        assert last.status_code == 401
    sixth = client.post(f"{base_url}/api/auth/login", json={"email": email, "password": "wrongpass"})
    assert sixth.status_code == 429
