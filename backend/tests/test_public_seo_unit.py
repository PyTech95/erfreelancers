"""Meaningful route, publication, confidentiality and HTML checks, with no live DB.

Run: PYTHONPATH=backend pytest backend/tests/test_public_seo_unit.py
"""
import asyncio
import copy
import json
import os
import re
from html import unescape
from pathlib import Path
from xml.etree import ElementTree

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "erf_public_seo_test")
os.environ.setdefault("PRODUCTION_CANONICAL_DOMAIN", "https://erfreelancers.com")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

import seo
import public_site
import store
from content_builder import generate_structured_page

run = asyncio.run


@pytest.fixture
def database(monkeypatch):
    database = AsyncMongoMockClient().get_database("public_seo_test")
    monkeypatch.setattr(seo, "db", database)
    monkeypatch.setattr(public_site, "db", database)
    monkeypatch.setattr(store, "db", database)
    monkeypatch.setenv("PRODUCTION_CANONICAL_DOMAIN", "https://erfreelancers.com")
    return database


def published_record():
    service = next(s for s in store.SERVICES if s.get("active", True))
    location = next(l for l in store.LOCATIONS if l["slug"] == "delhi")
    record = generate_structured_page(service, location, [])
    record.update(lifecycleState="approved", publishedAt="2026-01-02T03:04:05Z", lastModifiedAt="2026-02-03T04:05:06Z",
                  indexable=True, editorialReview={"approved": True})
    record["contentPackage"]["seo"]["indexable"] = True
    record["contentPackage"]["seo"].pop("robots", None)
    return record


def test_missing_and_unpublished_urls_are_not_homepage_soft_404(database):
    app = FastAPI()
    app.include_router(public_site.router)
    client = TestClient(app)
    for path in ["/this-page-does-not-exist/", "/services/made-up/", "/freelancers/no-profile/", "/blog/unpublished/"]:
        response = client.get(path)
        assert response.status_code == 404
        assert "noindex" in response.headers["x-robots-tag"]
        assert "<h1>Page not found</h1>" in response.text
    response = client.get("/api/public-page?path=/made-up/")
    assert response.status_code == 404 and response.json()["kind"] == "not-found"


def test_html_contains_same_bootstrap_metadata_without_javascript(database):
    app = FastAPI()
    app.include_router(public_site.router)
    client = TestClient(app)
    response = client.get("/services/freelance-web-developer/")
    assert response.status_code == 200
    match = re.search(r'<script id="page-data" type="application/json">(.*?)</script>', response.text, re.S)
    payload = json.loads(match.group(1))
    assert payload["canonical"] == "https://erfreelancers.com/services/freelance-web-developer/"
    assert payload["heading"] in unescape(response.text)
    assert len(re.findall(r"<h1[ >]", response.text)) == 1
    assert len(re.findall(r'rel="canonical"', response.text)) == 1
    assert payload["sections"][0]["body"] in unescape(response.text)
    browser = client.get("/services/freelance-web-developer/", headers={"User-Agent": "Googlebot"})
    assert browser.text == response.text
    assert client.get("/services/freelance-web-developer", follow_redirects=False).status_code == 308


def test_sitemap_lists_only_actual_reviewed_records_and_truthful_lastmod(database):
    published = published_record()
    pending = copy.deepcopy(published)
    pending.update(id="pending", canonicalPath=published["canonicalPath"].replace("freelance-web-developer", "freelance-app-developer"), lifecycleState="needs_review")
    legacy = copy.deepcopy(published)
    legacy.update(id="legacy", canonicalPath=published["canonicalPath"].replace("freelance-web-developer", "freelance-wordpress-developer"), editorialReview={})
    legacy["modelProvenance"]["engine"] = "deterministic-structured-builder-v1"
    run(database.pages.insert_many([published, pending, legacy]))
    inventory = run(seo.sitemap_inventory())
    landing_entries = [entry for name, entries in inventory.items() if name.startswith("sitemap-pages") for entry in entries]
    assert landing_entries == [(published["canonicalPath"], published["lastModifiedAt"])]
    assert "sitemap-pages-2.xml" not in inventory
    body = run(seo.sitemap_file("sitemap-pages-1.xml")).body.decode()
    document = ElementTree.fromstring(body)
    assert len(document) == 1
    assert "2026-02-03T04:05:06+00:00" in body
    core = run(seo.sitemap_file("sitemap-core.xml")).body.decode()
    assert "<lastmod>" not in core
    assert "googlePingUrl" not in run(seo.sitemaps_manifest())
    assert "Sector " not in " ".join(path for entries in inventory.values() for path, _ in entries)


