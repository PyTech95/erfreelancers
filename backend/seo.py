"""Sitemaps describe published URLs, never the theoretical location/service matrix."""
import os
import re
from datetime import datetime, timezone
from urllib.parse import urlsplit
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException, Query, Response
import store
from store import db, LOCATIONS, SERVICES, NO_ID
from url_paths import canonical_location_path, public_page_record, preferred_page_records

router = APIRouter(prefix="/api")
SHARD_SIZE = 5000
XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
URLSET_OPEN = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
CORE_PATHS = ["/", "/services/", "/locations/", "/freelancers/", "/how-it-works/",
              "/work/", "/about/", "/contact/", "/blog/"]
PUBLIC_PAGE_QUERY = {"lifecycleState": {"$in": ["approved", "published"]},
                     "publishedAt": {"$nin": [None, ""]}, "indexable": {"$ne": False},
                     "$or": [{"modelProvenance.engine": {"$ne": "deterministic-structured-builder-v1"}},
                             {"editorialReview.approved": True}]}


def domain():
    raw = os.getenv("PRODUCTION_CANONICAL_DOMAIN", "https://erfreelancers.com").strip().rstrip("/")
    parsed = urlsplit(raw)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
        raise ValueError("PRODUCTION_CANONICAL_DOMAIN must be a complete origin, for example https://erfreelancers.com")
    return raw


def public_location(location):
    return bool(location) and location.get("active") is not False and location.get("indexable") is not False and not str(location.get("sourceId", "")).startswith("gn-zone-")


def public_service(service):
    return bool(service) and service.get("active") is not False


def valid_landing_path(path):
    path = canonical_location_path(path)
    if not path:
        return False
    location_path, _, service_slug = path.rstrip("/").rpartition("/")
    return public_location(store.LOC_BY_PATH.get(location_path + "/")) and public_service(store.SERVICES_BY_SLUG.get(service_slug))


def is_public_page(page):
    if not page or page.get("lifecycleState") not in ("approved", "published") or not page.get("publishedAt"):
        return False
    package = page.get("contentPackage") or {}
    if (page.get("modelProvenance", {}).get("engine") == "deterministic-structured-builder-v1"
            and not page.get("editorialReview", {}).get("approved")):
        return False
    robots = " ".join(str(value) for value in (package.get("seo", {}).get("robots", ""), page.get("robots", ""))).lower()
    robot_tokens = set(re.split(r"[\s,]+", robots))
    path = canonical_location_path(page.get("canonicalPath", ""))
    if not valid_landing_path(path):
        return False
    location_path, _, service_slug = path.rstrip("/").rpartition("/")
    if (page.get("serviceId") != store.SERVICES_BY_SLUG[service_slug]["id"]
            or page.get("locationId") != store.LOC_BY_PATH[location_path + "/"]["id"]):
        return False
    return (page.get("indexable") is not False and package.get("seo", {}).get("indexable") is not False
            and not robot_tokens.intersection({"noindex", "none"}) and bool(package.get("hero", {}).get("heading"))
            and bool(package.get("sections")))


def profile_query(slug=None):
    helper = getattr(store, "public_freelancer_query", None)
    return helper(slug) if helper else {"profileState": "approved", **({"slug": slug} if slug else {})}


def iso_lastmod(value):
    if not value:
        return None
    try:
        date = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        if date > datetime.now(timezone.utc):
            return None
        return date.isoformat()
    except (ValueError, TypeError):
        return None


def xml_response(body, status_code=200):
    return Response(body, status_code=status_code, media_type="application/xml",
                    headers={"Cache-Control": "public, max-age=300"})


def url_entry(path, lastmod=None):
    entry = f"  <url><loc>{escape(domain() + path)}</loc>"
    modified = iso_lastmod(lastmod)
    if modified:
        entry += f"<lastmod>{escape(modified)}</lastmod>"
    return entry + "</url>\n"


async def eligible_pages():
    # Only a small projection is needed, even for a collection with 50,000 records.
    projection = {"_id": 0, "canonicalPath": 1, "lifecycleState": 1, "publishedAt": 1, "serviceId": 1, "locationId": 1,
                  "lastModifiedAt": 1, "indexable": 1, "robots": 1,
                  "modelProvenance.engine": 1, "editorialReview.approved": 1,
                  "contentPackage.seo": 1, "contentPackage.hero.heading": 1,
                  "contentPackage.sections.id": 1}
    records = await db.pages.find({}, projection).sort("canonicalPath", 1).to_list(None)
    # Resolve migration conflicts before publication filtering. A current draft
    # must never inherit sitemap eligibility from an older conflicting row.
    eligible = [public_page_record(record) for record in preferred_page_records(records) if is_public_page(record)]
    return sorted(eligible, key=lambda record: record["canonicalPath"])


