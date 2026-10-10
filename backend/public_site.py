"""Public HTML and its JSON contract share one route resolver for every visitor.

Mount this router LAST, after the API routers. No user-agent branching, on-request
page generation, or crawler-only content is used. Nginx must proxy page requests
here instead of responding with the same static index.html for every URL.
"""
import json
import os
import re
from html import escape
from pathlib import Path

from fastapi import APIRouter, Query, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
import store
from store import db, NO_ID
from seo import (domain, public_location, public_service, is_public_page, profile_query,
                 robots, sitemap_index, sitemap_file)
from content_builder import generate_structured_page, profile_is_available, profile_delivery_coverage
from url_paths import canonical_location_path, normalized_path, page_path_candidates, public_page_record, preferred_page_records

router = APIRouter()
PAGE_SIZE = 30
BUILD_DIR = Path(os.getenv("FRONTEND_BUILD_DIR", str(Path(__file__).resolve().parent.parent / "frontend" / "build"))).resolve()
PROFILE_FIELDS = {"id", "slug", "displayName", "primaryTitle", "bio", "baseLocationName", "baseLocationId", "services",
                  "deliveryModes", "coverageScope", "languages", "timezone", "capacityStatus", "photoUrl", "avatarUrl",
                  "portfolioItems", "isFounder", "experienceYears", "skills", "profileState", "supportedCountries", "onsiteLocations"}


def public_profile(profile):
    normalizer = getattr(store, "public_profile", None)
    cleaned = normalizer(profile) if normalizer else profile
    return {key: value for key, value in cleaned.items() if key in PROFILE_FIELDS}


def safe_path(path):
    return normalized_path(path)


def geography_route(path):
    """Validate before redirecting: a prefix rewrite alone does not make a URL real."""
    candidate = canonical_location_path(path)
    if not candidate or candidate == "/locations/":
        return False
    if public_location(store.LOC_BY_PATH.get(candidate)):
        return True
    location_path, _, service_slug = candidate.rstrip("/").rpartition("/")
    return public_location(store.LOC_BY_PATH.get(location_path + "/")) and public_service(store.SERVICES_BY_SLUG.get(service_slug))


def link(label, href):
    return {"label": str(label), "href": href}


def location_label(location):
    """Disambiguate shared locality names with their real parent hierarchy."""
    parts = [location["name"]]
    current = location
    seen = {current["id"]}
    while current.get("parentId"):
        parent = store.LOC_BY_ID.get(current["parentId"])
        if not parent or parent["id"] in seen:
            break
        seen.add(parent["id"])
        if parent["name"] == parts[-1]:
            parts[-1] += " (" + location.get("type", "area") + ")"
        parts.append(parent["name"])
        current = parent
    return ", ".join(parts)


def section(heading, body="", links=None):
    result = {"heading": heading, "body": body}
    if links: result["links"] = links
    return result


def result(path, kind, heading, description, sections=None, title=None, **extra):
    return {"path": path, "canonical": domain() + path, "kind": kind, "heading": heading,
            "title": title or f"{heading} | ER Freelancer", "description": description,
            "robots": "index,follow,max-image-preview:large", "sections": sections or [], "status": 200, **extra}


def not_found(path):
    return result(path, "not-found", "Page not found", "This page does not exist or has not been published.",
                  [section("Find your next step", "Browse services, available freelancers or contact us about your project.",
                           [link("Services", "/services/"), link("Freelancers", "/freelancers/"), link("Contact", "/contact/")])],
                  robots="noindex,follow", status=404)


def paginate(items, page, path):
    total = len(items)
    pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
    if page > pages:
        return None, None
    url = lambda value: path if value == 1 else f"{path}?page={value}"
    return items[(page - 1) * PAGE_SIZE:page * PAGE_SIZE], {"page": page, "pages": pages, "total": total,
            "next": url(page + 1) if page < pages else None, "previous": url(page - 1) if page > 1 else None}


def with_pagination(data, pagination):
    data["pagination"] = pagination
    if pagination["page"] > 1:
        data["canonical"] += f"?page={pagination['page']}"
        data["title"] = f"{data['heading']} — Page {pagination['page']} | ER Freelancer"
    return data