def test_pending_combination_is_noindex_and_read_never_creates_rows(database):
    service = store.SERVICES[0]
    location = next(l for l in store.LOCATIONS if l["slug"] == "delhi")
    path = location["canonicalPath"] + service["slug"] + "/"
    data = run(public_site.page_data(path, 1))
    assert data["status"] == 200 and data["kind"] == "landing"
    assert data["robots"] == "noindex,follow"
    assert run(database.pages.count_documents({})) == 0
    published = published_record()
    run(database.pages.insert_one(published))
    data = run(public_site.page_data(path, 1))
    assert data["robots"].startswith("index,")
    assert run(database.pages.count_documents({})) == 1


def test_legacy_generated_claims_are_replaced_without_mutation(database):
    record = published_record()
    record["editorialReview"] = {}
    record["modelProvenance"]["engine"] = "deterministic-structured-builder-v1"
    record["contentPackage"]["hero"]["heading"] = "Fabricated guarantee and fake review"
    run(database.pages.insert_one(record))
    data = run(public_site.page_data(record["canonicalPath"], 1))
    assert "noindex" in data["robots"]
    assert data["heading"] != record["contentPackage"]["hero"]["heading"]
    stored = run(database.pages.find_one({"id": record["id"]}))
    assert stored["contentPackage"]["hero"]["heading"] == "Fabricated guarantee and fake review"


def test_private_profile_fields_and_unapproved_profiles_never_escape(database):
    approved = {"id": "real-test-profile", "slug": "real-person", "displayName": "Real Person", "profileState": "approved", "services": [], "bio": "Project expertise", "email": "private@example.com", "passwordHash": "private-hash", "userId": "private-user"}
    pending = {**approved, "id": "pending-profile", "slug": "pending-person", "profileState": "under_review"}
    run(database.freelancers.insert_many([approved, pending]))
    public = run(public_site.page_data("/freelancers/real-person/", 1))
    assert public["status"] == 200
    serialized = json.dumps(public)
    for private in ["private@example.com", "private-hash", "private-user"]:
        assert private not in serialized
    assert run(public_site.page_data("/freelancers/pending-person/", 1))["status"] == 404
    inventory = run(seo.sitemap_inventory())
    assert inventory["sitemap-freelancers.xml"] == [("/freelancers/real-person/", None)]


def test_pagination_self_canonical_and_out_of_range_404(database):
    run(database.freelancers.insert_many([{"id": f"real-{i}", "slug": f"person-{i:02}", "displayName": f"Person {i}", "profileState": "approved", "services": []} for i in range(31)]))
    data = run(public_site.page_data("/freelancers/", 2))
    assert data["canonical"] == "https://erfreelancers.com/freelancers/?page=2"
    assert data["pagination"]["previous"] == "/freelancers/"
    assert len(data["profiles"]) == 1
    assert run(public_site.page_data("/freelancers/", 3))["status"] == 404
    assert run(public_site.page_data("/services/", 2))["status"] == 404


