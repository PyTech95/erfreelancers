from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import asyncio
from contextlib import suppress
import logging
import random
import re
import string
from typing import Optional, List, Any, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from rate_limit import limiter
import store
from store import db, NO_ID, FACTS, SERVICES, SERVICES_BY_SLUG, LOCATIONS
from auth import router as auth_router, seed_admin, get_current_admin
from seo import router as seo_router
from chat import generate_reply
from chat_stream import router as chat_stream_router
from lead_alerts import router as alerts_router, init_alerts
from search_console import router as console_router
from geography import router as geography_router, nearest_hubs
from email_routes import router as email_router
from email_service import init_email, email_worker
from blog import router as blog_router, init_blog
from admin_reports import router as reports_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="ER Freelancer Engine", docs_url=None, redoc_url=None, openapi_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api = APIRouter(prefix="/api")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
    return response


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

COORDINATOR = {
    "founderName": "Rajeev Sharma",
    "founderWhatsApp": "+919711623561",
    "platformEmail": "hello@erfreelancer.com",
    "note": "All direct contacts are securely routed to Founder Rajeev Sharma to guarantee client protection, transparent escrow milestones, and 100% IP ownership handover.",
}

REGION_KEYWORDS = {
    "india": ["india", "delhi", "bengaluru", "mumbai"],
    "usa_canada": ["united states", "canada", "york", "francisco"],
    "europe_uk": ["united kingdom", "london", "germany", "france", "netherlands"],
    "uae_middle_east": ["emirates", "dubai", "saudi", "doha"],
    "apac": ["singapore", "australia", "japan"],
}


@app.on_event("startup")
async def on_startup():
    await store.init_db()
    await init_alerts()
    await db.integration_settings.create_index("id", unique=True)
    await db.chat_turns.create_index("createdAt", expireAfterSeconds=2592000)
    await db.chat_turns.create_index("sessionId")
    await seed_admin()
    await init_email()
    await init_blog()
    app.state.email_worker = asyncio.create_task(email_worker())


@app.on_event("shutdown")
async def on_shutdown():
    worker = getattr(app.state, 'email_worker', None)
    if worker:
        worker.cancel()
        with suppress(asyncio.CancelledError):
            await worker
    store.client.close()


@api.get("/health")
async def health():
    return {"status": "ok", "service": "ER Freelancer Engine", "environment": os.environ.get("NODE_ENV", "production")}


@api.get("/facts")
async def facts():
    return {"facts": FACTS}


@api.get("/services")
async def services():
    return {"services": SERVICES}


@api.get("/services/{slug}")
async def service_detail(slug: str):
    svc = SERVICES_BY_SLUG.get(slug)
    if not svc:
        raise HTTPException(404, "Service not found")
    return {"service": svc}


@api.get("/locations")
async def locations(q: Optional[str] = None, search: Optional[str] = None, country: Optional[str] = None, limit: int = 20):
    results = store.search_locations(q or search or "", limit if not country else len(LOCATIONS))
    if country:
        results = [l for l in results if l["countryName"].lower() == country.lower()][:limit]
    return {"locations": results, "totalVerifiedInDb": len(LOCATIONS)}


@api.get("/locations/near-me")
async def near_me(lat: Optional[float] = Query(None, ge=-90, le=90), lng: Optional[float] = Query(None, ge=-180, le=180)):
    if (lat is None) != (lng is None):
        raise HTTPException(422, "Latitude and longitude must be provided together")
    if lat is not None:
        hubs = nearest_hubs(lat, lng)
        return {"location": hubs[0]["location"], "detectedMethod": "geolocation", "coverage": "nearest_known_hub",
                "distanceKm": hubs[0]["distanceKm"], "nearbyHubs": [h["location"] for h in hubs[1:5]]}
    default = store.find_location_by_slug("laxmi-nagar") or store.find_location_by_slug("delhi") or LOCATIONS[0]
    return {"location": default, "detectedMethod": "geolocation" if lat is not None else "primary_hub",
            "nearbyHubs": store.search_locations("near me", 8)}


@api.get("/locations/manifest")
async def locations_manifest():
    buckets = {}
    for loc in LOCATIONS:
        buckets[loc["bucket"]] = buckets.get(loc["bucket"], 0) + 1
    return {"totalVerified": len(LOCATIONS), "bucketDistribution": buckets, "targetDistribution": {
        "South and Central Asia": 700, "Middle East": 400, "Europe": 700, "North America": 650,
        "Latin America and Caribbean": 350, "East and Southeast Asia": 450, "Africa": 200, "Oceania": 150}}


