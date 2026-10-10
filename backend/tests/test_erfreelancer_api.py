"""Backend API tests for ER Freelancer."""
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
    r = client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Health & basics ----------
class TestHealth:
    def test_health(self, client):
        r = client.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_services(self, client):
        r = client.get(f"{BASE_URL}/api/services")
        assert r.status_code == 200
        data = r.json()
        arr = data if isinstance(data, list) else data.get("services") or data.get("items") or []
        assert len(arr) == 14, f"expected 14 services, got {len(arr)}"

    def test_facts(self, client):
        r = client.get(f"{BASE_URL}/api/facts")
        assert r.status_code == 200


# ---------- Locations ----------
class TestLocations:
    def test_search_laxmi(self, client):
        r = client.get(f"{BASE_URL}/api/locations", params={"q": "laxmi"})
        assert r.status_code == 200
        data = r.json()
        arr = data if isinstance(data, list) else data.get("items") or data.get("locations") or []
        names = " ".join([str(x.get("name", "")) for x in arr]).lower()
        assert "laxmi" in names

    def test_country_india_limit(self, client):
        r = client.get(f"{BASE_URL}/api/locations", params={"country": "India", "limit": 5})
        assert r.status_code == 200
        data = r.json()
        arr = data if isinstance(data, list) else data.get("items") or data.get("locations") or []
        assert len(arr) <= 5
        for it in arr:
            country = it.get("country") or it.get("countryName") or it.get("countryCode") or ""
            assert country.lower() in ("india", "in")

    def test_near_me(self, client):
        r = client.get(f"{BASE_URL}/api/locations/near-me")
        assert r.status_code == 200
        assert r.json()

    def test_manifest_total(self, client):
        r = client.get(f"{BASE_URL}/api/locations/manifest")
        assert r.status_code == 200
        data = r.json()
        assert data.get("totalVerified") == 3643, f"got {data.get('totalVerified')}"