def test_published_blog_and_safe_html_json_embedding(database):
    malicious = '</script><script>alert("x")</script>'
    run(database.blog_posts.insert_many([
        {"id": "post-1", "slug": "published", "title": "Safe " + malicious, "excerpt": "Article excerpt", "content": "Article body " + malicious, "status": "published", "author": "Editor"},
        {"id": "post-2", "slug": "draft", "title": "Draft title", "content": "Draft body", "status": "draft"},
    ]))
    data = run(public_site.page_data("/blog/published/", 1))
    html = public_site.render_html(data)
    assert '<script>alert("x")</script>' not in html
    match = re.search(r'<script id="page-data" type="application/json">(.*?)</script>', html, re.S)
    assert json.loads(match.group(1))["post"]["content"].endswith(malicious)
    assert run(public_site.page_data("/blog/draft/", 1))["status"] == 404
    assert len(run(seo.sitemap_inventory())["sitemap-blog.xml"]) == 1


def test_robots_allows_rendering_resources_and_uses_root_sitemap(database):
    body = run(seo.robots()).body.decode()
    assert "Disallow: /api/" not in body
    assert "Sitemap: https://erfreelancers.com/sitemap.xml" in body
    assert "<lastmod>" not in seo.url_entry("/services/")
    assert "&amp;" in seo.url_entry("/test/?a=1&b=2")
    assert seo.iso_lastmod("2999-01-01") is None


def test_assets_and_admin_noindex(database, tmp_path, monkeypatch):
    (tmp_path / "static").mkdir()
    (tmp_path / "static" / "app.js").write_text("/* public asset */")
    (tmp_path / "index.html").write_text('<html><head></head><body><div id="root"></div></body></html>')
    monkeypatch.setattr(public_site, "BUILD_DIR", tmp_path)
    app = FastAPI()
    app.include_router(public_site.router)
    client = TestClient(app)
    assert client.get("/static/app.js").status_code == 200
    assert client.get("/static/missing.js").status_code == 404
    assert "noindex" in client.get("/admin/").headers["x-robots-tag"]
    assert "noindex" in client.get("/join-as-freelancer/").headers["x-robots-tag"]


def test_same_named_locations_have_distinct_public_titles(database):
    titles = {}
    for location in store.LOCATIONS:
        data = run(public_site.page_data(location["canonicalPath"], 1))
        assert data["status"] == 200
        assert data["title"] not in titles, (titles.get(data["title"]), location["canonicalPath"])
        titles[data["title"]] = location["canonicalPath"]


def legacy_published_record():
    from url_paths import legacy_location_path
    record = published_record()
    record['canonicalPath'] = legacy_location_path(record['canonicalPath'])
    record['contentPackage']['canonical_path'] = record['canonicalPath']
    location = store.LOC_BY_ID[record['locationId']]
    record['contentPackage']['internal_link_ids'] = [legacy_location_path(location['canonicalPath'])]
    record['contentPackage']['seo']['canonical'] = 'https://erfreelancers.com' + record['canonicalPath']
    return record


def test_legacy_published_page_redirects_and_keeps_new_canonical_without_db_rewrite(database):
    from url_paths import canonical_location_path
    record = legacy_published_record()
    run(database.pages.insert_one(copy.deepcopy(record)))
    app = FastAPI()
    app.include_router(public_site.router)
    client = TestClient(app)
    current = canonical_location_path(record['canonicalPath'])
    for old in [record['canonicalPath'], record['canonicalPath'].rstrip('/')]:
        response = client.get(old + '?utm_source=gsc', follow_redirects=False)
        assert response.status_code == 301
        assert response.headers['location'] == current + '?utm_source=gsc'
    response = client.get(current)
    assert response.status_code == 200
    assert response.headers['x-robots-tag'].startswith('index,')
    assert 'https://erfreelancers.com' + current in response.text
    assert record['canonicalPath'] not in response.text
    payload = run(public_site.page_data(record['canonicalPath'], 1))
    assert payload['path'] == current
    assert payload['page']['contentPackage']['canonical_path'] == current
    assert payload['page']['contentPackage']['seo']['canonical'] == 'https://erfreelancers.com' + current
    assert record['canonicalPath'] not in json.dumps(payload['structuredData'])
    for path in [current, record['canonicalPath']]:
        assert run(store.get_page_by_path(path))['canonicalPath'] == current
    stored = run(database.pages.find_one({'id': record['id']}, {'_id': 0}))
    assert stored == record
    assert run(database.pages.count_documents({})) == 1