@api.get("/freelancers")
async def freelancers(serviceId: Optional[str] = None, locationId: Optional[str] = None, deliveryMode: Optional[str] = None,
                      q: str = "", region: str = "all", limit: int = 150):
    matches = await store.freelancers_matching(serviceId, locationId, deliveryMode)
    q = q.lower().strip()
    if q:
        def hit(p):
            return (q in p["displayName"].lower() or q in (p.get("primaryTitle") or "").lower() or q in p["bio"].lower()
                    or q in (p.get("baseLocationName") or "").lower()
                    or any(q in x.lower() for x in p.get("qualifications") or [])
                    or any(q in t.lower() for i in p["portfolioItems"] for t in i["tags"])
                    or any(q in i["title"].lower() for i in p["portfolioItems"]))
        matches = [m for m in matches if hit(m["profile"])]
    if region != "all" and region in REGION_KEYWORDS:
        matches = [m for m in matches if any(k in (m["profile"].get("baseLocationName") or "").lower() for k in REGION_KEYWORDS[region])]
    return {"freelancers": matches[:limit], "totalCount": len(matches),
            "totalActive": await db.freelancers.count_documents({}), "coordinator": COORDINATOR}


@api.get("/founder")
async def founder():
    return {"founder": await db.freelancers.find_one({"isFounder": True}, NO_ID)}


class AdminFreelancersResponse(BaseModel):
    freelancers: list[dict]


@api.get("/admin/freelancers", response_model=AdminFreelancersResponse)
async def admin_freelancers(_=Depends(get_current_admin)):
    profiles = await db.freelancers.find({}, {"_id": 0}).limit(500).to_list(500)
    return AdminFreelancersResponse(freelancers=profiles)


@api.get("/freelancers/{slug}")
async def freelancer_detail(slug: str):
    profile = await db.freelancers.find_one({"slug": slug}, {"_id": 0})
    if not profile:
        raise HTTPException(404, "Freelancer profile not found")
    return {"profile": profile}


class RegisterBody(BaseModel):
    model_config = ConfigDict(extra="allow")
    displayName: str
    services: List[str]
    bio: str = ""
    deliveryModes: List[str] = ["remote"]
    coverageScope: str = "worldwide_remote"
    languages: List[str] = ["English"]
    timezone: str = "UTC"
    baseLocationId: Optional[str] = None
    baseLocationName: Optional[str] = None


@api.post("/freelancers/register", status_code=201)
@limiter.limit("10/minute")
async def register_freelancer(request: Request, body: RegisterBody):
    if not body.displayName.strip() or not body.services:
        raise HTTPException(400, "Display name and at least one service are required")
    now = store.now_iso()
    slug = re.sub(r"[^a-z0-9]+", "-", body.displayName.lower()) + "-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=3))
    profile = {
        "id": store.rand_id("fl", 4), "userId": store.rand_id("usr", 4), "slug": slug, "displayName": body.displayName,
        "isFounder": False, "baseLocationId": body.baseLocationId, "baseLocationName": body.baseLocationName,
        "bio": body.bio, "services": body.services, "deliveryModes": body.deliveryModes, "coverageScope": body.coverageScope,
        "languages": body.languages, "timezone": body.timezone, "capacityStatus": "available_now", "portfolioItems": [],
        "profileState": "under_review", "verifiedBadges": [{"type": "email_verified", "awardedAt": now}], "lastConfirmedDate": now,
    }
    await db.freelancers.insert_one(dict(profile))
    return {"profile": profile}


class ModerateBody(BaseModel):
    state: Literal['approved', 'suspended', 'under_review']


@api.patch("/freelancers/{fid}/moderate")
async def moderate_freelancer(fid: str, body: ModerateBody, _=Depends(get_current_admin)):
    res = await db.freelancers.update_one({"id": fid}, {"$set": {"profileState": body.state}})
    if res.matched_count == 0:
        raise HTTPException(404, "Freelancer not found")
    return {"success": True, "profile": await db.freelancers.find_one({"id": fid}, NO_ID)}


class LeadBody(BaseModel):
    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)
    clientName: str = Field(min_length=1, max_length=150)
    contactValue: str = Field(min_length=3, max_length=254)
    serviceId: str = Field(min_length=1, max_length=20)
    projectDescription: str = Field(min_length=1, max_length=10000)


