"""Draft WhatsApp settings and a durable, intentionally non-delivering outbox."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from auth import get_current_admin
from store import db, NO_ID, now_iso

router = APIRouter(prefix="/api/admin/whatsapp", dependencies=[Depends(get_current_admin)])


class AlertSettings(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    recipient: str = Field(default="", pattern=r"^(\+[1-9]\d{7,14})?$")
    templateName: str = Field(default="", pattern=r"^([a-z0-9_]{1,128})?$")
    templateLanguage: str = Field(default="", pattern=r"^([a-z]{2,3}(_[A-Z]{2})?)?$")
    deliveryEnabled: Literal[False] = False


class SettingsResponse(AlertSettings):
    mode: Literal["draft"] = "draft"


class AlertItem(BaseModel):
    id: str
    leadId: str
    clientName: str
    contactValue: str
    serviceId: str
    budgetRange: str
    projectDescription: str
    createdAt: str
    status: Literal["pending_setup", "dismissed"]
    attempts: int


class QueueResponse(BaseModel):
    items: list[AlertItem]
    total: int
    pending: int
    page: int
    limit: int
    deliveryEnabled: Literal[False] = False


async def init_alerts():
    await db.whatsapp_alerts.create_index("id", unique=True)
    await db.whatsapp_alerts.create_index([("createdAt", -1), ("id", -1)])
    await db.whatsapp_alerts.create_index("status")


async def enqueue_lead_alert(lead):
    key = f"whatsapp:{lead['id']}:created:1"
    item = {"id": key, "leadId": lead["id"], "status": "pending_setup", "attempts": 0,
            "createdAt": now_iso(), **{field: str(lead.get(field) or "") for field in
            ("clientName", "contactValue", "serviceId", "budgetRange", "projectDescription")}}
    await db.whatsapp_alerts.update_one({"id": key}, {"$setOnInsert": item}, upsert=True)


@router.get("/settings", response_model=SettingsResponse)
async def get_settings():
    saved = await db.integration_settings.find_one({"id": "whatsapp"}, NO_ID) or {}
    return SettingsResponse(**{k: saved[k] for k in AlertSettings.model_fields if k in saved}, mode="draft")


@router.put("/settings", response_model=SettingsResponse)
async def save_settings(body: AlertSettings):
    data = body.model_dump()
    data["deliveryEnabled"] = False
    await db.integration_settings.update_one({"id": "whatsapp"},
        {"$set": {**data, "updatedAt": now_iso()}}, upsert=True)
    return SettingsResponse(**data)


@router.get("/queue", response_model=QueueResponse)
async def get_queue(page: int = Query(1, ge=1, le=10000), limit: int = Query(20, ge=1, le=50)):
    items = await db.whatsapp_alerts.find({}, NO_ID).sort([("createdAt", -1), ("id", -1)]).skip((page - 1) * limit).limit(limit).to_list(limit)
    return QueueResponse(items=items, total=await db.whatsapp_alerts.count_documents({}),
        pending=await db.whatsapp_alerts.count_documents({"status": "pending_setup"}), page=page, limit=limit)


@router.post("/queue/{alert_id}/dismiss", response_model=AlertItem)
async def dismiss_alert(alert_id: str):
    result = await db.whatsapp_alerts.update_one({"id": alert_id}, {"$set": {"status": "dismissed"}})
    if not result.matched_count:
        raise HTTPException(404, "Alert not found")
    return await db.whatsapp_alerts.find_one({"id": alert_id}, NO_ID)