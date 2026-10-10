import json
from copy import deepcopy
import os
import random
import string
import time
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

from content_builder import generate_structured_page, profile_is_available, profile_delivery_coverage
from url_paths import canonical_location_path, page_path_candidates, public_location_record, public_page_record

DATA_DIR = Path(__file__).parent / "data"

FACTS = json.loads((DATA_DIR / "facts.json").read_text())
SERVICES = json.loads((DATA_DIR / "services.json").read_text())
ALL_LOCATIONS = json.loads((DATA_DIR / "locations.json").read_text())
# Synthetic numbered zones in the supplied import are retained for review, not
# advertised as verified real places. This never deletes existing Mongo data.
LOCATIONS = [public_location_record(loc) for loc in ALL_LOCATIONS
             if not str(loc.get("sourceId", "")).startswith("gn-zone-")
             and loc.get("active", True) and loc.get("indexable", True)]
SEED_FREELANCERS = json.loads((DATA_DIR / "freelancers.json").read_text())

SERVICES_BY_ID = {s["id"]: s for s in SERVICES}
SERVICES_BY_SLUG = {s["slug"]: s for s in SERVICES}
LOC_BY_ID = {l["id"]: l for l in LOCATIONS}
LOC_BY_PATH = {l["canonicalPath"]: l for l in LOCATIONS}

SEED_REVIEW_IDS = [f["id"] for f in SEED_FREELANCERS if not f.get("isFounder")]
TARGET_PAGES = len(LOCATIONS) * len(SERVICES)
RUN_ID = "run-reviewed-geography-v2"
NO_ID = {"_id": 0}

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def rand_id(prefix, n=6):
    return f"{prefix}-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=n))}"


def find_location_by_slug(slug):
    s = slug.lower()
    for loc in LOCATIONS:
        if loc["slug"] == s or s in [a.lower() for a in loc["aliases"]]:
            return loc
    return None


def search_locations(query, limit=20):
    if not query or not query.strip():
        return LOCATIONS[:limit]
    q = query.lower().strip()
    if any(k in q for k in ("near", "local", "around", "pass", "najdik")):
        results = []
        for slug in ["delhi", "laxmi-nagar", "connaught-place", "noida", "gurugram", "bengaluru", "mumbai", "dubai-marina", "london"]:
            match = find_location_by_slug(slug) or next((l for l in LOCATIONS if slug in l["slug"]), None)
            if match and match not in results:
                results.append(match)
        for loc in LOCATIONS:
            if len(results) >= limit:
                break
            if loc not in results:
                results.append(loc)
        return results[:limit]
    results = []
    for loc in LOCATIONS:
        if q in loc["name"].lower() or q in loc["countryName"].lower() or any(q in a.lower() for a in loc["aliases"]):
            results.append(loc)
            if len(results) >= limit:
                break
    return results


async def init_db():
    await db.freelancers.create_index("id", unique=True)
    await db.pages.create_index("id", unique=True)
    await db.pages.create_index("canonicalPath", unique=True)
    await db.pages.create_index([("lifecycleState", 1), ("indexable", 1), ("canonicalPath", 1)])
    await db.leads.create_index("id", unique=True)
    await db.leads.create_index("idempotencyKey")
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")

    for fl in SEED_FREELANCERS:
        seed = dict(fl)
        if not fl.get("isFounder"):
            seed.update(profileState="under_review", editorialVerified=False)
        await db.freelancers.update_one({"id": fl["id"]}, {"$setOnInsert": seed}, upsert=True)

    if await db.pages.count_documents({}) == 0:
        pilot_slugs = ["delhi", "laxmi-nagar", "vasant-kunj", "dubai-marina", "bengaluru", "shoreditch", "manhattan", "sao-paulo", "singapore", "sydney"]
        pilot_locs = [find_location_by_slug(s) or LOCATIONS[i] for i, s in enumerate(pilot_slugs)]
        pages = [generate_structured_page(svc, loc, SEED_FREELANCERS, is_pilot=True) for loc in pilot_locs for svc in SERVICES]
        await db.pages.insert_many(pages)

    if not await db.runs.find_one({"id": RUN_ID}):
        count = await db.pages.count_documents({})
        await db.runs.insert_one({
            "id": RUN_ID, "targetCount": TARGET_PAGES, "generatedCount": count, "approvedCount": await db.pages.count_documents({"lifecycleState": {"$in": ["approved", "published"]}}),
            "needsReviewCount": await db.pages.count_documents({"lifecycleState": "needs_review"}), "failedCount": 0, "status": "idle", "costSpentUSD": 0, "tokensUsed": 0,
            "startedAt": now_iso(), "updatedAt": now_iso(), "checkpointIndex": 0,
        })


