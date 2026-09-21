"""Known city coordinates tied to existing catalog records, not generated locations."""
from math import radians, sin, cos, asin, sqrt
from fastapi import APIRouter
from pydantic import BaseModel
from store import db, LOC_BY_ID, LOCATIONS

HUBS = [
    ("loc-city-in-delhi", 28.6139, 77.2090, "india"),
    ("loc-nh-in-delhi-laxmi-nagar", 28.6304, 77.2776, "india"),
    ("loc-city-in-bengaluru", 12.9716, 77.5946, "india"),
    ("loc-city-in-mumbai", 19.0760, 72.8777, "india"),
    ("loc-city-ae-dubai", 25.2048, 55.2708, "middle-east"),
    ("loc-city-gb-london", 51.5074, -0.1278, "europe"),
    ("loc-city-us-new-york", 40.7128, -74.0060, "americas"),
    ("loc-city-sg-singapore", 1.3521, 103.8198, "apac"),
]
router = APIRouter(prefix="/api/map")


def distance_km(lat1, lng1, lat2, lng2):
    a, b = radians(lat2 - lat1), radians(lng2 - lng1)
    h = sin(a / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(b / 2)**2
    return 6371 * 2 * asin(sqrt(min(1, h)))


def nearest_hubs(lat, lng):
    ranked = sorted(HUBS, key=lambda h: distance_km(lat, lng, h[1], h[2]))
    return [{"location": LOC_BY_ID[h[0]], "distanceKm": round(distance_km(lat, lng, h[1], h[2]), 1)} for h in ranked]


class Hub(BaseModel):
    location: dict
    latitude: float
    longitude: float
    region: str
    localSpecialists: int


class HubsResponse(BaseModel):
    hubs: list[Hub]
    totalLocations: int
    totalCountries: int


@router.get("/hubs", response_model=HubsResponse)
async def hubs():
    counts = await db.freelancers.aggregate([
        {"$match": {"profileState": "approved"}},
        {"$group": {"_id": "$baseLocationId", "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "locationId": "$_id", "count": 1}}, {"$limit": 5000}
    ]).to_list(5000)
    by_location = {row["locationId"]: row["count"] for row in counts}
    return HubsResponse(hubs=[Hub(location=LOC_BY_ID[id], latitude=lat, longitude=lng, region=region,
        localSpecialists=by_location.get(id, 0)) for id, lat, lng, region in HUBS],
        totalLocations=len(LOCATIONS), totalCountries=len({l["countryCode"] for l in LOCATIONS}))