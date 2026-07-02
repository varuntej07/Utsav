"""Utsav vendor lookup — Google Places API (New) with Mongo cache + seeded fallback."""
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta

import httpx
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
logger = logging.getLogger("utsav.vendors")

PLACES_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
CACHE_TTL_HOURS = 24

CATEGORY_QUERIES = {
    "caterer": "wedding caterers in {loc}",
    "decorator": "event decorators in {loc}",
    "pandit": "pandit pooja services in {loc}",
    "photographer": "wedding photographers in {loc}",
    "dj": "DJ for events in {loc}",
    "mehndi_artist": "mehndi artist in {loc}",
    "banquet_hall": "banquet halls in {loc}",
    "farmhouse": "farmhouse for party in {loc}",
    "makeup_artist": "bridal makeup artist in {loc}",
    "venue": "event venues in {loc}",
    "florist": "flower decoration for events in {loc}",
    "cake": "cake shop in {loc}",
    "band": "wedding band baja in {loc}",
    "tent_house": "tent house in {loc}",
}

PRICE_RANGES = {
    "caterer": "₹800–1,500 / plate",
    "decorator": "₹50,000–3,00,000",
    "pandit": "₹5,100–21,000",
    "photographer": "₹50,000–2,00,000",
    "dj": "₹15,000–75,000",
    "mehndi_artist": "₹5,000–25,000",
    "banquet_hall": "₹1,00,000–5,00,000",
    "farmhouse": "₹40,000–1,50,000 / day",
    "makeup_artist": "₹15,000–60,000",
    "venue": "₹75,000–4,00,000",
    "florist": "₹15,000–80,000",
    "cake": "₹1,500–15,000",
    "band": "₹20,000–80,000",
    "tent_house": "₹30,000–2,00,000",
}
DEFAULT_PRICE = "₹10,000–1,00,000"

CATEGORY_LABELS = {
    "caterer": "Caterers", "decorator": "Decorators", "pandit": "Pandits",
    "photographer": "Photographers", "dj": "DJs", "mehndi_artist": "Mehndi Artists",
    "banquet_hall": "Banquet Halls", "farmhouse": "Farmhouses", "makeup_artist": "Makeup Artists",
    "venue": "Venues", "florist": "Florists", "cake": "Cake Shops", "band": "Band Baja",
    "tent_house": "Tent House",
}

FALLBACK_VENDORS = {
    "caterer": [
        ("Rajwada Royal Caterers", 4.6, 412), ("Annapurna Catering Co.", 4.4, 268),
        ("Swaad Banquets & Catering", 4.7, 189), ("Maharaja Bhoj Caterers", 4.3, 321),
    ],
    "decorator": [
        ("Phool Bagh Decorators", 4.5, 156), ("Shubh Mangal Events & Decor", 4.7, 98),
        ("Marigold Moments Decor", 4.4, 203), ("Royal Rajputana Decor", 4.6, 141),
    ],
    "pandit": [
        ("Pandit Ramesh Shastri Ji", 4.9, 87), ("Vedic Pooja Services", 4.7, 134),
        ("Shri Ganesh Jyotish Kendra", 4.6, 92), ("Acharya Vinod Ji Maharaj", 4.8, 61),
    ],
    "photographer": [
        ("Candid Frames Studio", 4.8, 245), ("Shaadi Diaries Photography", 4.6, 178),
        ("PixelKatha Films", 4.7, 132), ("Dilwale Studios", 4.5, 209),
    ],
    "dj": [
        ("DJ Bollywood Beats", 4.5, 167), ("Dhamaka DJ & Sound", 4.4, 143),
        ("NightRaaga Entertainment", 4.6, 88), ("Punjabi Tadka DJs", 4.7, 119),
    ],
    "mehndi_artist": [
        ("Meena Mehndi Arts", 4.8, 156), ("Rachna's Bridal Mehndi", 4.7, 112),
        ("Heena by Pooja", 4.6, 98), ("Jaipur Mehndi Walas", 4.5, 174),
    ],
    "banquet_hall": [
        ("The Grand Utsav Banquet", 4.5, 320), ("Swarna Mahal Banquets", 4.6, 187),
        ("Kesar Bagh Lawn & Banquet", 4.4, 256), ("Rajdarbar Convention Hall", 4.3, 198),
    ],
    "farmhouse": [
        ("Green Valley Farmhouse", 4.5, 143), ("Amaltas Farms & Lawns", 4.6, 89),
        ("Sunset Ridge Farmstay", 4.4, 117), ("The Mango Orchard Farm", 4.7, 76),
    ],
    "makeup_artist": [
        ("Glam by Simran", 4.8, 134), ("Bridal Looks by Neha", 4.7, 98),
        ("MUA Kirti Official", 4.6, 156), ("The Bridal Studio", 4.5, 87),
    ],
    "venue": [
        ("Heritage Haveli Venue", 4.6, 213), ("The Celebration Lawn", 4.5, 176),
        ("Utsav Garden Resort", 4.4, 245), ("Shehnai Palace", 4.7, 132),
    ],
    "florist": [
        ("Genda Phool Florists", 4.6, 87), ("Rose & Marigold Studio", 4.7, 65),
        ("Phoolwala Decor", 4.5, 121),
    ],
    "cake": [
        ("The Cake Studio", 4.7, 234), ("Sweet Symphony Bakers", 4.6, 187),
        ("Frost & Flour", 4.8, 98),
    ],
    "band": [
        ("Shehnai Band Baja", 4.5, 76), ("Raja Band & Dhol", 4.4, 98),
        ("Punjab Brass Band", 4.6, 54),
    ],
    "tent_house": [
        ("Shubham Tent House", 4.4, 112), ("Deluxe Shamiyana Walas", 4.5, 87),
        ("Royal Tent & Light House", 4.3, 134),
    ],
}


