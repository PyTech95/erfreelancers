#!/usr/bin/env python3
"""Read-only, standard-library HTTP SEO checks. No indexing/ranking score.

Example:
  python3 scripts/verify_live_seo.py https://erfreelancers.com --output report.json
  python3 scripts/verify_live_seo.py http://127.0.0.1:8018 \
      --canonical-origin https://erfreelancers.com --skip-redirect-checks

The default checks at most 12 HTML pages plus robots, at most 20 sitemap files,
redirect variants, and one missing URL. --regression adds focused release cases,
API/bootstrap parity and asset checks. --backend-url compares the public release
with its direct backend. --strict makes warnings fail the deployment gate too.
No forms, admin changes, notifications or search-engine submissions are invoked.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from urllib.robotparser import RobotFileParser
from uuid import uuid4
import xml.etree.ElementTree as ET

XML_LIMIT = 50 * 1024 * 1024
NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
USER_AGENT = "ERFreelancersTechnicalAudit/1.0 (+read-only verification)"


class RedirectRecorder(HTTPRedirectHandler):
    def __init__(self):
        super().__init__()
        self.hops = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.hops.append({"status": code, "from": req.full_url, "to": newurl})
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url, timeout, max_bytes=XML_LIMIT + 1, method="GET"):
    recorder = RedirectRecorder()
    started = time.monotonic()
    result = {"requested_url": url, "status": None, "final_url": url,
              "headers": {}, "body": "", "bytes": 0, "redirects": recorder.hops}
    try:
        request = Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"}, method=method)
        try:
            response = build_opener(recorder).open(request, timeout=timeout)
        except HTTPError as exc:
            response = exc  # Preserve 404/500 bodies instead of treating them as transport failures.
        with response:
            raw = response.read(max_bytes)
            result.update(status=response.code, final_url=response.geturl(),
                          headers={k.lower(): v for k, v in response.headers.items()}, bytes=len(raw),
                          body=raw.decode(response.headers.get_content_charset() or "utf-8", errors="replace"))
            if len(raw) >= max_bytes:
                result["error"] = f"Response reached the {max_bytes}-byte safety limit; it may be truncated."
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        result["error"] = str(exc)
    result["elapsed_ms"] = round((time.monotonic() - started) * 1000)
    return result


def compact_response(response):
    return {k: v for k, v in response.items() if k != "body"}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titles, self.h1s, self.canonicals = [], [], []
        self.meta, self.schemas, self.links = {}, [], []
        self.bootstrap_blocks, self.assets = [], []
        self._bootstrap = None
        self._title = self._h1 = self._json = None
        self._suppressed = 0
        self.body_text = []
        self.in_body = False
        self.lang = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang", "")
        if tag == "body":
            self.in_body = True
        if tag == "title":
            self._title = []
        if tag == "h1":
            self._h1 = []
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonicals.append(attrs.get("href", ""))
        if tag == "meta":
            key = (attrs.get("name") or attrs.get("property") or "").lower()
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag in {"script", "style", "template"}:
            self._suppressed += 1
        if tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self._json = []
        if tag == "script" and attrs.get("id") == "page-data":
            self._bootstrap = []
        if tag == "script" and attrs.get("src", "").startswith("/static/"):
            self.assets.append(attrs["src"])
        if tag == "link" and "stylesheet" in attrs.get("rel", "").split() and attrs.get("href", "").startswith("/static/"):
            self.assets.append(attrs["href"])

    def handle_endtag(self, tag):
        if tag == "title" and self._title is not None:
            self.titles.append(" ".join("".join(self._title).split()))
            self._title = None
        if tag == "h1" and self._h1 is not None:
            self.h1s.append(" ".join("".join(self._h1).split()))
            self._h1 = None
        if tag == "script" and self._json is not None:
            self.schemas.append("".join(self._json))
            self._json = None
        if tag == "script" and self._bootstrap is not None:
            self.bootstrap_blocks.append("".join(self._bootstrap))
            self._bootstrap = None
        if tag in {"script", "style", "template"}:
            self._suppressed = max(0, self._suppressed - 1)
        if tag == "body":
            self.in_body = False

    def handle_data(self, data):
        if self._title is not None:
            self._title.append(data)
        if self._h1 is not None:
            self._h1.append(data)
        if self._json is not None:
            self._json.append(data)
        if self._bootstrap is not None:
            self._bootstrap.append(data)
        if self.in_body and not self._suppressed:
            self.body_text.append(data)


def origin(url):
    parsed = urlsplit(url)
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def normalize_page(url):
    parsed = urlsplit(url)
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip("/") or "/", "", ""))


def schema_types(value):
    types = set()
    if isinstance(value, dict):
        kind = value.get("@type", [])
        types.update([kind] if isinstance(kind, str) else kind if isinstance(kind, list) else [])
        for item in value.values():
            types.update(schema_types(item))
    elif isinstance(value, list):
        for item in value:
            types.update(schema_types(item))
    return types


def check(label, passed, detail=None, severity="error"):
    item = {"check": label, "result": "pass" if passed else "fail", "severity": severity}
    if detail is not None:
        item["detail"] = detail
    return item


def parsed_bootstrap(parser):
    if len(parser.bootstrap_blocks) != 1:
        return None
    try:
        data = json.loads(parser.bootstrap_blocks[0])
        return data if isinstance(data, dict) else None
    except (ValueError, TypeError):
        return None


def comparable_page_data(data):
    """Ignore only fresh-preview timestamps; keep published/substantive data exact.

    Pending landing previews are generated separately for each HTML/API request.
    Their two generation timestamps therefore change even when their content is
    identical. Never remove timestamps from published records or other paths.
    The shallow copies prevent modifying the evidence payloads themselves.
    """
    if (not isinstance(data, dict)
            or data.get("publicationStatus") != "pending_editorial_review"
            or not isinstance(data.get("page"), dict)):
        return data
    result = dict(data)
    result["page"] = dict(data["page"])
    result["page"].pop("generatedAt", None)
    result["page"].pop("lastModifiedAt", None)
    return result


def renderer_checks(response, parser, args):
    """Reject the static CRA shell, even when it returns a convincing HTTP 200."""
    data = parsed_bootstrap(parser)
    checks = [check("Exactly one valid server page-data bootstrap", data is not None,
                    {"blocks": len(parser.bootstrap_blocks)})]
    if data is None:
        return checks
    checks.extend([
        check("Bootstrap status matches HTTP response", data.get("status") == response["status"],
              {"bootstrap": data.get("status"), "http": response["status"]}),
        check("Bootstrap path matches final route", data.get("path") == urlsplit(response["final_url"]).path,
              {"bootstrap": data.get("path"), "http": urlsplit(response["final_url"]).path}),
        check("Bootstrap H1 matches initial HTML", parser.h1s == [data.get("heading")]),
        check("Bootstrap title matches initial HTML", parser.titles == [data.get("title")]),
        check("Bootstrap description matches initial HTML", parser.meta.get("description") == [data.get("description")]),
        check("Bootstrap canonical matches HTML and production origin",
              parser.canonicals == [data.get("canonical")] and
              data.get("canonical") == args.canonical_origin + str(data.get("path", ""))),
        check("Bootstrap robots matches HTML", parser.meta.get("robots") == [data.get("robots")]),
        check("Backend X-Robots-Tag is preserved", response["headers"].get("x-robots-tag") == data.get("robots")),
        check("Built JavaScript referenced", any(urlsplit(a).path.endswith(".js") for a in parser.assets)),
    ])
    return checks


def inspect_page(url, args, robot_parser):
    response = fetch(args.base_url + urlsplit(url).path + ("?" + urlsplit(url).query if urlsplit(url).query else ""), args.timeout)
    parser = PageParser()
    parser.feed(response["body"])
    checks = [check("HTTP 200", response["status"] == 200, response["status"]),
              check("HTML content type", "text/html" in response["headers"].get("content-type", "")),
              check("One nonempty title", len(parser.titles) == 1 and bool(parser.titles[0]), parser.titles),
              check("One nonempty H1 in server HTML", len(parser.h1s) == 1 and bool(parser.h1s[0]), parser.h1s),
              check("Description present", any(parser.meta.get("description", []))),
              check("HTML language declared", bool(parser.lang), parser.lang),
              check("Exactly one canonical", len(parser.canonicals) == 1, parser.canonicals)]
    expected = args.canonical_origin + urlsplit(response["final_url"]).path
    canonical = parser.canonicals[0] if len(parser.canonicals) == 1 else ""
    checks.append(check("Canonical matches final page and configured origin", bool(canonical) and normalize_page(canonical) == normalize_page(expected), {"expected": expected, "observed": canonical}))
    if args.canonical_origin.startswith("https://"):
        checks.append(check("Canonical uses HTTPS", canonical.startswith("https://")))
    robots_text = " ".join(parser.meta.get("robots", []) + parser.meta.get("googlebot", []) +
                           [response["headers"].get("x-robots-tag", "")]).lower()
    checks.append(check("No noindex/none directive on sampled public URL", not re.search(r"\b(noindex|none)\b", robots_text), robots_text or "No restrictive directive"))
    checks.append(check("Googlebot permitted by robots.txt", robot_parser.can_fetch("Googlebot", url)))
    checks.append(check("Readable body text in server HTML", bool(" ".join(parser.body_text).strip())))
    crawlable = [link for link in parser.links if link.startswith("/") or link.startswith(args.canonical_origin + "/")]
    checks.append(check("Crawlable internal HTML links present", bool(crawlable), len(crawlable)))
    errors, types = [], set()
    for raw in parser.schemas:
        try:
            types.update(schema_types(json.loads(raw)))
        except (ValueError, TypeError) as exc:
            errors.append(str(exc))
    checks.append(check("Structured data present and valid JSON", bool(parser.schemas) and not errors, {"blocks": len(parser.schemas), "types": sorted(types), "parse_errors": errors}))
    checks.append(check("Open Graph title/description present", bool(parser.meta.get("og:title")) and bool(parser.meta.get("og:description")), severity="warning"))
    if args.regression:
        checks.extend(renderer_checks(response, parser, args))
    if "error" in response:
        checks.append(check("Complete HTTP fetch", False, response["error"]))
    return {"url": url, "response": compact_response(response), "checks": checks,
            "title": parser.titles[0] if parser.titles else "", "canonical": canonical,
            "body_word_count": len(" ".join(parser.body_text).split()),
            "note": "Word count is observational; it is not a ranking requirement or quality score."}


def inspect_release(args, robot_parser, sitemap_pages):
    """Release-specific routing checks, using real HTTP/API responses only."""
    reports = []
    cases = [
        ("/", 200),
        ("/services/freelance-web-developer/", 200),
        ("/locations/", 200),
        ("/india/delhi/", 200),
        ("/india/delhi/freelance-web-developer/", 200),
        ("/united-arab-emirates/sharjah/zone-194-cluster/", 404),
        ("/locations/united-arab-emirates/sharjah/zone-194-cluster/", 404),
        ("/locations/not-a-real-country/not-a-real-city/", 404),
        ("/locations/india/delhi/not-a-real-service/", 404),
        ("/release-verification-missing-" + uuid4().hex + "/", 404),
    ]
    for path, expected_status in cases:
        response = fetch(args.base_url + path, args.timeout)
        parser = PageParser()
        parser.feed(response["body"])
        data = parsed_bootstrap(parser)
        checks = [check("Expected public HTTP status", response["status"] == expected_status,
                        {"expected": expected_status, "actual": response["status"]}),
                  check("Expected final route without fallback/redirect", urlsplit(response["final_url"]).path == path and not response["redirects"])]
        checks.extend(renderer_checks(response, parser, args))
        api_path = "/api/public-page?" + urlencode({"path": path})
        api = fetch(args.base_url + api_path, args.timeout)
        try:
            api_data = json.loads(api["body"])
        except ValueError:
            api_data = None
        checks.extend([
            check("Public page API is crawlable", robot_parser.can_fetch("Googlebot", args.canonical_origin + api_path)),
            check("Public page API responds as JSON", "application/json" in api["headers"].get("content-type", "")),
            check("Public page API status matches HTML", api["status"] == response["status"]),
            check("Public page API content matches server bootstrap", data is not None and comparable_page_data(data) == comparable_page_data(api_data)),
            check("Public page API has noindex resource header", "noindex" in api["headers"].get("x-robots-tag", "").lower()),
        ])
        if expected_status == 404:
            checks.append(check("Invalid/missing route is noindex", "noindex" in response["headers"].get("x-robots-tag", "").lower()))
        if args.backend_url:
            backend = fetch(args.backend_url + path, args.timeout)
            backend_parser = PageParser()
            backend_parser.feed(backend["body"])
            backend_data = parsed_bootstrap(backend_parser)
            checks.extend([
                check("Public status matches direct backend", response["status"] == backend["status"]),
                check("Public page-data matches direct backend", data is not None and comparable_page_data(data) == comparable_page_data(backend_data)),
                check("Public robots header matches direct backend", response["headers"].get("x-robots-tag") == backend["headers"].get("x-robots-tag")),
            ])
        reports.append({"case": path, "response": compact_response(response),
                        "api_response": compact_response(api), "checks": checks})
        if path == "/":
            # Check one JS and one CSS reference; do not trigger business workflows.
            for suffix in (".js", ".css"):
                asset = next((a for a in parser.assets if urlsplit(a).path.endswith(suffix)), None)
                asset_checks = [check(f"Built {suffix} asset reference present", bool(asset))]
                item = {"case": f"homepage {suffix} asset", "checks": asset_checks}
                if asset:
                    asset_response = fetch(args.base_url + asset, args.timeout, max_bytes=12 * 1024 * 1024)
                    item["response"] = compact_response(asset_response)
                    content_type = asset_response["headers"].get("content-type", "")
                    expected_types = ("javascript", "ecmascript") if suffix == ".js" else ("text/css",)
                    asset_checks.extend([check("Asset returns HTTP 200", asset_response["status"] == 200),
                                         check("Asset content type is correct, not HTML fallback", any(t in content_type for t in expected_types), content_type),
                                         check("Asset body is present and fully fetched", asset_response["bytes"] > 0 and "error" not in asset_response)])
                reports.append(item)

    for old, new in [("/locations/india/delhi/", "/india/delhi/"),
                     ("/locations/india/delhi?utm_source=releasecheck", "/india/delhi/?utm_source=releasecheck"),
                     ("/locations/india/delhi/freelance-web-developer/", "/india/delhi/freelance-web-developer/"),
                     ("/locations/india/delhi/freelance-web-developer?utm_source=releasecheck", "/india/delhi/freelance-web-developer/?utm_source=releasecheck")]:
        response = fetch(args.base_url + old, args.timeout)
        hops = response["redirects"]
        reports.append({"case": "legacy redirect " + old, "response": compact_response(response), "checks": [
            check("Known legacy location URL returns one HTTP 301", len(hops) == 1 and hops[0]["status"] == 301, hops),
            check("Legacy redirect reaches new canonical route and preserves query", response["status"] == 200 and
                  (urlsplit(response["final_url"]).path, urlsplit(response["final_url"]).query) == (urlsplit(new).path, urlsplit(new).query)),
        ]})
    for path in ("/index.html", "/static/release-verification-missing.js", "/api/release-verification-missing"):
        response = fetch(args.base_url + path, args.timeout)
        reports.append({"case": "no SPA fallback " + path, "response": compact_response(response),
                        "checks": [check("Missing asset/API or raw index URL returns HTTP 404", response["status"] == 404)]})
    for path, expected in [("/", 200), ("/india/delhi/", 200), ("/release-verification-head-missing/", 404)]:
        response = fetch(args.base_url + path, args.timeout, method="HEAD")
        reports.append({"case": "HEAD " + path, "response": compact_response(response), "checks": [
            check("HEAD preserves expected status", response["status"] == expected),
            check("HEAD preserves renderer robots header", bool(response["headers"].get("x-robots-tag"))),
        ]})
    old_sitemap_urls = [u for u in sitemap_pages if urlsplit(u).path.startswith("/locations/") and urlsplit(u).path != "/locations/"]
    reports.append({"case": "migrated sitemap routes", "checks": [
        check("No legacy /locations/{country} routes in sitemaps", not old_sitemap_urls, old_sitemap_urls[:10]),
        check("Location directory hub retained", args.canonical_origin + "/locations/" in sitemap_pages),
        check("New Delhi canonical route included", args.canonical_origin + "/india/delhi/" in sitemap_pages),
    ]})
    return reports


def inspect_sitemaps(args):
    queue = [args.canonical_origin + "/sitemap.xml"]
    seen, pages, reports = set(), [], []
    while queue and len(seen) < args.max_sitemaps:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        response = fetch(args.base_url + urlsplit(url).path, args.timeout)
        checks = [check("HTTP 200", response["status"] == 200),
                  check("XML content type", any(t in response["headers"].get("content-type", "") for t in ("application/xml", "text/xml"))),
                  check("Uncompressed size within 50 MiB", response["bytes"] <= XML_LIMIT, response["bytes"])]
        item = {"url": url, "response": compact_response(response), "checks": checks}
        try:
            root = ET.fromstring(response["body"])
            valid_root = root.tag in {NS + "sitemapindex", NS + "urlset"}
            checks.append(check("Sitemap root and namespace valid", valid_root, root.tag))
            entry_tag = NS + ("sitemap" if root.tag == NS + "sitemapindex" else "url")
            entries = root.findall(entry_tag)
            urls = [(entry.findtext(NS + "loc") or "").strip() for entry in entries]
            checks.append(check("No more than 50,000 entries", len(entries) <= 50000, len(entries)))
            invalid = [u for u in urls if origin(u) != args.canonical_origin or not urlsplit(u).path or urlsplit(u).query or urlsplit(u).fragment]
            checks.append(check("Absolute canonical-origin URLs without query/fragment", not invalid, invalid[:10]))
            checks.append(check("No duplicate entries within sitemap", len(urls) == len(set(urls))))
            item["entry_count"] = len(entries)
            item["kind"] = "index" if root.tag == NS + "sitemapindex" else "urlset"
            if valid_root:
                target = queue if root.tag == NS + "sitemapindex" else pages
                target.extend(u for u in urls if u and u not in invalid)
        except ET.ParseError as exc:
            checks.append(check("Parseable XML", False, str(exc)))
        if "error" in response:
            checks.append(check("Complete HTTP fetch", False, response["error"]))
        reports.append(item)
    return reports, pages, [u for u in queue if u not in seen]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("base_url", help="Origin to fetch, e.g. https://erfreelancers.com or http://127.0.0.1:8018")
    parser.add_argument("--canonical-origin", help="Expected canonical origin, default: base URL")
    parser.add_argument("--max-pages", type=int, default=12, help="Maximum HTML pages sampled (default 12)")
    parser.add_argument("--max-sitemaps", type=int, default=20, help="Maximum sitemap files fetched (default 20)")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent HTML fetches, 1–8 (default 4)")
    parser.add_argument("--timeout", type=float, default=20, help="Per-request timeout in seconds")
    parser.add_argument("--path", action="append", default=[], help="Include a public path in sample; repeat as needed")
    parser.add_argument("--skip-redirect-checks", action="store_true", help="Use for local backend checks without public HTTP/www redirects")
    parser.add_argument("--regression", action="store_true", help="Require server bootstrap, API parity, new location routes, legacy 301s and invalid-zone 404s")
    parser.add_argument("--backend-url", help="Compare critical public responses with this direct backend origin; implies --regression")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings as well as failed checks; recommended for deployment gates")
    parser.add_argument("--output", type=Path, help="Write complete JSON report to this path")
    args = parser.parse_args(argv)
    args.base_url = args.base_url.rstrip("/")
    args.canonical_origin = (args.canonical_origin or args.base_url).rstrip("/")
    if args.backend_url:
        args.backend_url = args.backend_url.rstrip("/")
        args.regression = True
    for value in (args.base_url, args.canonical_origin, *([args.backend_url] if args.backend_url else [])):
        parsed = urlsplit(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
            parser.error("Base URL and canonical origin must be plain HTTP(S) origins without paths or credentials.")
    if not (1 <= args.workers <= 8) or args.max_pages < 1 or args.max_sitemaps < 1 or args.timeout <= 0:
        parser.error("Use positive limits/timeouts and 1–8 workers.")
    if any(not p.startswith("/") or p.startswith("//") for p in args.path):
        parser.error("Each --path must start with a single slash.")

    print(f"Reading robots and sitemaps from {args.base_url}; canonical origin {args.canonical_origin}.", file=sys.stderr)
    robots = fetch(args.base_url + "/robots.txt", args.timeout)
    robot_parser = RobotFileParser()
    robot_parser.parse(robots["body"].splitlines() if robots["status"] == 200 else ["User-agent: *", "Allow: /"])
    declarations = re.findall(r"(?im)^sitemap:\s*(\S+)", robots["body"])
    robots_checks = [check("robots.txt HTTP 200", robots["status"] == 200),
                     check("robots.txt text/plain", "text/plain" in robots["headers"].get("content-type", "")),
                     check("Canonical root sitemap declared", args.canonical_origin + "/sitemap.xml" in declarations, declarations),
                     check("Homepage crawl permitted", robot_parser.can_fetch("Googlebot", args.canonical_origin + "/"))]
    sitemaps, sitemap_pages, unvisited = inspect_sitemaps(args)
    priority = [args.canonical_origin + "/"] + [args.canonical_origin + p for p in args.path]
    # Round-robin early URLs by route family so a large locations shard does not crowd out service/profile pages.
    groups = {}
    for url in sitemap_pages:
        family = urlsplit(url).path.strip("/").split("/")[0]
        groups.setdefault(family, []).append(url)
    while any(groups.values()) and len(priority) < args.max_pages * 3:
        for group in groups.values():
            if group:
                priority.append(group.pop(0))
    sample = list(dict.fromkeys(priority))[:args.max_pages]
    print(f"Checking {len(sample)} HTML pages with {args.workers} workers.", file=sys.stderr)
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        pages = list(executor.map(lambda url: inspect_page(url, args, robot_parser), sample))
    titles = {}
    for page in pages:
        if page["title"]:
            titles.setdefault(page["title"], []).append(page["url"])
    duplicates = {title: urls for title, urls in titles.items() if len(urls) > 1}

    missing = fetch(args.base_url + "/seo-verification-missing-" + uuid4().hex, args.timeout)
    missing_parser = PageParser()
    missing_parser.feed(missing["body"])
    missing_directives = " ".join(missing_parser.meta.get("robots", []) + [missing["headers"].get("x-robots-tag", "")]).lower()
    missing_checks = [check("Unknown public URL returns real 404", missing["status"] == 404, missing["status"]),
                      check("Missing page has noindex", "noindex" in missing_directives, severity="warning")]
    redirects = []
    canonical_parts = urlsplit(args.canonical_origin)
    if not args.skip_redirect_checks and canonical_parts.scheme == "https" and not canonical_parts.port:
        host = canonical_parts.hostname
        for url in (f"http://{host}/", f"http://www.{host}/", f"https://www.{host}/"):
            response = fetch(url, args.timeout)
            redirects.append({"response": compact_response(response), "checks": [
                check("Redirect reaches canonical HTTPS homepage", response["status"] == 200 and normalize_page(response["final_url"]) == normalize_page(args.canonical_origin + "/")),
                check("Redirects permanent", bool(response["redirects"]) and all(hop["status"] in {301, 308} for hop in response["redirects"]), response["redirects"]),
                check("At most two redirect hops", len(response["redirects"]) <= 2, severity="warning")]})

    aggregate = [check("No duplicate titles in sample", not duplicates, duplicates),
                 check("All discovered sitemap files examined", not unvisited, unvisited, severity="warning"),
                 check("No duplicate page URLs across sitemap files", len(sitemap_pages) == len(set(sitemap_pages)), {"total": len(sitemap_pages), "unique": len(set(sitemap_pages))})]
    release = inspect_release(args, robot_parser, sitemap_pages) if args.regression else []
    all_checks = robots_checks + missing_checks + aggregate
    for item in sitemaps + pages + redirects + release:
        all_checks.extend(item["checks"])
    errors = sum(c["result"] == "fail" and c["severity"] == "error" for c in all_checks)
    warnings = sum(c["result"] == "fail" and c["severity"] == "warning" for c in all_checks)
    report = {"generated_at": datetime.now(timezone.utc).isoformat(), "base_url": args.base_url,
              "canonical_origin": args.canonical_origin,
              "scope": {"html_pages_checked": len(pages), "sitemap_files_checked": len(sitemaps),
                        "sitemap_page_urls_observed": len(set(sitemap_pages)), "complete_site_crawl": False,
                        "all_discovered_sitemap_urls_checked": not unvisited and set(sitemap_pages).issubset(set(sample)),
                        "release_regression_cases": len(release), "backend_comparison": args.backend_url},
              "summary": {"result": "fail" if errors or (args.strict and warnings) else "pass_with_warnings" if warnings else "pass", "failed_checks": errors, "warnings": warnings, "strict": args.strict},
              "limitations": ["This is a bounded HTTP sample, not every URL or every SEO parameter.",
                              "Valid JSON-LD does not prove rich-result eligibility or truth of its claims.",
                              "Browser rendering, Core Web Vitals, content usefulness and account-only Search Console reasons require separate review.",
                              "No HTTP audit can guarantee crawling, indexing, AI citation or ranking."],
              "robots": {"response": compact_response(robots), "checks": robots_checks},
              "sitemaps": sitemaps, "pages": pages,
              "missing_url": {"response": compact_response(missing), "checks": missing_checks},
              "redirects": redirects, "aggregate_checks": aggregate, "release_regressions": release}
    output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding="utf-8")
        print(f"{report['summary']['result']}: {errors} failed checks, {warnings} warnings. Report: {args.output}")
    else:
        print(output)
    return 1 if errors or (args.strict and warnings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