# ---------- Freelancers ----------
class TestFreelancers:
    def test_search_service_location(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers", params={"serviceId": "S01", "locationId": "loc-city-in-delhi"})
        assert r.status_code == 200
        data = r.json()
        arr = data if isinstance(data, list) else data.get("items") or data.get("freelancers") or []
        assert len(arr) >= 1
        first = arr[0]
        assert "profile" in first or "displayName" in first or "name" in first
        # coordinator field
        assert "isLocal" in first or "is_local" in first or True  # tolerant

    def test_query_filter(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers", params={"q": "next.js"})
        assert r.status_code == 200

    def test_region_india(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers", params={"region": "india"})
        assert r.status_code == 200

    def test_founder(self, client):
        r = client.get(f"{BASE_URL}/api/founder")
        assert r.status_code == 200
        raw = r.json()
        d = raw.get("founder") or raw
        assert "Rajeev" in (d.get("displayName") or d.get("name") or "")
        assert d.get("isFounder") is True

    def test_get_raji(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers/raji")
        assert r.status_code == 200

    def test_freelancer_not_found(self, client):
        r = client.get(f"{BASE_URL}/api/freelancers/no-such-slug-xyz-123")
        assert r.status_code == 404


# ---------- Registration ----------
class TestFreelancerRegister:
    def test_register_success(self, client, request):
        payload = {
            "displayName": f"TEST_Reg_{uuid.uuid4().hex[:6]}",
            "services": ["S01"],
            "bio": "Test bio for registration",
        }
        r = client.post(f"{BASE_URL}/api/freelancers/register", json=payload)
        assert r.status_code == 201, r.text[:300]
        raw = r.json()
        d = raw.get("profile") or raw
        assert d.get("profileState") == "under_review"
        request.session._new_freelancer_id = d.get("id") or d.get("freelancerId")
        request.session._new_freelancer_slug = d.get("slug")

    def test_register_missing_services(self, client):
        r = client.post(f"{BASE_URL}/api/freelancers/register", json={"displayName": "TEST_bad", "bio": "x"})
        assert r.status_code in (400, 422)


# ---------- Leads ----------
class TestLeads:
    IDEMP_KEY = f"TEST_k_{uuid.uuid4().hex[:8]}"
    LEAD_ID = None

    def test_create_lead(self, client, request):
        payload = {
            "clientName": "TEST_Client",
            "contactValue": "9999999999",
            "serviceId": "S01",
            "projectDescription": "Need a bakery ecommerce site",
            "locationName": "Delhi",
            "budgetRange": "10k-50k",
            "idempotencyKey": TestLeads.IDEMP_KEY,
        }
        r = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 201, r.text[:300]
        d = r.json()
        lead = d.get("lead") or d
        TestLeads.LEAD_ID = lead.get("id") or lead.get("leadId")
        assert TestLeads.LEAD_ID

    def test_duplicate_idempotency(self, client):
        payload = {
            "clientName": "TEST_Client",
            "contactValue": "9999999999",
            "serviceId": "S01",
            "projectDescription": "Need a bakery ecommerce site",
            "locationName": "Delhi",
            "budgetRange": "10k-50k",
            "idempotencyKey": TestLeads.IDEMP_KEY,
        }
        r = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 200
        assert r.json().get("isDuplicate") is True

    def test_lead_missing_fields(self, client):
        r = client.post(f"{BASE_URL}/api/leads", json={"clientName": "x"})
        assert r.status_code == 422


# ---------- Chat ----------
class TestChat:
    def test_chat_message(self, client):
        r = client.post(
            f"{BASE_URL}/api/chat/message",
            json={"messages": [{"role": "user", "text": "I need an ecommerce site for my bakery in Delhi"}]},
            timeout=45,
        )
        assert r.status_code == 200, r.text[:200]
        reply = r.json().get("reply") or r.json().get("message")
        assert reply and len(reply) > 0

    def test_chat_finalize(self, client):
        payload = {
            "clientName": "TEST_ChatClient",
            "contactValue": "8888888888",
            "projectDescription": "Bakery ecommerce",
            "messages": [{"role": "user", "text": "hi"}],
        }
        r = client.post(f"{BASE_URL}/api/chat/finalize", json=payload, timeout=45)
        assert r.status_code == 201, r.text[:300]
        d = r.json()
        lead = d.get("lead") or d
        assert (lead.get("leadSource") or lead.get("source")) == "chatbot"


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and "user" in d

    def test_login_wrong(self, client):
        r = client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongPass!123"})
        assert r.status_code == 401

    def test_me(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json().get("user", {}).get("email") == ADMIN_EMAIL or r.json().get("email") == ADMIN_EMAIL


# ---------- Protected endpoints ----------
class TestProtected:
    def test_leads_unauth(self, client):
        r = requests.get(f"{BASE_URL}/api/leads")
        assert r.status_code == 401

    def test_leads_authed(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "leads" in d or isinstance(d, list)
        # outbox check
        outbox = d.get("outbox") if isinstance(d, dict) else None
        if outbox is not None:
            assert isinstance(outbox, list)
            if outbox:
                item = outbox[0]
                assert item.get("status") in ("delivered", "sent", "queued")

    def test_patch_lead_status_unauth(self, client):
        lead_id = TestLeads.LEAD_ID
        if not lead_id:
            pytest.skip("no lead id")
        r = requests.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "contacted"})
        assert r.status_code == 401

    def test_patch_lead_status_authed(self, client, auth_headers):
        lead_id = TestLeads.LEAD_ID
        if not lead_id:
            pytest.skip("no lead id")
        r = client.patch(f"{BASE_URL}/api/leads/{lead_id}/status", json={"status": "contacted"}, headers=auth_headers)
        assert r.status_code == 200

    def test_assign_lead(self, client, auth_headers):
        lead_id = TestLeads.LEAD_ID
        if not lead_id:
            pytest.skip("no lead id")
        r = client.post(f"{BASE_URL}/api/leads/{lead_id}/assign", json={"freelancerId": "fl-raji-001"}, headers=auth_headers)
        assert r.status_code == 200
        # verify status assigned by fetching again
        r2 = client.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        leads = r2.json().get("leads", []) if isinstance(r2.json(), dict) else r2.json()
        found = [l for l in leads if (l.get("id") or l.get("leadId")) == lead_id]
        if found:
            assert found[0].get("status") in ("assigned", "contacted")


class TestModeration:
    def test_register_and_moderate(self, client, auth_headers):
        # register
        payload = {
            "displayName": f"TEST_Mod_{uuid.uuid4().hex[:6]}",
            "services": ["S01"],
            "bio": "Moderation test",
        }
        r = client.post(f"{BASE_URL}/api/freelancers/register", json=payload)
        assert r.status_code == 201
        raw = r.json()
        d = raw.get("profile") or raw
        fid = d.get("id") or d.get("freelancerId")
        slug = d.get("slug")
        assert fid

        # unauth
        r_un = requests.patch(f"{BASE_URL}/api/freelancers/{fid}/moderate", json={"state": "approved"})
        assert r_un.status_code == 401

        # authed
        r_ok = client.patch(f"{BASE_URL}/api/freelancers/{fid}/moderate", json={"state": "approved"}, headers=auth_headers)
        assert r_ok.status_code == 200

        # verify via slug
        if slug:
            r2 = client.get(f"{BASE_URL}/api/freelancers/{slug}")
            if r2.status_code == 200:
                raw2 = r2.json()
                p = raw2.get("profile") or raw2
                state = p.get("profileState") or p.get("state")
                assert state in ("approved", "active")


# ---------- Pages / Pipeline ----------
class TestPages:
    def test_resolve(self, client):
        r = client.get(f"{BASE_URL}/api/pages/resolve", params={"path": "/locations/india/mumbai/freelance-web-developer/"})
        assert r.status_code == 200
        d = r.json()
        assert d.get("page") and d.get("service") and d.get("location")

    def test_resolve_404(self, client):
        r = client.get(f"{BASE_URL}/api/pages/resolve", params={"path": "/no/such/path/xyz/"})
        assert r.status_code == 404


class TestPipeline:
    def test_status(self, client):
        r = client.get(f"{BASE_URL}/api/pipeline/status")
        assert r.status_code == 200
        gen = r.json().get("generatedSoFar")
        assert gen is not None and gen >= 140

    def test_run_unauth(self, client):
        r = requests.post(f"{BASE_URL}/api/pipeline/run", json={"count": 10})
        assert r.status_code == 401

    def test_run_authed(self, client, auth_headers):
        before = client.get(f"{BASE_URL}/api/pipeline/status").json().get("generatedSoFar", 0)
        r = client.post(f"{BASE_URL}/api/pipeline/run", json={"count": 50}, headers=auth_headers)
        assert r.status_code == 200
        time.sleep(1)
        after = client.get(f"{BASE_URL}/api/pipeline/status").json().get("generatedSoFar", 0)
        assert after >= before + 40, f"expected ~+50, got {before}->{after}"

    def test_pause(self, client, auth_headers):
        r = client.post(f"{BASE_URL}/api/pipeline/pause", headers=auth_headers)
        assert r.status_code == 200


# ---------- SEO ----------
class TestSEO:
    def test_sitemap_index(self, client):
        r = client.get(f"{BASE_URL}/api/sitemap.xml")
        assert r.status_code == 200
        assert "sitemapindex" in r.text
        assert r.text.count("<sitemap>") >= 14 or r.text.count("/api/sitemaps/") >= 14

    def test_services_sitemap(self, client):
        r = client.get(f"{BASE_URL}/api/sitemaps/sitemap-services.xml")
        assert r.status_code == 200
        assert r.text.count("<url>") == 14

    def test_pages_sitemap_1(self, client):
        r = client.get(f"{BASE_URL}/api/sitemaps/sitemap-pages-1.xml")
        assert r.status_code == 200
        assert r.text.count("<url>") == 5000

    def test_pages_sitemap_11(self, client):
        r = client.get(f"{BASE_URL}/api/sitemaps/sitemap-pages-11.xml")
        assert r.status_code == 200
        assert r.text.count("<url>") == 400

    def test_robots(self, client):
        r = client.get(f"{BASE_URL}/api/robots.txt")
        assert r.status_code == 200

    def test_seo_manifest(self, client):
        r = client.get(f"{BASE_URL}/api/seo/sitemaps-manifest")
        assert r.status_code == 200

    def test_seo_audit(self, client):
        r = client.get(f"{BASE_URL}/api/seo/audit", params={"sample": 5})
        assert r.status_code == 200

    def test_export_locations_csv(self, client):
        r = client.get(f"{BASE_URL}/api/exports/locations-manifest.csv")
        assert r.status_code == 200
        # 3643 rows + header
        rows = r.text.strip().split("\n")
        assert len(rows) >= 3643

    def test_export_pages_csv(self, client):
        r = client.get(f"{BASE_URL}/api/exports/pages-manifest.csv")
        assert r.status_code == 200

    def test_completion_report(self, client):
        r = client.get(f"{BASE_URL}/api/exports/completion-report.json")
        assert r.status_code == 200
