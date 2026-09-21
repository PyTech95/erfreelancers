"""Iteration 3 regression: hardened prod endpoints (CORS, security headers, rate limit,
JWT auth-gate, chatbot, SEO, marketplace-hardened slug flows)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = "https://marketplace-hardened.preview.emergentagent.com".rstrip("/")
ADMIN_EMAIL = "rajeev.pytech@gmail.com"
ADMIN_PASSWORD = "ErFreelancer@2026Admin"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Public smoke ----------
class TestPublicSmoke:
    def test_health(self, client):
        r = client.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_services_count_14(self, client):
        r = client.get(f"{BASE_URL}/api/services")
        assert r.status_code == 200
        data = r.json()
        arr = data if isinstance(data, list) else data.get("services") or data.get("items") or []
        assert len(arr) == 14

    def test_service_marketplace_hardened(self, client):
        r = client.get(f"{BASE_URL}/api/services/marketplace-hardened")
        # The seeded slug for hardened deploy; expect 200 or 404 gracefully
        assert r.status_code in (200, 404)

    def test_service_unknown_404(self, client):
        r = client.get(f"{BASE_URL}/api/services/no-such-service-xyz-987")
        assert r.status_code == 404

    def test_locations_query(self, client):
        r = client.get(f"{BASE_URL}/api/locations", params={"q": "london"})
        assert r.status_code == 200

    def test_locations_country(self, client):
        r = client.get(f"{BASE_URL}/api/locations", params={"country": "India", "limit": 5})
        assert r.status_code == 200

    def test_locations_near_me_default(self, client):
        r = client.get(f"{BASE_URL}/api/locations/near-me")
        assert r.status_code == 200

    def test_locations_near_me_latlng(self, client):
        r = client.get(f"{BASE_URL}/api/locations/near-me",
                       params={"lat": 51.5074, "lng": -0.1278})
        assert r.status_code == 200

    def test_freelancers_filters(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers",
                       params={"serviceId": "S01", "q": "web", "region": "india", "limit": 10})
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict) or isinstance(d, list)
        if isinstance(d, dict):
            # totalActive presence
            assert ("totalActive" in d) or ("items" in d) or ("freelancers" in d)

    def test_freelancer_unknown_404(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers/no-such-slug-xyz-987")
        assert r.status_code == 404

    def test_pages_resolve_404(self, client):
        r = client.get(f"{BASE_URL}/api/pages/resolve", params={"path": "/no/such/path/xyz/"})
        assert r.status_code == 404

    def test_map_hubs(self, client):
        r = client.get(f"{BASE_URL}/api/map/hubs")
        assert r.status_code == 200


# ---------- Leads (public form) ----------
class TestLeadsFlow:
    IDEMP_KEY = f"TEST_iter3_{uuid.uuid4().hex[:10]}"
    LEAD_ID = None

    def test_create_lead(self, client):
        payload = {
            "clientName": "TEST_Iter3",
            "contactValue": "9999999999",
            "serviceId": "S01",
            "projectDescription": "iter3 regression lead",
            "locationName": "Delhi",
            "budgetRange": "10k-50k",
            "idempotencyKey": TestLeadsFlow.IDEMP_KEY,
        }
        r = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code in (200, 201), r.text[:300]
        d = r.json()
        lead = d.get("lead") or d
        TestLeadsFlow.LEAD_ID = lead.get("id") or lead.get("leadId")
        assert TestLeadsFlow.LEAD_ID

    def test_idempotency_duplicate(self, client):
        payload = {
            "clientName": "TEST_Iter3",
            "contactValue": "9999999999",
            "serviceId": "S01",
            "projectDescription": "iter3 regression lead",
            "locationName": "Delhi",
            "budgetRange": "10k-50k",
            "idempotencyKey": TestLeadsFlow.IDEMP_KEY,
        }
        r = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 200
        assert r.json().get("isDuplicate") is True


# ---------- Chat (LLM + fallback) ----------
class TestChat:
    def test_chat_message(self, client):
        r = client.post(
            f"{BASE_URL}/api/chat/message",
            json={"messages": [{"role": "user", "text": "I need an ecommerce site for my bakery in Delhi"}]},
            timeout=60,
        )
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        reply = d.get("reply") or d.get("message")
        assert reply and len(str(reply)) > 0

    def test_chat_finalize(self, client):
        payload = {
            "clientName": "TEST_ChatIter3",
            "contactValue": "8888888888",
            "projectDescription": "Bakery ecommerce",
            "messages": [{"role": "user", "text": "hi"}],
        }
        r = client.post(f"{BASE_URL}/api/chat/finalize", json=payload, timeout=45)
        assert r.status_code in (200, 201), r.text[:300]


# ---------- Freelancer register ----------
class TestRegister:
    def test_register_under_review(self, client):
        payload = {
            "displayName": f"TEST_Iter3_Reg_{uuid.uuid4().hex[:6]}",
            "services": ["S01"],
            "bio": "Iter3 regression",
        }
        r = client.post(f"{BASE_URL}/api/freelancers/register", json=payload)
        assert r.status_code in (200, 201), r.text[:200]
        raw = r.json()
        d = raw.get("profile") or raw
        assert d.get("profileState") == "under_review"


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{BASE_URL}/api/auth/login",
                        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and "user" in d
        assert d["user"].get("email") == ADMIN_EMAIL

    def test_login_wrong(self, client):
        r = client.post(f"{BASE_URL}/api/auth/login",
                        json={"email": ADMIN_EMAIL, "password": "wrongPass!123abc"})
        assert r.status_code in (401, 429)

    def test_me(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        j = r.json()
        email = j.get("user", {}).get("email") if isinstance(j.get("user"), dict) else j.get("email")
        assert email == ADMIN_EMAIL


# ---------- Auth-gate: admin endpoints require token ----------
class TestAuthGate:
    ADMIN_ENDPOINTS_GET = [
        "/api/leads",
        "/api/admin/freelancers",
        "/api/admin/whatsapp/settings",
        "/api/admin/search-console",
    ]

    @pytest.mark.parametrize("path", ADMIN_ENDPOINTS_GET)
    def test_get_unauth(self, path):
        r = requests.get(f"{BASE_URL}{path}")
        assert r.status_code == 401, f"{path} expected 401 got {r.status_code}"

    @pytest.mark.parametrize("path", ADMIN_ENDPOINTS_GET)
    def test_get_authed(self, path, auth_headers):
        r = requests.get(f"{BASE_URL}{path}", headers=auth_headers)
        assert r.status_code == 200, f"{path} expected 200 got {r.status_code}: {r.text[:200]}"

    def test_pipeline_run_unauth(self):
        r = requests.post(f"{BASE_URL}/api/pipeline/run", json={"count": 5})
        assert r.status_code == 401

    def test_pipeline_run_authed(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/pipeline/run",
                          json={"count": 5}, headers=auth_headers)
        assert r.status_code == 200


# ---------- Rate limiting on login ----------
class TestRateLimit:
    def test_login_burst_429(self, client):
        got_429 = False
        # 15 rapid attempts with wrong password; slowapi limit is 10/min
        for i in range(15):
            r = client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": f"nobody+{i}@example.com", "password": "x"})
            if r.status_code == 429:
                got_429 = True
                break
        assert got_429, "Expected 429 within 15 rapid login attempts"


# ---------- SEO ----------
class TestSEO:
    def test_sitemap_index(self, client):
        r = client.get(f"{BASE_URL}/api/sitemap.xml")
        assert r.status_code == 200
        assert "sitemapindex" in r.text

    def test_sitemap_core(self, client):
        r = client.get(f"{BASE_URL}/api/sitemaps/sitemap-core.xml")
        assert r.status_code == 200
        assert "<urlset" in r.text or "<url>" in r.text

    def test_robots(self, client):
        r = client.get(f"{BASE_URL}/api/robots.txt")
        assert r.status_code == 200
        assert "Sitemap" in r.text or "User-agent" in r.text


# ---------- Security headers + 500 handler safety ----------
class TestHardening:
    def test_security_headers(self, client):
        r = client.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        h = {k.lower(): v for k, v in r.headers.items()}
        # We expect at least a subset of hardened headers
        assert "strict-transport-security" in h, f"missing HSTS: {list(h.keys())}"
        assert h.get("x-content-type-options", "").lower() == "nosniff"
        assert "x-frame-options" in h
        assert "referrer-policy" in h

    def test_docs_disabled(self, client):
        # Backend docs are only reachable under /api prefix through ingress
        r1 = client.get(f"{BASE_URL}/api/docs")
        r2 = client.get(f"{BASE_URL}/api/openapi.json")
        r3 = client.get(f"{BASE_URL}/api/redoc")
        assert r1.status_code == 404
        assert r2.status_code == 404
        assert r3.status_code == 404