def test_migrated_sitemap_includes_legacy_publication_once_at_new_url(database):
    from url_paths import canonical_location_path
    record = legacy_published_record()
    run(database.pages.insert_one(record))
    inventory = run(seo.sitemap_inventory())
    entries = [path for name, rows in inventory.items() if name.startswith('sitemap-pages') for path, _ in rows]
    assert entries == [canonical_location_path(record['canonicalPath'])]
    assert all(not path.startswith('/locations/') for name, rows in inventory.items() if name.startswith('sitemap-locations') for path, _ in rows)
    assert ('/locations/', None) in inventory['sitemap-core.xml']
    location = store.LOC_BY_ID[record['locationId']]
    hub = run(public_site.page_data(location['canonicalPath'], 1))
    assert record['canonicalPath'] not in json.dumps(hub)


def test_invalid_legacy_location_never_redirects_to_another_route(database):
    app = FastAPI()
    app.include_router(public_site.router)
    client = TestClient(app)
    paths = ['/locations/australia/brisbane/zone-102-cluster/freelance-seo-expert/',
             '/australia/brisbane/zone-102-cluster/freelance-seo-expert/',
             '/locations/australia/brisbane/unknown-area/freelance-crm-developer/',
             '/locations/services/', '/locations/not-a-country/', '/not-a-country/']
    for path in paths:
        response = client.get(path, follow_redirects=False)
        assert response.status_code == 404, path
        assert 'location' not in response.headers
        assert 'noindex' in response.headers['x-robots-tag']
    assert client.get('/locations/', follow_redirects=False).status_code == 200


def test_location_alias_query_pagination_and_no_slash_are_one_hop(database, monkeypatch):
    monkeypatch.setattr(public_site, 'PAGE_SIZE', 1)
    app = FastAPI()
    app.include_router(public_site.router)
    client = TestClient(app)
    response = client.get('/locations/australia?page=2&utm_source=test', follow_redirects=False)
    assert response.status_code == 301
    assert response.headers['location'] == '/australia/?page=2&utm_source=test'
    current = client.get(response.headers['location'], follow_redirects=False)
    assert current.status_code == 200
    assert '<link rel="canonical" href="https://erfreelancers.com/australia/?page=2">' in current.text
    payload = run(public_site.page_data('/australia/', 2))
    assert payload['pagination']['previous'] == '/australia/'
    assert payload['pagination']['next'] == '/australia/?page=3'
    assert client.get('/locations/australia/?page=99999', follow_redirects=False).status_code == 404


def test_current_draft_conflict_does_not_inherit_legacy_publication(database):
    from url_paths import canonical_location_path
    legacy = legacy_published_record()
    current = copy.deepcopy(legacy)
    current.update(id='new-path-draft', canonicalPath=canonical_location_path(legacy['canonicalPath']), lifecycleState='needs_review', indexable=False)
    run(database.pages.insert_many([legacy, current]))
    response = run(public_site.page_data(current['canonicalPath'], 1))
    assert response['robots'] == 'noindex,follow'
    inventory = run(seo.sitemap_inventory())
    assert not any(name.startswith('sitemap-pages') for name in inventory)
    assert run(database.pages.count_documents({})) == 2


def test_new_page_generation_uses_short_paths_without_auto_publication(database):
    location = next(l for l in store.LOCATIONS if l['slug'] == 'fortitude-valley')
    service = store.SERVICES_BY_SLUG['freelance-crm-developer']
    page = run(store.get_or_create_page(service['id'], location['id']))
    assert page['canonicalPath'] == '/australia/brisbane/fortitude-valley/freelance-crm-developer/'
    assert page['contentPackage']['canonical_path'] == page['canonicalPath']
    assert location['parentPath'] == '/australia/brisbane/'
    assert page['lifecycleState'] == 'needs_review'
    assert page['publishedAt'] is None and page['indexable'] is False
    assert not seo.is_public_page(page)