def public_freelancer_query(slug=None):
    query = {
        "profileState": "approved",
        "capacityStatus": {"$nin": ["unavailable", "waitlist", "paused", "inactive"]},
        "isDemo": {"$ne": True}, "isTest": {"$ne": True},
        "$or": [{"id": {"$nin": SEED_REVIEW_IDS}}, {"editorialVerified": True}],
    }
    if slug:
        query["slug"] = slug
    return query


def public_profile(profile):
    """Expose approved public fields only; imported claims need actual evidence."""
    if not profile:
        return None
    allowed = {"id", "slug", "displayName", "isFounder", "baseLocationId", "baseLocationName",
               "primaryTitle", "qualifications", "experienceYears", "bio", "profileState", "services",
               "deliveryModes", "coverageScope", "supportedCountries", "onsiteLocations", "languages",
               "timezone", "capacityStatus", "portfolioItems", "lastConfirmedDate", "photoUrl", "avatarUrl"}
    result = {k: deepcopy(v) for k, v in profile.items() if k in allowed}
    result["verifiedBadges"] = deepcopy(profile.get("verifiedBadges", [])) if profile.get("verificationEvidence") else []
    if profile.get("reviewEvidence"):
        for key in ("rating", "completedProjects"):
            if key in profile:
                result[key] = profile[key]
    if profile.get("isFounder") and not profile.get("editorialVerified"):
        result.update(displayName="Raji", baseLocationId=None, baseLocationName="India · available remotely",
                      primaryTitle="Founder & freelance developer", experienceYears="15+ years",
                      bio="Rajeev, known as Raji, is the founder of ER Freelancer. Work directly with him on websites, applications and business software, with remote collaboration available worldwide.",
                      qualifications=[], portfolioItems=[])
    return result


async def all_freelancers():
    return [public_profile(p) for p in await db.freelancers.find(public_freelancer_query(), NO_ID).to_list(2000)]

async def freelancers_matching(service_id=None, location_id=None, delivery_mode=None):
    approved = await all_freelancers()
    target = LOC_BY_ID.get(location_id) if location_id else None
    out = []
    for f in approved:
        if not profile_is_available(f):
            continue
        matches_service = not service_id or service_id in f["services"]
        is_local = bool(target) and f.get("baseLocationId") in (target["id"], target.get("parentId"))
        is_remote, is_onsite = profile_delivery_coverage(f, target)
        eligible = matches_service
        if delivery_mode == "onsite":
            eligible = eligible and is_onsite
        elif delivery_mode == "remote":
            eligible = eligible and is_remote
        else:
            eligible = eligible and (not target or is_onsite or is_remote)
        if eligible:
            out.append({
                "profile": f, "isLocal": is_local, "isRemote": is_remote, "eligible": True,
                "matchReason": f"Based in {target['name'] if target else 'area'}" if is_local
                else "In-person delivery coverage includes this area" if is_onsite
                else "Remote delivery available within the profile's coverage",
            })
    return out


async def _sync_run_counts():
    count = await db.pages.count_documents({})
    await db.runs.update_one({"id": RUN_ID}, {"$set": {"generatedCount": count, "approvedCount": await db.pages.count_documents({"lifecycleState": {"$in": ["approved", "published"]}}), "updatedAt": now_iso()}})


async def get_or_create_page(service_id, location_id):
    page_id = f"page-{service_id.lower()}-{location_id}"
    page = await db.pages.find_one({"id": page_id}, NO_ID)
    if page:
        return public_page_record(page)
    service, location = SERVICES_BY_ID.get(service_id), LOC_BY_ID.get(location_id)
    if not service or not location:
        return None
    page = generate_structured_page(service, location, await all_freelancers(), is_pilot=False)
    await db.pages.update_one({"id": page_id}, {"$setOnInsert": page}, upsert=True)
    await _sync_run_counts()
    return public_page_record(await db.pages.find_one({"id": page_id}, NO_ID))


async def get_page_by_path(path):
    # Prefer a current-path row, then an existing legacy-path row. Neither read
    # changes publication state nor creates a duplicate page during migration.
    for candidate in page_path_candidates(path):
        page = await db.pages.find_one({"canonicalPath": candidate}, NO_ID)
        if page:
            return public_page_record(page)
    return None