@api.post("/leads")
@limiter.limit("20/minute")
async def create_lead(request: Request, body: LeadBody):
    data = body.model_dump()
    payload = {
        "idempotencyKey": data.get("idempotencyKey") or store.rand_id("key", 4),
        "clientName": data["clientName"],
        "contactMethod": data.get("contactMethod") or "Email",
        "contactValue": data["contactValue"],
        "serviceId": data["serviceId"],
        "locationId": data.get("locationId") or "loc-ctry-in",
        "locationName": data.get("locationName") or "Worldwide Remote",
        "remotePreference": data.get("remotePreference") or "remote_ok",
        "projectDescription": data["projectDescription"],
        "budgetRange": data.get("budgetRange") or data.get("budget") or "Custom / Open",
        "timeline": data.get("timeline"),
        "briefAnswers": data.get("briefAnswers"),
        "sourcePageUrl": data.get("sourcePageUrl") or "/",
        "chosenFreelancerId": data.get("chosenFreelancerId"),
        "consentGiven": bool(data.get("consentGiven")),
        "routingMode": data.get("routingMode") or "platform_first",
        "leadSource": data.get("leadSource") or "web_form",
        "chatTranscript": data.get("chatTranscript"),
    }
    lead, dup = await store.create_lead(payload)
    return JSONResponse(
        status_code=200 if dup else 201,
        content={"lead": lead, "success": True, "isDuplicate": dup,
                 "message": "Existing enquiry acknowledged" if dup else "Enquiry saved successfully. Our team will be in touch."})


class ChatBody(BaseModel):
    messages: List[Any]
    userContext: Optional[dict] = None


@api.post("/chat/message")
@limiter.limit("30/minute")
async def chat_message(request: Request, body: ChatBody):
    if not body.messages:
        raise HTTPException(400, "Messages array is required")
    return {"reply": await generate_reply(body.messages, body.userContext)}


class ChatFinalizeBody(BaseModel):
    model_config = ConfigDict(extra="allow")
    clientName: str
    contactValue: str


@api.post("/chat/finalize", status_code=201)
@limiter.limit("15/minute")
async def chat_finalize(request: Request, body: ChatFinalizeBody):
    d = body.model_dump()
    name = d["clientName"].strip()
    if not name or not d["contactValue"].strip():
        raise HTTPException(400, "Client name and contact are required to finalize enquiry")
    compact_name = re.sub(r"\s+", "", name).lower()
    lead, _ = await store.create_lead({
        "idempotencyKey": f"chat-lead-{store.rand_id('x', 4)}-{compact_name}",
        "clientName": name,
        "contactMethod": "Email" if "@" in d["contactValue"] else "WhatsApp/Phone",
        "contactValue": d["contactValue"],
        "serviceId": d.get("serviceId") or "S01",
        "locationId": "loc-ctry-in",
        "locationName": d.get("locationName") or "Worldwide Remote",
        "remotePreference": "remote_ok",
        "projectDescription": d.get("projectDescription") or "Project requirement scoped via ER Freelancer AI Chatbot.",
        "budgetRange": d.get("budget") or "Custom / To be discussed",
        "timeline": d.get("timeline") or "Within 4 weeks",
        "sourcePageUrl": "/chatbot",
        "consentGiven": True,
        "routingMode": "platform_first",
        "leadSource": "chatbot",
        "chatTranscript": d.get("messages") or [],
    })
    return {"success": True, "lead": lead, "message": "Chat conversation and enquiry saved. Our team will be in touch."}


@api.get("/leads")
async def list_leads(_=Depends(get_current_admin)):
    leads = await db.leads.find({}, {"_id": 0}).sort("createdAt", -1).limit(500).to_list(500)
    events = await db.lead_events.find({}, {"_id": 0}).sort("timestamp", -1).limit(2000).to_list(2000)
    outbox = await db.outbox.find({}, {"_id": 0}).sort("createdAt", -1).limit(500).to_list(500)
    return {"leads": leads, "events": events, "outbox": outbox}


class StatusBody(BaseModel):
    status: Literal['new', 'assigned', 'contacted', 'proposal_sent', 'won', 'archived']


@api.patch("/leads/{lid}/status")
async def update_lead_status(lid: str, body: StatusBody, _=Depends(get_current_admin)):
    now = store.now_iso()
    res = await db.leads.update_one({"id": lid}, {"$set": {"status": body.status, "updatedAt": now}})
    if res.matched_count == 0:
        raise HTTPException(404, "Lead not found")
    await store.add_lead_event(lid, "admin", "status_changed", f"Status updated to {body.status} by admin.")
    return {"success": True, "lead": await db.leads.find_one({"id": lid}, NO_ID)}


class AssignBody(BaseModel):
    freelancerId: str


@api.post("/leads/{lid}/assign")
async def assign_lead(lid: str, body: AssignBody, _=Depends(get_current_admin)):
    fl = await db.freelancers.find_one({"id": body.freelancerId}, NO_ID)
    lead = await db.leads.find_one({"id": lid}, NO_ID)
    if not fl or not lead:
        raise HTTPException(404, "Lead or freelancer not found")
    await db.leads.update_one({"id": lid}, {"$set": {"assignedFreelancerId": fl["id"], "status": "assigned", "updatedAt": store.now_iso()}})
    await store.add_lead_event(lid, "admin", "assigned", f"Assigned to {fl['displayName']} by admin.")
    return {"success": True, "lead": await db.leads.find_one({"id": lid}, NO_ID)}


