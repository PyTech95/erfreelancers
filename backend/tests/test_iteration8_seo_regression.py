"""Iteration 8: SEO/GEO + regression tests after full 51k page corpus + dynamic sitemaps."""
import os
import re
import uuid
import xml.etree.ElementTree as ET

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://deploy-hub-266.preview.emergentagent.com").rstrip("/")
CANONICAL = "https://deploy-hub-266.preview.emergentagent.com"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Regression: core API ----------
def test_health(sess):
    r = sess.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200


def test_services_14(sess):
    r = sess.get(f"{BASE_URL}/api/services", timeout=15)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else data.get("items", data.get("services", []))
    assert len(items) == 14, f"Expected 14 services, got {len(items)}"


def test_freelancers_list(sess):
    r = sess.get(f"{BASE_URL}/api/freelancers", timeout=20)
    assert r.status_code == 200


def test_lead_creation(sess):
    # need a real service + location id
    services = sess.get(f"{BASE_URL}/api/services").json()
    services = services if isinstance(services, list) else services.get("items", services.get("services", []))
    svc_id = services[0]["id"] if "id" in services[0] else services[0].get("serviceId")
    # resolve a known page to get locationId
    resolve = sess.get(f"{BASE_URL}/api/pages/resolve", params={"path": "/locations/india/mumbai/freelance-web-developer/"}, timeout=20)
    assert resolve.status_code == 200, resolve.text
    page = resolve.json()
    loc_id = page.get("locationId") or page.get("location", {}).get("id")
    svc_id = page.get("serviceId") or svc_id
    payload = {
        "idempotencyKey": str(uuid.uuid4()),
        "clientName": "TEST_Regression User",
        "contactValue": "test.regression@example.com",
        "serviceId": svc_id,
        "locationId": loc_id,
        "projectDescription": "Automated regression test lead creation.",
        "budgetRange": "500-1000",
    }
    r = sess.post(f"{BASE_URL}/api/leads", json=payload, timeout=30)
    assert r.status_code in (200, 201), r.text


# ---------- Admin auth ----------
def test_admin_login_and_me(sess):
    r = sess.post(f"{BASE_URL}/api/auth/login",
                  json={"email": "admin@erfreelancer.com", "password": "Admin@12345"}, timeout=20)
    assert r.status_code == 200, r.text
    token = r.json().get("token") or r.json().get("access_token")
    assert token
    me = sess.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert me.status_code == 200


def test_admin_login_wrong(sess):
    r = sess.post(f"{BASE_URL}/api/auth/login",
                  json={"email": "admin@erfreelancer.com", "password": "wrong"}, timeout=15)
    assert r.status_code == 401


# ---------- Sitemap correctness ----------
def test_sitemap_index_13_children(sess):
    r = sess.get(f"{BASE_URL}/api/sitemap.xml", timeout=30)
    assert r.status_code == 200
    root = ET.fromstring(r.text)
    children = root.findall("sm:sitemap/sm:loc", NS)
    urls = [c.text for c in children]
    assert len(urls) == 13, f"Expected 13 children, got {len(urls)}: {urls}"
    assert any("sitemap-core.xml" in u for u in urls)
    assert any("sitemap-blog.xml" in u for u in urls)
    for i in range(1, 12):
        assert any(f"sitemap-pages-{i}.xml" in u for u in urls)
    # all locs use canonical domain
    for u in urls:
        assert u.startswith(CANONICAL), u


def test_shard_1_has_5000(sess):
    r = sess.get(f"{BASE_URL}/api/sitemaps/sitemap-pages-1.xml", timeout=60)
    assert r.status_code == 200
    root = ET.fromstring(r.text)
    locs = root.findall("sm:url/sm:loc", NS)
    assert len(locs) == 5000, f"shard 1 has {len(locs)}"
    for l in locs[:3] + locs[-3:]:
        assert l.text.startswith(CANONICAL)


def test_shard_11_has_1002(sess):
    r = sess.get(f"{BASE_URL}/api/sitemaps/sitemap-pages-11.xml", timeout=60)
    assert r.status_code == 200
    root = ET.fromstring(r.text)
    locs = root.findall("sm:url/sm:loc", NS)
    assert len(locs) == 1002, f"shard 11 has {len(locs)}"


def test_total_urls_51005(sess):
    total = 0
    # core
    core = ET.fromstring(sess.get(f"{BASE_URL}/api/sitemaps/sitemap-core.xml", timeout=30).text)
    total += len(core.findall("sm:url/sm:loc", NS))
    # blog
    blog = ET.fromstring(sess.get(f"{BASE_URL}/api/sitemaps/sitemap-blog.xml", timeout=30).text)
    total += len(blog.findall("sm:url/sm:loc", NS))
    # pages 1..11
    for i in range(1, 12):
        r = sess.get(f"{BASE_URL}/api/sitemaps/sitemap-pages-{i}.xml", timeout=60)
        total += len(ET.fromstring(r.text).findall("sm:url/sm:loc", NS))
    assert total == 51005, f"total urls = {total}"


def test_spot_check_locs_resolve(sess):
    # shard 1 first + middle + last, shard 6 middle, shard 11 last
    checks = []
    for i in (1, 6, 11):
        r = sess.get(f"{BASE_URL}/api/sitemaps/sitemap-pages-{i}.xml", timeout=60)
        locs = [l.text for l in ET.fromstring(r.text).findall("sm:url/sm:loc", NS)]
        checks.extend([locs[0], locs[len(locs) // 2], locs[-1]])
    for full in checks:
        path = full.replace(CANONICAL, "")
        r = sess.get(f"{BASE_URL}/api/pages/resolve", params={"path": path}, timeout=30)
        assert r.status_code == 200, f"{path} => {r.status_code}"


# ---------- robots & llms ----------
def test_frontend_robots_txt():
    r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
    assert r.status_code == 200
    body = r.text
    assert "GPTBot" in body
    assert "ClaudeBot" in body
    assert "PerplexityBot" in body
    assert "Google-Extended" in body
    assert f"Sitemap: {CANONICAL}/api/sitemap.xml" in body or f"{BASE_URL}/api/sitemap.xml" in body


def test_api_robots_txt(sess):
    r = sess.get(f"{BASE_URL}/api/robots.txt", timeout=15)
    assert r.status_code == 200
    assert "GPTBot" in r.text
    assert f"{CANONICAL}/api/sitemap.xml" in r.text


def test_llms_txt():
    r = requests.get(f"{BASE_URL}/llms.txt", timeout=15)
    assert r.status_code == 200
    assert len(r.text) > 50


# ---------- SEO manifest & audit ----------
def test_seo_manifest(sess):
    r = sess.get(f"{BASE_URL}/api/seo/sitemaps-manifest", timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["totalPublicUrls"] == 51005, j["totalPublicUrls"]
    assert "indexingGuidance" in j
    assert "googlePingUrl" not in j


def test_seo_audit_100(sess):
    r = sess.get(f"{BASE_URL}/api/seo/audit", params={"sample": 100}, timeout=60)
    assert r.status_code == 200
    j = r.json()
    assert j["passedCount"] == 100, f"passed={j['passedCount']} warn={j.get('warningCount')} err={j.get('errorCount')}"
    assert j["errorCount"] == 0
    assert j["duplicateCanonicalsFound"] == 0