async def sitemap_inventory():
    pages = await eligible_pages()
    profiles = await db.freelancers.find(profile_query(), {"_id": 0, "slug": 1, "updatedAt": 1, "lastModifiedAt": 1}).sort("slug", 1).to_list(None)
    posts = await db.blog_posts.find({"status": "published", "indexable": {"$ne": False}}, {"_id": 0, "slug": 1, "updatedAt": 1, "publishedAt": 1}).sort("slug", 1).to_list(None)
    groups = {
        "sitemap-core.xml": [(p, None) for p in CORE_PATHS],
        "sitemap-services.xml": [(f"/services/{s['slug']}/", s.get("updatedAt")) for s in SERVICES if public_service(s)],
        "sitemap-locations.xml": [(l["canonicalPath"], l.get("updatedAt")) for l in LOCATIONS if public_location(l)],
        "sitemap-freelancers.xml": [(f"/freelancers/{p['slug']}/", p.get("updatedAt") or p.get("lastModifiedAt")) for p in profiles if p.get("slug")],
        "sitemap-blog.xml": [(f"/blog/{p['slug']}/", p.get("updatedAt") or p.get("publishedAt")) for p in posts if p.get("slug")],
    }
    for start in range(0, len(pages), SHARD_SIZE):
        groups[f"sitemap-pages-{start // SHARD_SIZE + 1}.xml"] = [(p["canonicalPath"], p.get("lastModifiedAt") or p.get("publishedAt")) for p in pages[start:start + SHARD_SIZE]]
    # General shards also keep directory/blog sitemaps safely within protocol limits.
    for name, entries in list(groups.items()):
        if len(entries) > SHARD_SIZE:
            del groups[name]
            for start in range(0, len(entries), SHARD_SIZE):
                groups[f"{name[:-4]}-{start // SHARD_SIZE + 1}.xml"] = entries[start:start + SHARD_SIZE]
    return groups


@router.get("/sitemap.xml")
async def sitemap_index():
    groups = await sitemap_inventory()
    body = XML_HEAD + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for name in groups:
        body += f"  <sitemap><loc>{escape(domain() + '/sitemaps/' + name)}</loc></sitemap>\n"
    return xml_response(body + "</sitemapindex>")


@router.get("/sitemaps/{name}")
async def sitemap_file(name: str):
    groups = await sitemap_inventory()
    if name not in groups:
        raise HTTPException(404, "Sitemap does not exist")
    return xml_response(XML_HEAD + URLSET_OPEN + "".join(url_entry(path, modified) for path, modified in groups[name]) + "</urlset>")


@router.get("/robots.txt")
async def robots():
    # Authenticated routes are protected by authorization + noindex response headers.
    # Crawlers must be able to fetch public JSON used by the client renderer.
    return Response(f"User-agent: *\nAllow: /\n\nSitemap: {domain()}/sitemap.xml\n", media_type="text/plain")


@router.get("/seo/sitemaps-manifest")
async def sitemaps_manifest():
    groups = await sitemap_inventory()
    count = lambda prefix: sum(len(entries) for name, entries in groups.items() if name.startswith(prefix))
    return {"status": "ready", "googleSearchConsoleTarget": f"{domain()}/sitemap.xml",
            "totalPublicUrls": sum(map(len, groups.values())),
            "breakdown": {"corePages": count("sitemap-core"), "servicesHubs": count("sitemap-services"),
                          "locationHubs": count("sitemap-locations"), "serviceLocationLandingPages": count("sitemap-pages"),
                          "freelancerProfiles": count("sitemap-freelancers"), "blogPosts": count("sitemap-blog")},
            "sitemapIndex": f"{domain()}/sitemap.xml", "robotsTxtUrl": f"{domain()}/robots.txt",
            "childSitemaps": [f"{domain()}/sitemaps/{name}" for name in groups],
            "shards": [{"name": name, "url": f"{domain()}/sitemaps/{name}", "urlsCount": len(entries)} for name, entries in groups.items()],
            "indexingStatus": "unknown", "note": "Sitemaps list eligible published URLs. Submission, crawling and indexing are separate search-engine actions."}


@router.get("/seo/audit")
async def seo_audit(sample: int = Query(50, ge=1, le=500)):
    records = await db.pages.find({}, NO_ID).limit(sample).to_list(sample)
    results = []
    for page in records:
        pkg = page.get("contentPackage") or {}
        metadata = pkg.get("seo") or {}
        issues = []
        if not metadata.get("title", "").strip(): issues.append("missing_title")
        if not metadata.get("description", "").strip(): issues.append("missing_description")
        if not pkg.get("hero", {}).get("heading", "").strip(): issues.append("missing_h1")
        if not pkg.get("sections"): issues.append("missing_content_sections")
        if not valid_landing_path(page.get("canonicalPath", "")): issues.append("invalid_service_location_path")
        if not pkg.get("internal_link_ids"): issues.append("missing_internal_links")
        results.append({"canonicalPath": canonical_location_path(page.get("canonicalPath")), "title": metadata.get("title"), "issues": issues,
                        "status": "fail" if issues else "pass", "indexablePublished": is_public_page(page),
                        "hasH1": bool(pkg.get("hero", {}).get("heading")), "hasFaqs": bool(pkg.get("faqs"))})
    return {"testedAt": datetime.now(timezone.utc).isoformat(), "totalTested": len(records),
            "passedCount": sum(not r["issues"] for r in results), "errorCount": sum(bool(r["issues"]) for r in results),
            "sampleAuditedUrls": results, "scope": "Stored metadata and route checks only. Live crawl, content review and field performance require separate evidence.",
            "indexingStatus": "unknown", "googleComplianceScore": None}