async def available_profiles(service_id=None, location=None):
    query = profile_query()
    if service_id:
        query = {"$and": [query, {"services": service_id}]}
    profiles = await db.freelancers.find(query, NO_ID).sort("slug", 1).to_list(None)
    out = []
    for profile in profiles:
        if not profile_is_available(profile):
            continue
        if location:
            remote, onsite = profile_delivery_coverage(profile, location)
            if not onsite and not remote:
                continue
        out.append(public_profile(profile))
    return out


def service_sections(service):
    return [section("What this service covers", service.get("scopeBoundary", "")),
            section("Project deliverables", "\n".join(service.get("deliverables", []))),
            section("Scope and external costs", "\n".join(service.get("exclusions", [])) + "\nScope, pricing, delivery dates and ongoing support are agreed before work begins."),
            section("Planning your project", "\n".join(q["question"] for q in service.get("briefQuestions", []))),
            section("Technology options", ", ".join(service.get("techOptions", []))),
            section("Request a scoped quote", "Share your goals, existing systems, content readiness and preferred launch window. We review your requirements before recommending a delivery plan.", [link("Discuss your project", "/contact/")])]


async def resolve_public_page(raw_path, page=1):
    path = safe_path(raw_path)
    if not path or page < 1:
        return not_found(path or "/")
    if path.startswith("/locations/") and path != "/locations/":
        if not geography_route(path):
            return not_found(path)
        path = canonical_location_path(path)
    services = [s for s in store.SERVICES if public_service(s)]
    service_links = [link(s["title"], f"/services/{s['slug']}/") for s in services]
    if path.startswith(("/admin/", "/account/", "/dashboard/")):
        return result(path, "private", "Account access", "Sign in to access your account.", robots="noindex,nofollow")
    if path == "/":
        if page != 1: return not_found(path)
        return result(path, "home", "Your next idea, expertly built.",
                      "Freelance web development, app development, SEO, and AI automation for your business. Work remotely with Rajeev and find specialists by service and location.",
                      [section("Freelance services", "Explore website development, app development, business software and digital marketing services.", service_links),
                       section("Global remote collaboration", "Work with freelancers serving your location, including specialists available remotely.", [link("Find a freelancer", "/freelancers/"), link("Explore locations", "/locations/")]),
                       section("From idea to launch", "Discuss your requirements, agree the scope, review milestones and plan delivery and support.", [link("How it works", "/how-it-works/"), link("Discuss your project", "/contact/")])],
                      title="Freelance Web, App & AI Development | ER Freelancer")
    if path == "/services/":
        if page != 1: return not_found(path)
        return result(path, "services", "Freelance services for your business", "Explore freelance web, app, WordPress, SEO, AI and business software services.",
                      [section(s["title"], s.get("scopeBoundary", ""), [link("Explore " + s["title"], f"/services/{s['slug']}/")]) for s in services])
    if path.startswith("/services/"):
        service = next((s for s in services if path == f"/services/{s['slug']}/"), None)
        if not service or page != 1: return not_found(path)
        profiles = await available_profiles(service["id"])
        return result(path, "service", f"Freelance {service['title']}", service.get("scopeBoundary", ""),
                      service_sections(service), service=service, profiles=profiles[:PAGE_SIZE],
                      links=[link("Find a freelancer", "/freelancers/"), link("All services", "/services/")])
    if path == "/locations/":
        locations = sorted([l for l in store.LOCATIONS if public_location(l) and l.get("type") == "country"], key=lambda l: l["name"])
        items, pagination = paginate(locations, page, path)
        if items is None: return not_found(path)
        return with_pagination(result(path, "locations", "Find freelance services by location", "Explore locations served by remote and locally based freelancers.",
              [section("Choose a country", "Choose a country to explore its cities. Remote availability does not imply a physical office in that location.",
                       [link(l["name"], l["canonicalPath"]) for l in items])]), pagination)
    if geography_route(path):
        location = store.LOC_BY_PATH.get(path)
        if public_location(location):
            children = sorted([l for l in store.LOCATIONS if public_location(l) and l.get("parentId") == location["id"]], key=lambda l: l["name"])
            items, pagination = paginate(children, page, path)
            if items is None: return not_found(path)
            published = await db.pages.find({"locationId": location["id"]}, NO_ID).to_list(None)
            published = [public_page_record(p) for p in preferred_page_records(published) if is_public_page(p)]
            landing_links = [link((p.get("contentPackage") or {}).get("hero", {}).get("heading", p["canonicalPath"]), p["canonicalPath"]) for p in published]
            sections = [section("Working with a freelancer", f"Explore services for customers in {location['name']}, {location['countryName']}. Confirm each freelancer’s actual base and delivery coverage before agreeing a project. Remote service availability does not imply a local office."),
                        section("Location and coordination", f"Country: {location['countryName']}." + (f" Timezone: {location['timezone']}." if location.get("timezone") else "") + " Meeting times and delivery schedules are agreed with your chosen specialist.")]
            if items: sections.append(section("Explore areas", links=[link(l["name"], l["canonicalPath"]) for l in items]))
            if landing_links: sections.append(section("Published services for this location", links=landing_links))
            sections.append(section("Explore service capabilities", "Request a project review to confirm current availability for your requirements.", service_links))
            return with_pagination(result(path, "location", f"Freelance services for {location_label(location)}",
                  f"Find freelance services serving {location_label(location)}. Compare actual base locations and remote delivery options.", sections,
                  location=location, profiles=(await available_profiles(location=location))[:PAGE_SIZE]), pagination)
        location_path, _, service_slug = path.rstrip("/").rpartition("/")
        service = store.SERVICES_BY_SLUG.get(service_slug)
        location = store.LOC_BY_PATH.get(location_path + "/")
        if not public_service(service) or not public_location(location): return not_found(path)
        if page != 1: return not_found(path)
        stored = None
        for candidate in page_path_candidates(path):
            stored = await db.pages.find_one({"canonicalPath": candidate}, NO_ID)
            if stored:
                break
        approved = is_public_page(stored)
        profiles = await available_profiles(service["id"], location)
        # A valid combination can be browsed without publishing a stored draft or
        # mutating the database. Legacy generated claims require editorial review.
        record = public_page_record(stored) if approved else generate_structured_page(service, location, profiles)
        pkg = record["contentPackage"]
        sections = [section("Overview", pkg.get("hero", {}).get("summary", ""))]
        sections.extend(section(s.get("title", ""), s.get("content", "")) for s in pkg.get("sections", []))
        sections.extend(section(q.get("question", ""), q.get("answer", "")) for q in pkg.get("faqs", []))
        return result(path, "landing", pkg["hero"]["heading"], pkg.get("seo", {}).get("description", ""), sections,
                      title=pkg.get("seo", {}).get("title"), service=service, location=location, page=record,
                      profiles=profiles[:PAGE_SIZE], robots="index,follow,max-image-preview:large" if approved else "noindex,follow",
                      publicationStatus="published" if approved else "pending_editorial_review",
                      links=[link(service["title"], f"/services/{service['slug']}/"), link(location["name"], location["canonicalPath"])])
    if path == "/freelancers/":
        profiles, pagination = paginate(await available_profiles(), page, path)
        if profiles is None: return not_found(path)
        return with_pagination(result(path, "freelancers", "Find a freelancer", "Browse approved freelancer profiles and discuss your project requirements.",
               [section("Choose a specialist", "Review services, the actual base location and remote coverage. Availability and project scope are confirmed before work starts.")], profiles=profiles), pagination)
    if path.startswith("/freelancers/"):
        slug = path[len("/freelancers/"):-1]
        profile = await db.freelancers.find_one(profile_query(slug), NO_ID) if "/" not in slug else None
        if not profile or page != 1: return not_found(path)
        profile = public_profile(profile)
        name = profile["displayName"]
        sections = [section(profile.get("primaryTitle", "About"), profile.get("bio", "")),
                    section("Location and delivery", "\n".join(filter(None, [profile.get("baseLocationName"),
                         "Available for remote projects worldwide." if profile.get("coverageScope") == "worldwide_remote" else None,
                         "Languages: " + ", ".join(profile.get("languages", [])) if profile.get("languages") else None]))),
                    section("Services", links=[link(s["title"], f"/services/{s['slug']}/") for s in services if s["id"] in profile.get("services", [])])]
        for project in profile.get("portfolioItems", []):
            sections.append(section(project.get("title", "Portfolio") + (" — concept" if not project.get("isReal") else ""), project.get("summary", "")))
        return result(path, "profile", name, f"Explore {name}’s freelance services, working approach and project availability.", sections, profile=profile)
    if path == "/blog/":
        total = await db.blog_posts.count_documents({"status": "published"})
        pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
        if page > pages: return not_found(path)
        posts = await db.blog_posts.find({"status": "published"}, NO_ID).sort("publishedAt", -1).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).to_list(PAGE_SIZE)
        pagination = {"page": page, "pages": pages, "total": total, "next": f"/blog/?page={page+1}" if page < pages else None,
                      "previous": ("/blog/" if page == 2 else f"/blog/?page={page-1}") if page > 1 else None}
        return with_pagination(result(path, "blog", "Freelance development insights", "Articles about websites, apps, business software and working with freelancers.",
               [section("Latest articles", "Read published insights from ER Freelancer." if posts else "New articles will appear here when published.")], posts=posts), pagination)
    if path.startswith("/blog/"):
        slug = path[len("/blog/"):-1]
        post = await db.blog_posts.find_one({"slug": slug, "status": "published"}, NO_ID) if "/" not in slug else None
        if not post or page != 1: return not_found(path)
        return result(path, "post", post["title"], post.get("excerpt") or post["content"][:160],
                      [section("", post["content"])], post=post, robots="noindex,follow" if post.get("indexable") is False else "index,follow,max-image-preview:large")
    static = {
        "/about/": ("about", "About ER Freelancer", "Learn about ER Freelancer and our approach to freelance digital services.", [section("Who we are", "ER Freelancer connects business project requirements with freelance expertise in websites, applications, business software and digital growth. Rajeev is the founder."), section("How we work", "The project brief, deliverables, milestones, ownership and support terms are agreed before development starts.", [link("Explore services", "/services/"), link("Meet freelancers", "/freelancers/")])]),
        "/contact/": ("contact", "Discuss your project", "Contact ER Freelancer to discuss a website, app, software or digital marketing project.", [section("Start with your requirements", "Tell us your goals, the service you need, existing systems and preferred timeline. We review the brief before recommending scope and a suitable specialist."), section("Contact", "Phone / WhatsApp: +91 97116 23561\nEmail: hello@erfreelancer.com", [link("Call", "tel:+919711623561"), link("Email", "mailto:hello@erfreelancer.com")])]),
        "/work/": ("work", "Explore project capabilities", "Discuss website, app and business software project capabilities with ER Freelancer.", [section("Find relevant experience", "Review individual freelancer portfolios and ask for examples relevant to your requirements. Concept examples are labelled separately from completed work.", [link("Freelancer profiles", "/freelancers/")])]),
        "/how-it-works/": ("how-it-works", "How working with ER Freelancer works", "Understand the enquiry, scope, freelancer selection and delivery process.", [section("1. Share your brief", "Describe the business goal, required service, location, budget and timeline."), section("2. Review requirements and availability", "The platform reviews your enquiry and identifies a suitable available specialist. Actual location and remote delivery coverage remain clearly distinguished."), section("3. Agree the work", "Confirm the deliverables, milestones, costs, ownership and support terms in writing."), section("4. Review and launch", "Review work against the agreed scope, test the completed delivery and plan handover and ongoing support.")]),
        "/join-as-freelancer/": ("join-as-freelancer", "Join as a freelancer", "Submit your freelance profile and service coverage for platform review.", [section("Share your expertise", "Provide your professional introduction, services, actual base location, languages and portfolio. Select where you offer remote or in-person delivery."), section("Profile review", "Applications are reviewed before becoming publicly available. Joining does not guarantee project assignments.")]),
    }
    if path in static and page == 1:
        kind, heading, description, sections = static[path]
        return result(path, kind, heading, description, sections,
                      robots="noindex,follow" if kind == "join-as-freelancer" else "index,follow,max-image-preview:large")
    return not_found(path)


