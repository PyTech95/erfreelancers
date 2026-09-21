"""Manual Search Console checklist, not an ownership verification integration."""
from urllib.parse import urlparse, quote
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, ConfigDict
from auth import get_current_admin
from seo import domain
from store import db, NO_ID, now_iso

router = APIRouter(prefix="/api/admin/search-console", dependencies=[Depends(get_current_admin)])


class Checklist(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    dnsRecord: str = Field(default="", max_length=300, pattern=r"^(google-site-verification=[A-Za-z0-9_-]+)?$")
    propertyCreated: bool = False
    dnsVerified: bool = False
    sitemapSubmitted: bool = False


class KitResponse(BaseModel):
    domain: str
    canonicalOrigin: str
    sitemapUrl: str
    consoleUrl: str
    submissionUrl: str
    checklist: Checklist
    verificationMode: str = "manual"


async def kit():
    origin = domain()
    hostname = urlparse(origin).hostname
    saved = await db.integration_settings.find_one({"id": "search-console"}, NO_ID) or {}
    checklist = Checklist(**{k: saved[k] for k in Checklist.model_fields if k in saved})
    return KitResponse(domain=hostname, canonicalOrigin=origin, sitemapUrl=f"{origin}/api/sitemap.xml",
        consoleUrl="https://search.google.com/search-console/welcome",
        submissionUrl="https://search.google.com/search-console/sitemaps?resource_id=" + quote(f"sc-domain:{hostname}", safe=""),
        checklist=checklist)


@router.get("", response_model=KitResponse)
async def get_kit():
    return await kit()


@router.put("", response_model=KitResponse)
async def save_checklist(body: Checklist):
    await db.integration_settings.update_one({"id": "search-console"},
        {"$set": {**body.model_dump(), "updatedAt": now_iso()}}, upsert=True)
    return await kit()