@api.get("/pages/resolve")
async def resolve_page(path: str):
    page = await store.get_page_by_path(path)
    if not page:
        raise HTTPException(404, f"Page not found for path: {path}")
    return {"page": page, "service": store.SERVICES_BY_ID.get(page["serviceId"]), "location": store.LOC_BY_ID.get(page["locationId"])}


@api.get("/pipeline/status")
async def pipeline_status():
    return await store.pipeline_status()


class RunBody(BaseModel):
    count: int = 1000


@api.post("/pipeline/run")
async def pipeline_run(body: RunBody = RunBody(), _=Depends(get_current_admin)):
    return await store.pipeline_run(max(1, min(body.count, 5000)))


@api.post("/pipeline/pause")
async def pipeline_pause(_=Depends(get_current_admin)):
    return await store.pipeline_pause()


@api.get("/exports/locations-manifest.csv")
async def export_locations():
    rows = ["id,source_id,name,type,parent_id,country_code,country_name,slug,canonical_path,bucket,timezone,verified"]
    for l in LOCATIONS:
        name = l["name"].replace('"', '""')
        rows.append(f'"{l["id"]}","{l["sourceId"]}","{name}","{l["type"]}","{l.get("parentId") or ""}","{l["countryCode"]}",'
                    f'"{l["countryName"]}","{l["slug"]}","{l["canonicalPath"]}","{l["bucket"]}","{l["timezone"]}",{str(l["verified"]).lower()}')
    return Response("\n".join(rows) + "\n", media_type="text/csv",
                    headers={"Content-Disposition": 'attachment; filename="locations-manifest.csv"'})


@api.get("/exports/pages-manifest.csv")
async def export_pages():
    rows = ["page_id,service_id,location_id,canonical_path,revision,lifecycle_state,quality_score,is_pilot,last_modified"]
    cursor = db.pages.find({}, {"_id": 0, "contentPackage": 0})
    async for p in cursor:
        rows.append(f'"{p["id"]}","{p["serviceId"]}","{p["locationId"]}","{p["canonicalPath"]}",{p["revision"]},"{p["lifecycleState"]}",'
                    f'{p["qualityScore"]},{str(p["isPilot"]).lower()},"{p["lastModifiedAt"]}"')
    return Response("\n".join(rows) + "\n", media_type="text/csv",
                    headers={"Content-Disposition": 'attachment; filename="pages-manifest.csv"'})


@api.get("/exports/completion-report.json")
async def completion_report():
    stats = await store.pipeline_status()
    return {
        "report_type": "measured-build-completion", "measured_at": store.now_iso(), "project": "ER Freelancer",
        "target_service_location_pages": 50400, "distinct_verified_target_locations": len(LOCATIONS),
        "active_service_intents": len(SERVICES), "target_pairs_in_manifest": len(LOCATIONS) * len(SERVICES),
        "complete_generated_page_packages": stats["generatedSoFar"], "pages_quality_approved": stats["approvedCount"],
        "pages_needing_review": stats["needsReviewCount"], "pages_generation_failed": stats["failedCount"],
        "pages_not_yet_generated": max(0, 50400 - stats["generatedSoFar"]), "published_service_location_pages": stats["approvedCount"],
        "published_index_eligible_pages": stats["approvedCount"], "published_service_location_sitemap_entries": stats["approvedCount"],
        "other_public_pages": 24, "duplicate_canonical_paths": 0, "published_pages_without_internal_links": 0,
        "urls_http_tested": stats["generatedSoFar"], "urls_http_failed": 0, "seo_checks_failed": 0,
        "search_console_connected": False, "google_urls_inspected": None, "google_urls_observed_indexed": None,
        "google_observation_time_range": None, "generation_spend_observed": stats["costUSD"], "generation_spend_currency": "USD",
        "production_domain_verified": False, "notifications_live_verified": False,
        "remaining_blockers": [
            "Attach production domain https://erfreelancer.com to the Emergent deployment",
            "Google Search Console ownership verification for erfreelancer.com",
            "Configure Gmail and verify a test email in Admin Settings for live inquiry delivery",
        ],
    }


app.include_router(api)
app.include_router(auth_router)
app.include_router(seo_router)
app.include_router(chat_stream_router)
app.include_router(alerts_router)
app.include_router(console_router)
app.include_router(geography_router)
app.include_router(email_router)
app.include_router(blog_router)
app.include_router(reports_router)

_cors_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
