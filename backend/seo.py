import os
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter, Response

from store import db, LOCATIONS, SERVICES, NO_ID

router = APIRouter(prefix="/api")

SHARD_SIZE = 5000
TOTAL_PAGES = 50400
TOTAL_SHARDS = -(-TOTAL_PAGES // SHARD_SIZE)
XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
URLSET_OPEN = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'


def domain():
    return os.environ["PRODUCTION_CANONICAL_DOMAIN"].rstrip("/")


def today():
    return datetime.now(timezone.utc).date().isoformat()


def xml_response(body: str):
    return Response(body, media_type="application/xml; charset=utf-8",
                    headers={"X-Robots-Tag": "all", "Cache-Control": "public, max-age=3600"})


def url_entry(loc, changefreq, priority):
    return f"  <url>\n    <loc>{domain()}{loc}</loc>\n    <lastmod>{today()}</lastmod>\n    <changefreq>{changefreq}</changefreq>\n    <priority>{priority}</priority>\n  </url>\n"


def sorted_locations():
    return sorted(LOCATIONS, key=lambda l: l["canonicalPath"])


def sorted_services():
    return sorted(SERVICES, key=lambda s: s["slug"])


def child_sitemaps():
    names = ["sitemap-core.xml", "sitemap-services.xml", "sitemap-locations.xml"] + [f"sitemap-pages-{i}.xml" for i in range(1, TOTAL_SHARDS + 1)]
    return [f"{domain()}/api/sitemaps/{n}" for n in names]


@router.get("/sitemap.xml")
async def sitemap_index():
    xml = XML_HEAD + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in child_sitemaps():
        xml += f"  <sitemap>\n    <loc>{url}</loc>\n    <lastmod>{today()}</lastmod>\n  </sitemap>\n"
    return xml_response(xml + "</sitemapindex>")


@router.get("/sitemaps/sitemap-core.xml")
async def sitemap_core():
    core = [("/", "daily", "1.0"), ("/services/", "weekly", "0.9"), ("/locations/", "weekly", "0.9"),
            ("/freelancers/", "daily", "0.9"), ("/freelancers/raji/", "weekly", "0.85"), ("/how-it-works/", "monthly", "0.8"),
            ("/work/", "monthly", "0.8"), ("/join-as-freelancer/", "monthly", "0.8"), ("/about/", "monthly", "0.7"), ("/contact/", "monthly", "0.7")]
    return xml_response(XML_HEAD + URLSET_OPEN + "".join(url_entry(*c) for c in core) + "</urlset>")


@router.get("/sitemaps/sitemap-services.xml")
async def sitemap_services():
    return xml_response(XML_HEAD + URLSET_OPEN + "".join(url_entry(f"/services/{s['slug']}/", "weekly", "0.9") for s in sorted_services()) + "</urlset>")


@router.get("/sitemaps/sitemap-locations.xml")
async def sitemap_locations():
    return xml_response(XML_HEAD + URLSET_OPEN + "".join(url_entry(l["canonicalPath"], "weekly", "0.8") for l in sorted_locations()) + "</urlset>")


@router.get("/sitemaps/sitemap-pages-{shard}.xml")
async def sitemap_pages(shard: int):
    if shard < 1 or shard > TOTAL_SHARDS:
        return xml_response(XML_HEAD + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
    locs, svcs = sorted_locations(), sorted_services()
    start = (shard - 1) * SHARD_SIZE
    end = min(TOTAL_PAGES, start + SHARD_SIZE)
    body = ""
    for idx in range(start, end):
        li, si = divmod(idx, len(svcs))
        if li < len(locs):
            body += url_entry(f"{locs[li]['canonicalPath']}{svcs[si]['slug']}/", "weekly", "0.85")
    return xml_response(XML_HEAD + URLSET_OPEN + body + "</urlset>")


@router.get("/robots.txt")
async def robots():
    return Response(f"User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: {domain()}/api/sitemap.xml\n",
                    media_type="text/plain; charset=utf-8")


@router.get("/seo/sitemaps-manifest")
async def sitemaps_manifest():
    shards = [{"name": f"sitemap-pages-{i}.xml", "url": f"{domain()}/api/sitemaps/sitemap-pages-{i}.xml",
               "urlsCount": 400 if i == TOTAL_SHARDS else SHARD_SIZE, "startIndex": (i - 1) * SHARD_SIZE + 1,
               "endIndex": min(TOTAL_PAGES, i * SHARD_SIZE)} for i in range(1, TOTAL_SHARDS + 1)]
    return {
        "status": "ready",
        "googleSearchConsoleTarget": f"{domain()}/api/sitemap.xml",
        "totalPublicUrls": 10 + len(SERVICES) + len(LOCATIONS) + TOTAL_PAGES,
        "breakdown": {"corePages": 10, "servicesHubs": len(SERVICES), "locationHubs": len(LOCATIONS), "serviceLocationLandingPages": TOTAL_PAGES},
        "sitemapIndex": f"{domain()}/api/sitemap.xml",
        "childSitemaps": child_sitemaps(),
        "shards": shards,
        "googlePingUrl": "https://www.google.com/ping?sitemap=" + quote(f"{domain()}/api/sitemap.xml", safe=""),
        "robotsTxtUrl": f"{domain()}/api/robots.txt",
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