def test_unsourced_location_timezone_removed_without_changing_raw_import(database):
    from url_paths import public_location_record
    raw = next(l for l in store.ALL_LOCATIONS if l['slug'] == 'perth' and l.get('type') == 'city')
    original = copy.deepcopy(raw)
    location = store.LOC_BY_ID[raw['id']]
    assert location['timezone'] == ''
    assert raw == original and raw['timezone']
    data = run(public_site.page_data(location['canonicalPath'], 1))
    assert raw['timezone'] not in json.dumps(data)
    generated = generate_structured_page(store.SERVICES[0], raw, [])
    assert raw['timezone'] not in json.dumps(generated['contentPackage'])
    verified = {**raw, 'timezone': 'Australia/Perth', 'timezoneVerification': {'sourceUrl': 'https://example.org/timezones', 'verifiedAt': '2026-10-09', 'timezone': 'Australia/Perth'}}
    assert public_location_record(verified)['timezone'] == 'Australia/Perth'


def test_none_and_conflicting_robots_directives_cannot_be_published(database):
    record = published_record()
    record['contentPackage']['seo']['robots'] = 'none'
    assert not seo.is_public_page(record)
    record['contentPackage']['seo']['robots'] = 'index,follow'
    record['robots'] = 'noindex,follow'
    assert not seo.is_public_page(record)


def test_location_matching_requires_explicit_delivery_scope_and_excludes_waitlist(database):
    location = next(l for l in store.LOCATIONS if l['slug'] == 'delhi')
    service = store.SERVICES[0]
    base = {'profileState': 'approved', 'services': [service['id']], 'capacityStatus': 'available_now',
            'deliveryModes': ['remote'], 'coverageScope': 'country_remote', 'supportedCountries': ['IN']}
    profiles = [
        {**base, 'id': 'scope-in', 'slug': 'scope-in', 'displayName': 'Country covered'},
        {**base, 'id': 'scope-us', 'slug': 'scope-us', 'displayName': 'Other country', 'supportedCountries': ['US']},
        {**base, 'id': 'waiting', 'slug': 'waiting', 'displayName': 'Waiting', 'capacityStatus': 'waitlist'},
        {**base, 'id': 'base-only', 'slug': 'base-only', 'displayName': 'Local base only', 'baseLocationId': location['id'], 'deliveryModes': ['onsite'], 'onsiteLocations': []},
        {**base, 'id': 'onsite-approved', 'slug': 'onsite-approved', 'displayName': 'Covered onsite', 'baseLocationId': 'another-place', 'deliveryModes': ['onsite'], 'onsiteLocations': [location['id']]},
        {**base, 'id': 'mode-missing', 'slug': 'mode-missing', 'displayName': 'No remote permission', 'coverageScope': 'worldwide_remote', 'deliveryModes': []},
    ]
    run(database.freelancers.insert_many(profiles))
    matching = run(public_site.available_profiles(service['id'], location))
    assert {p['id'] for p in matching} == {'scope-in', 'onsite-approved'}
    # Keep coverage fields in the public DTO so the draft's availability text
    # is calculated from the exact same permissions as the rendered cards.
    draft = generate_structured_page(service, location, matching)
    assert draft['contentPackage']['delivery_modes'] == ['remote', 'onsite']
    api_matching = run(store.freelancers_matching(service['id'], location['id']))
    assert {p['profile']['id'] for p in api_matching} == {'scope-in', 'onsite-approved'}
    onsite = run(store.freelancers_matching(service['id'], location['id'], 'onsite'))
    assert {p['profile']['id'] for p in onsite} == {'onsite-approved'}
    directory = run(public_site.available_profiles())
    assert 'waiting' not in {p['id'] for p in directory}
    # Directory browsing has no target geography; don't infer a geographic
    # mismatch or require onsite/remote permissions until a target is selected.
    assert {'scope-us', 'base-only', 'mode-missing'} <= {p['id'] for p in directory}
    assert run(public_site.page_data('/freelancers/waiting/', 1))['status'] == 404