def schema_for(data):
    if data["status"] != 200 or data["kind"] == "private": return []
    organization = {"@type": "Organization", "@id": domain() + "/#organization", "name": "ER Freelancer", "url": domain() + "/"}
    page = {"@type": "WebPage", "@id": data["canonical"] + "#webpage", "url": data["canonical"], "name": data["title"],
            "description": data["description"], "isPartOf": {"@id": domain() + "/#website"}}
    graph = [organization, {"@type": "WebSite", "@id": domain() + "/#website", "name": "ER Freelancer", "url": domain() + "/", "publisher": {"@id": organization["@id"]}}, page]
    if data.get("service"):
        graph.append({"@type": "Service", "name": data["service"]["title"], "url": data["canonical"], "description": data["service"].get("scopeBoundary", ""), "provider": {"@id": organization["@id"]}, **({"areaServed": {"@type": "Place", "name": data["location"]["name"]}} if data.get("location") else {})})
    if data.get("profile"):
        graph.append({"@type": "Person", "name": data["profile"]["displayName"], "url": data["canonical"], "description": data["profile"].get("bio", "")})
    if data.get("post"):
        post = data["post"]
        author = post.get("author", "ER Freelancer")
        article = {"@type": "BlogPosting", "headline": post["title"], "description": data["description"], "mainEntityOfPage": data["canonical"], "author": {"@type": "Organization" if author == "ER Freelancer" else "Person", "name": author}}
        if post.get("publishedAt"): article["datePublished"] = post["publishedAt"]
        if post.get("updatedAt"): article["dateModified"] = post["updatedAt"]
        graph.append(article)
    breadcrumbs = [{"@type": "ListItem", "position": 1, "name": "Home", "item": domain() + "/"}]
    if data["path"] != "/":
        if data["kind"] in ("service", "landing"):
            breadcrumbs.append({"@type": "ListItem", "position": 2, "name": "Services", "item": domain() + "/services/"})
        breadcrumbs.append({"@type": "ListItem", "position": len(breadcrumbs) + 1, "name": data["heading"], "item": data["canonical"]})
        graph.append({"@type": "BreadcrumbList", "itemListElement": breadcrumbs})
    return [{"@context": "https://schema.org", "@graph": graph}]