def _fallback(category: str, location: str) -> list:
    base = FALLBACK_VENDORS.get(category, FALLBACK_VENDORS["venue"])
    return [
        {
            "id": f"fb-{category}-{i}",
            "name": name,
            "address": f"{location}",
            "rating": rating,
            "ratingCount": count,
            "priceRange": PRICE_RANGES.get(category, DEFAULT_PRICE),
            "mapsUri": f"https://www.google.com/maps/search/?api=1&query={name.replace(' ', '+')}+{location.replace(' ', '+')}",
            "category": category,
            "source": "curated",
        }
        for i, (name, rating, count) in enumerate(base)
    ]


async def search_vendors(db, location: str, category: str) -> list:
    """Search vendors near location. Places API (New) -> Mongo cache -> curated fallback."""
    location = (location or "Delhi NCR").strip()
    category = (category or "venue").strip().lower()
    cache_key = f"{location.lower()}::{category}"

    cached = await db.vendor_cache.find_one({"key": cache_key}, {"_id": 0})
    if cached:
        cached_at = datetime.fromisoformat(cached["cachedAt"])
        if datetime.now(timezone.utc) - cached_at < timedelta(hours=CACHE_TTL_HOURS):
            return cached["vendors"]

    query = CATEGORY_QUERIES.get(category, f"{category.replace('_', ' ')} in {{loc}}").format(loc=location)
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": PLACES_KEY,
                    "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.id",
                },
                json={"textQuery": query, "maxResultCount": 8},
            )
        if r.status_code == 200:
            places = r.json().get("places", [])
            vendors = []
            for p in places:
                vendors.append({
                    "id": p.get("id", str(uuid.uuid4())),
                    "name": p.get("displayName", {}).get("text", "Vendor"),
                    "address": p.get("formattedAddress", location),
                    "rating": p.get("rating"),
                    "ratingCount": p.get("userRatingCount"),
                    "priceRange": PRICE_RANGES.get(category, DEFAULT_PRICE),
                    "mapsUri": p.get("googleMapsUri"),
                    "category": category,
                    "source": "google_places",
                })
            if vendors:
                await db.vendor_cache.update_one(
                    {"key": cache_key},
                    {"$set": {"key": cache_key, "vendors": vendors,
                              "cachedAt": datetime.now(timezone.utc).isoformat()}},
                    upsert=True,
                )
                return vendors
        else:
            logger.warning(f"Places API {r.status_code}: {r.text[:200]}")
    except Exception as e:
        logger.warning(f"Places API error: {e}")

    return _fallback(category, location)