async def create_lead(payload: dict):
    from lead_alerts import enqueue_lead_alert
    from email_service import enqueue_lead_emails
    key = payload.get("idempotencyKey")
    if key:
        existing = await db.leads.find_one({"idempotencyKey": key}, NO_ID)
        if existing:
            await enqueue_lead_alert(existing)
            return existing, True

    now = now_iso()
    lead = {
        **payload,
        "id": rand_id("lead"),
        "budgetRange": payload.get("budgetRange") or payload.get("budget") or "Custom / Open",
        "leadSource": payload.get("leadSource") or "web_form",
        "status": "new",
        "createdAt": now,
        "updatedAt": now,
        "emailQueued": False,
    }
    lead.pop("budget", None)

    if payload.get("routingMode") == "direct_assignment" and payload.get("chosenFreelancerId"):
        fl = await db.freelancers.find_one({"id": payload["chosenFreelancerId"]}, NO_ID)
        if fl and fl["profileState"] == "approved":
            lead["assignedFreelancerId"] = fl["id"]
            lead["status"] = "assigned"

    await db.leads.insert_one(dict(lead))

    events = [{
        "id": rand_id("evt", 4), "leadId": lead["id"], "actor": "system", "eventType": "created",
        "details": f"Enquiry submitted from {lead['leadSource']} for {payload.get('serviceId')} in {payload.get('locationName')}. "
                   f"Client Budget: {lead['budgetRange']}. Routing: {payload.get('routingMode')}.",
        "timestamp": now,
    }]
    if lead.get("assignedFreelancerId"):
        events.append({"id": rand_id("evt", 4), "leadId": lead["id"], "actor": "system", "eventType": "assigned",
                       "details": f"Directly assigned to specialist {lead['assignedFreelancerId']}.", "timestamp": now})
    await db.lead_events.insert_many(events)

    try:
        await enqueue_lead_emails(lead)
        lead['emailQueued'] = True
    except Exception:
        # The saved lead's emailQueued=False flag will be reconciled by the worker.
        import logging
        logging.getLogger(__name__).warning('Email queue deferred for saved inquiry %s', lead['id'])
    await enqueue_lead_alert(lead)
    return lead, False


async def add_lead_event(lead_id, actor, event_type, details):
    await db.lead_events.insert_one({"id": rand_id("evt", 4), "leadId": lead_id, "actor": actor,
                                     "eventType": event_type, "details": details, "timestamp": now_iso()})


# ---- Generation pipeline ----
_pipeline = {"processing": False, "pause": False}


async def pipeline_status():
    run = await db.runs.find_one({"id": RUN_ID}, NO_ID) or {}
    generated = await db.pages.count_documents({})
    approved = await db.pages.count_documents({"lifecycleState": {"$in": ["approved", "published"]}})
    needs_review = await db.pages.count_documents({"lifecycleState": "needs_review"})
    cost = 0  # Deterministic templates do not make paid model calls.
    if _pipeline["processing"]:
        status = "running"
    elif run.get("status") == "paused":
        status = "paused"
    else:
        status = "completed" if generated >= TARGET_PAGES else "idle"
    return {
        "totalTarget": TARGET_PAGES, "generatedSoFar": generated, "approvedCount": approved,
        "needsReviewCount": needs_review, "failedCount": await db.pages.count_documents({"lifecycleState": "failed"}), "tokensUsedEst": 0,
        "costUSD": round(cost, 4), "status": status, "batchSpeedPagesPerSec": None,
    }


async def pipeline_run(count=1000):
    if _pipeline["processing"]:
        return await pipeline_status()
    _pipeline.update(processing=True, pause=False)
    run = await db.runs.find_one({"id": RUN_ID}, NO_ID) or {}
    idx = run.get("checkpointIndex", 0)
    total = len(LOCATIONS) * len(SERVICES)
    freelancers = await all_freelancers()
    existing = set(d["id"] for d in await db.pages.find({}, {"_id": 0, "id": 1}).to_list(None))
    await db.runs.update_one({"id": RUN_ID}, {"$set": {"status": "running"}})

    generated, batch = 0, []
    try:
        while idx < total and generated < count and not _pipeline["pause"]:
            loc = LOCATIONS[idx // len(SERVICES)]
            svc = SERVICES[idx % len(SERVICES)]
            page_id = f"page-{svc['id'].lower()}-{loc['id']}"
            if page_id not in existing:
                batch.append(generate_structured_page(svc, loc, freelancers))
                generated += 1
            idx += 1
            if len(batch) >= 250:
                await db.pages.insert_many(batch, ordered=False)
                batch = []
        if batch:
            await db.pages.insert_many(batch, ordered=False)
    finally:
        _pipeline["processing"] = False
        status = "completed" if idx >= total else ("paused" if _pipeline["pause"] else "idle")
        await db.runs.update_one({"id": RUN_ID}, {"$set": {"checkpointIndex": idx, "status": status}})
        await _sync_run_counts()
    return await pipeline_status()


async def pipeline_pause():
    _pipeline["pause"] = True
    await db.runs.update_one({"id": RUN_ID}, {"$set": {"status": "paused", "updatedAt": now_iso()}})
    return await pipeline_status()