def json_script(value):
    return json.dumps(value, ensure_ascii=False, default=str).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def render_links(links):
    safe = [l for l in links if isinstance(l.get("href"), str) and (l["href"].startswith("/") and not l["href"].startswith("//") or l["href"].startswith(("mailto:", "tel:")))]
    return "<ul>" + "".join(f'<li><a href="{escape(l["href"], quote=True)}">{escape(str(l["label"]))}</a></li>' for l in safe) + "</ul>" if safe else ""


def render_html(data, template=None):
    if template is None:
        index = BUILD_DIR / "index.html"
        template = index.read_text() if index.is_file() else '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>'
    # Remove build-time metadata so each URL has one authoritative set.
    template = re.sub(r"<title\b[^>]*>.*?</title>", "", template, flags=re.I | re.S)
    template = re.sub(r'<meta\b(?=[^>]*(?:name|property)=["\'](?:description|keywords|robots|og:[^"\']+|twitter:[^"\']+)["\'])[^>]*>', "", template, flags=re.I)
    template = re.sub(r'<link\b(?=[^>]*rel=["\']canonical["\'])[^>]*>', "", template, flags=re.I)
    template = re.sub(r'<script\b(?=[^>]*type=["\']application/ld\+json["\'])[^>]*>.*?</script>', "", template, flags=re.I | re.S)
    title, description, canonical = (escape(data[k], quote=True) for k in ("title", "description", "canonical"))
    head = f'<title>{title}</title><meta name="description" content="{description}"><meta name="robots" content="{escape(data["robots"], quote=True)}"><link rel="canonical" href="{canonical}"><meta property="og:title" content="{title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><meta property="og:type" content="{"article" if data["kind"] == "post" else "website"}"><meta property="og:site_name" content="ER Freelancer"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{description}">'
    head += '<script id="page-schema" type="application/ld+json">' + json_script(data["structuredData"]) + "</script>"
    template = template.replace("</head>", head + "</head>")
    body = '<header><a href="/">ER Freelancer</a><nav aria-label="Main navigation">' + render_links([link("Services", "/services/"), link("Locations", "/locations/"), link("Freelancers", "/freelancers/"), link("About", "/about/"), link("Contact", "/contact/")]) + '</nav></header><main><nav aria-label="Breadcrumb"><a href="/">Home</a>'
    if data["kind"] in ("service", "landing"):
        body += ' / <a href="/services/">Services</a>'
    if data["path"] != "/":
        body += ' / <span aria-current="page">' + escape(data["heading"]) + '</span>'
    body += '</nav>'
    body += f'<h1>{escape(data["heading"])}</h1><p>{escape(data["description"])}</p>'
    for item in data.get("sections", []):
        body += "<section>" + (f'<h2>{escape(item["heading"])}</h2>' if item.get("heading") else "")
        body += "".join(f"<p>{escape(paragraph)}</p>" for paragraph in str(item.get("body", "")).split("\n") if paragraph.strip())
        body += render_links(item.get("links", [])) + "</section>"
    for profile in data.get("profiles", []):
        body += f'<article><h2><a href="/freelancers/{escape(profile["slug"], quote=True)}/">{escape(profile["displayName"])}</a></h2><p>{escape(profile.get("primaryTitle", ""))}</p><p>{escape(profile.get("bio", ""))}</p></article>'
        if profile.get("baseLocationName"):
            body += f'<p>Based in {escape(profile["baseLocationName"])}</p>'
        if profile.get("coverageScope") == "worldwide_remote":
            body += '<p>Available for remote projects worldwide</p>'
        if profile.get("languages"):
            body += '<p>Languages: ' + escape(", ".join(profile["languages"])) + '</p>'
    for post in data.get("posts", []):
        body += f'<article><h2><a href="/blog/{escape(post["slug"], quote=True)}/">{escape(post["title"])}</a></h2><p>{escape(post.get("excerpt", ""))}</p></article>'
    body += render_links(data.get("links", []))
    pagination = data.get("pagination", {})
    body += render_links([link(label, pagination[key]) for key, label in [("previous", "Previous page"), ("next", "Next page")] if pagination.get(key)])
    body += '</main><footer><a href="/contact/">Discuss your project</a></footer>'
    template = re.sub(r'<div\s+id=["\']root["\']\s*>\s*</div>', lambda _: '<div id="root">' + body + '</div>', template, count=1)
    bootstrap = '<script id="page-data" type="application/json">' + json_script(data) + "</script>"
    return template.replace("</body>", bootstrap + "</body>")


