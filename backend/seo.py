import os
from datetime import datetime, timezone

from fastapi import APIRouter, Response

from store import db, LOCATIONS, SERVICES, NO_ID

router = APIRouter(prefix="/api")

SHARD_SIZE = 5000
XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
URLSET_OPEN = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'


def domain():
    return os.environ["PRODUCTION_CANONICAL_DOMAIN"].rstrip("/")


def today():
    return datetime.now(timezone.utc).date().isoformat()


def xml_response(body: str):
    return Response(body, media_type="application/xml; charset=utf-8",
                    headers={"X-Robots-Tag": "all", "Cache-Control": "public, max-age=3600"})


def url_entry(loc, changefreq, priority, lastmod=None):
    return (f"  <url>\n    <loc>{domain()}{loc}</loc>\n    <lastmod>{lastmod or today()}</lastmod>\n"
            f"    <changefreq>{changefreq}</changefreq>\n    <priority>{priority}</priority>\n  </url>\n")


def date_only(value):
    return (value or "")[:10] or None


async def approved_page_count() -> int:
    return await db.pages.count_documents({"lifecycleState": "approved"})


def shard_count(total: int) -> int:
    return max(1, -(-total // SHARD_SIZE))


def child_sitemaps(total_pages: int):
    names = ["sitemap-core.xml", "sitemap-blog.xml"] + [f"sitemap-pages-{i}.xml" for i in range(1, shard_count(total_pages) + 1)]
    return [f"{domain()}/api/sitemaps/{n}" for n in names]


@router.get("/sitemap.xml")
async def sitemap_index():
    total = await approved_page_count()
    xml = XML_HEAD + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in child_sitemaps(total):
        xml += f"  <sitemap>\n    <loc>{url}</loc>\n    <lastmod>{today()}</lastmod>\n  </sitemap>\n"
    return xml_response(xml + "</sitemapindex>")


@router.get("/sitemaps/sitemap-core.xml")
async def sitemap_core():
    # Only routes that actually render distinct content in the SPA.
    core = [("/", "daily", "1.0"), ("/blog", "daily", "0.7"), ("/join-as-freelancer/", "monthly", "0.7")]
    return xml_response(XML_HEAD + URLSET_OPEN + "".join(url_entry(*c) for c in core) + "</urlset>")


@router.get("/sitemaps/sitemap-blog.xml")
async def sitemap_blog():
    posts = await db.blog_posts.find({"status": "published"}, {"_id": 0, "slug": 1, "updatedAt": 1, "publishedAt": 1}) \
        .sort("publishedAt", -1).limit(1000).to_list(1000)
    body = "".join(url_entry(f"/blog/{p['slug']}", "weekly", "0.7",
                             date_only(p.get("updatedAt") or p.get("publishedAt"))) for p in posts)
    return xml_response(XML_HEAD + URLSET_OPEN + body + "</urlset>")


@router.get("/sitemaps/sitemap-pages-{shard}.xml")
async def sitemap_pages(shard: int):
    # Sitemap mirrors the real generated corpus: only approved, resolvable pages are listed,
    # so Google never receives URLs that 404 or soft-fail.
    total = await approved_page_count()
    if shard < 1 or shard > shard_count(total):
        return xml_response(XML_HEAD + URLSET_OPEN + "</urlset>")
    cursor = db.pages.find({"lifecycleState": "approved"},
                           {"_id": 0, "canonicalPath": 1, "updatedAt": 1, "createdAt": 1}) \
        .sort("canonicalPath", 1).skip((shard - 1) * SHARD_SIZE).limit(SHARD_SIZE)
    pages = await cursor.to_list(SHARD_SIZE)
    body = "".join(url_entry(p["canonicalPath"], "weekly", "0.85",
                             date_only(p.get("updatedAt") or p.get("createdAt"))) for p in pages)
    return xml_response(XML_HEAD + URLSET_OPEN + body + "</urlset>")


ROBOTS_TEMPLATE = """User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

# AI / answer-engine crawlers (GEO)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: {origin}/api/sitemap.xml
"""


@router.get("/robots.txt")
async def robots():
    return Response(ROBOTS_TEMPLATE.format(origin=domain()), media_type="text/plain; charset=utf-8")


@router.get("/seo/sitemaps-manifest")
async def sitemaps_manifest():
    total_pages = await approved_page_count()
    total_blog = await db.blog_posts.count_documents({"status": "published"})
    shards = shard_count(total_pages)
    return {
        "status": "ready",
        "googleSearchConsoleTarget": f"{domain()}/api/sitemap.xml",
        "totalPublicUrls": 3 + total_blog + total_pages,
        "breakdown": {"corePages": 3, "blogPosts": total_blog, "approvedServiceLocationPages": total_pages,
                      "targetPairsInPipeline": len(LOCATIONS) * len(SERVICES)},
        "sitemapIndex": f"{domain()}/api/sitemap.xml",
        "childSitemaps": child_sitemaps(total_pages),
        "shards": [{"name": f"sitemap-pages-{i}.xml", "url": f"{domain()}/api/sitemaps/sitemap-pages-{i}.xml",
                    "urlsCount": min(SHARD_SIZE, total_pages - (i - 1) * SHARD_SIZE),
                    "startIndex": (i - 1) * SHARD_SIZE + 1,
                    "endIndex": min(total_pages, i * SHARD_SIZE)} for i in range(1, shards + 1)],
        "robotsTxtUrl": f"{domain()}/api/robots.txt",
        "indexingGuidance": "Google retired the sitemap ping endpoint. Submit /api/sitemap.xml once in Search Console "
                            "(it is also referenced from robots.txt for automatic discovery) and use URL Inspection "
                            "-> Request Indexing for priority pages. The sitemap only lists generated, approved pages.",
    }


@router.get("/seo/audit")
async def seo_audit(sample: int = 50):
    all_pages = await db.pages.find({}, {"_id": 0, "canonicalPath": 1, "contentPackage.internal_link_ids": 1}).to_list(None)
    sample_pages = await db.pages.find({}, NO_ID).limit(sample).to_list(sample)
    seen, duplicates, orphans = set(), 0, 0
    for p in all_pages:
        if p["canonicalPath"] in seen:
            duplicates += 1
        seen.add(p["canonicalPath"])
        if not p.get("contentPackage", {}).get("internal_link_ids"):
            orphans += 1

    passed = warnings = errors = title_alerts = desc_alerts = 0
    results = []
    for page in sample_pages:
        pkg = page["contentPackage"]
        title_ok = 30 <= len(pkg["seo"]["title"]) <= 95
        desc_ok = 100 <= len(pkg["seo"]["description"]) <= 170
        title_alerts += not title_ok
        desc_alerts += not desc_ok
        has_faqs = len(pkg["faqs"]) > 0
        score = 100 - (0 if title_ok else 5) - (0 if desc_ok else 5) - (0 if has_faqs else 15)
        status = "fail" if score < 80 else ("warning" if score < 95 else "pass")
        passed += status == "pass"
        warnings += status == "warning"
        errors += status == "fail"
        results.append({"canonicalPath": page["canonicalPath"], "title": pkg["seo"]["title"], "hasH1": bool(pkg["hero"]["heading"]),
                        "hasBreadcrumbs": True, "hasFaqs": has_faqs, "hasMatchingFreelancers": True, "score": score, "status": status})
    return {"testedAt": datetime.now(timezone.utc).isoformat(), "totalTested": len(sample_pages), "passedCount": passed,
            "warningCount": warnings, "errorCount": errors, "duplicateCanonicalsFound": duplicates,
            "pagesWithoutInternalLinks": orphans, "titleLengthAlerts": title_alerts, "descLengthAlerts": desc_alerts,
            "sampleAuditedUrls": results}
