"""Known city coordinates tied to existing catalog records, not generated locations."""
from math import radians, sin, cos, asin, sqrt
from fastapi import APIRouter
from pydantic import BaseModel
from store import db, LOC_BY_ID, LOCATIONS

HUBS = [
    # id, lat, lng, frontend-region
    ("loc-city-in-delhi", 28.6139, 77.2090, "india"),
    ("loc-nh-in-delhi-laxmi-nagar", 28.6304, 77.2776, "india"),
    ("loc-city-in-mumbai", 19.0760, 72.8777, "india"),
    ("loc-city-in-bengaluru", 12.9716, 77.5946, "india"),
    ("loc-city-in-chennai", 13.0827, 80.2707, "india"),
    ("loc-city-in-hyderabad", 17.3850, 78.4867, "india"),
    ("loc-city-in-kolkata", 22.5726, 88.3639, "india"),
    ("loc-city-in-pune", 18.5204, 73.8567, "india"),
    ("loc-city-in-ahmedabad", 23.0225, 72.5714, "india"),
    ("loc-city-in-jaipur", 26.9124, 75.7873, "india"),
    ("loc-city-ae-dubai", 25.2048, 55.2708, "middle-east"),
    ("loc-city-ae-abu-dhabi", 24.4539, 54.3773, "middle-east"),
    ("loc-city-qa-doha", 25.2854, 51.5310, "middle-east"),
    ("loc-city-sa-riyadh", 24.7136, 46.6753, "middle-east"),
    ("loc-city-gb-london", 51.5074, -0.1278, "europe"),
    ("loc-city-gb-manchester", 53.4808, -2.2426, "europe"),
    ("loc-city-fr-paris", 48.8566, 2.3522, "europe"),
    ("loc-city-de-berlin", 52.5200, 13.4050, "europe"),
    ("loc-city-nl-amsterdam", 52.3676, 4.9041, "europe"),
    ("loc-city-es-madrid", 40.4168, -3.7038, "europe"),
    ("loc-city-ie-dublin", 53.3498, -6.2603, "europe"),
    ("loc-city-us-new-york", 40.7128, -74.0060, "americas"),
    ("loc-city-us-san-francisco", 37.7749, -122.4194, "americas"),
    ("loc-city-us-los-angeles", 34.0522, -118.2437, "americas"),
    ("loc-city-us-chicago", 41.8781, -87.6298, "americas"),
    ("loc-city-ca-toronto", 43.6532, -79.3832, "americas"),
    ("loc-city-sg-singapore", 1.3521, 103.8198, "apac"),
    ("loc-city-au-sydney", -33.8688, 151.2093, "apac"),
    ("loc-city-au-melbourne", -37.8136, 144.9631, "apac"),
    ("loc-city-jp-tokyo", 35.6762, 139.6503, "apac"),
]
router = APIRouter(prefix="/api/map")


def distance_km(lat1, lng1, lat2, lng2):
    a, b = radians(lat2 - lat1), radians(lng2 - lng1)
    h = sin(a / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(b / 2)**2
    return 6371 * 2 * asin(sqrt(min(1, h)))


def nearest_hubs(lat, lng):
    # Only hubs whose catalog record actually exists are considered, so a missing
    # location id can never crash nearest-neighbour lookups.
    valid = [h for h in HUBS if h[0] in LOC_BY_ID]
    ranked = sorted(valid, key=lambda h: distance_km(lat, lng, h[1], h[2]))
    return [{"location": LOC_BY_ID[h[0]], "distanceKm": round(distance_km(lat, lng, h[1], h[2]), 1),
             "region": h[3]} for h in ranked]


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
        localSpecialists=by_location.get(id, 0)) for id, lat, lng, region in HUBS if id in LOC_BY_ID],
        totalLocations=len(LOCATIONS), totalCountries=len({l["countryCode"] for l in LOCATIONS}))