async def page_data(path, page):
    data = await resolve_public_page(path, page)
    data["structuredData"] = schema_for(data)
    return data


@router.get("/api/public-page")
async def public_page_api(path: str = "/", page: int = Query(1, ge=1, le=100000)):
    data = await page_data(path, page)
    return JSONResponse(data, status_code=data["status"], headers={"X-Robots-Tag": "noindex", "Cache-Control": "no-store"})


@router.get("/robots.txt")
async def root_robots(): return await robots()


@router.get("/sitemap.xml")
async def root_sitemap(): return await sitemap_index()


@router.get("/sitemaps/{name}")
async def root_sitemap_file(name: str): return await sitemap_file(name)


@router.api_route("/{path:path}", methods=["GET", "HEAD"])
async def public_document(request: Request, path: str):
    if path.startswith("api/"):
        return JSONResponse({"detail": "Not found"}, status_code=404, headers={"X-Robots-Tag": "noindex"})
    # The build contains public assets only. Never resolve paths outside this directory.
    asset = (BUILD_DIR / path).resolve()
    if path and asset.is_relative_to(BUILD_DIR) and asset.is_file() and asset.name != "index.html":
        cache = "public,max-age=31536000,immutable" if path.startswith("static/") else "public,max-age=3600"
        return FileResponse(asset, headers={"Cache-Control": cache})
    raw_page = request.query_params.get("page", "1")
    page = int(raw_page) if re.fullmatch(r"[1-9][0-9]{0,5}", raw_page) else 0
    data = await page_data("/" + path, page)
    if data["status"] == 200 and request.url.path != data["path"]:
        # Internal relative redirect avoids trusting Host / forwarded headers.
        query = ("?" + request.url.query) if request.url.query else ""
        migrated = request.url.path.startswith("/locations/") and data["kind"] in ("location", "landing")
        return RedirectResponse(data["path"] + query, status_code=301 if migrated else 308)
    return HTMLResponse(render_html(data), status_code=data["status"], headers={"X-Robots-Tag": data["robots"], "Cache-Control": "no-store"})
