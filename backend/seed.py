"""Seed the gorgeous demo North Indian wedding event. Idempotent.
Run: cd backend && python seed.py
"""
import asyncio
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

SLUG = "simran-weds-arjun"
POSTER_SRC = ROOT.parent / "tests" / "poc_poster.png"
POSTER_DIR = ROOT / "static" / "posters"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


EVENT = {
    "id": str(uuid.uuid4()),
    "slug": SLUG,
    "eventType": "wedding",
    "isDemo": True,
    "createdAt": now_iso(),
    "posterUrl": None,  # set below if poster copied
    "plan": {
        "title": "Simran weds Arjun: A Royal Jaipur Shaadi",
        "emoji": "💍",
        "description": "Do dilon ka milan, Jaipur ke shahi andaaz mein! Join us for five days of dhol, phool, haldi and pyaar as Simran and Arjun begin their forever. Your presence will make our mehfil complete.",
        "date": "2026-12-10",
        "time": "7:00 PM",
        "muhurat": "Phera Muhurat: 8:45 PM - 10:20 PM",
        "venueType": "Heritage Palace Hotel",
        "location": "Jaipur, Rajasthan",
        "budgetINR": 4000000,
        "guestCount": 300,
        "modules": ["timeline", "vendors", "guestlist", "food", "budget", "checklist", "reminders", "poster"],
        "timeline": [
            {"function": "Haldi Ceremony", "date": "2026-12-08", "time": "10:00 AM", "muhurat": "Shubh Muhurat 10:15 AM",
             "description": "Marigold-drenched morning of haldi, dhol and pyaar at the family haveli. Dress code: shades of yellow.", "emoji": "💛"},
            {"function": "Mehndi Night", "date": "2026-12-08", "time": "5:00 PM", "muhurat": None,
             "description": "Intricate heena, folk songs and gajak-chai under fairy lights. Bridesmaids' mehndi competition at 7 PM!", "emoji": "🌿"},
            {"function": "Sangeet Sandhya", "date": "2026-12-09", "time": "7:00 PM", "muhurat": None,
             "description": "Family dance battles, live dhol, and a surprise couple performance. DJ till midnight.", "emoji": "💃"},
            {"function": "Wedding (Pheras)", "date": "2026-12-10", "time": "7:00 PM", "muhurat": "Phera Muhurat 8:45 PM - 10:20 PM",
             "description": "Baraat arrives at 6 PM followed by varmala, pheras under the stars and a midnight vidaai.", "emoji": "💍"},
            {"function": "Reception", "date": "2026-12-11", "time": "7:30 PM", "muhurat": None,
             "description": "A glittering evening to bless the newlyweds with dinner, toasts and the first dance.", "emoji": "🥂"},
        ],
        "budgetItems": [
            {"item": "Venue: Heritage Palace (3 days)", "amountINR": 1200000, "category": "venue"},
            {"item": "Catering (300 guests × 4 functions)", "amountINR": 1100000, "category": "food"},
            {"item": "Decor & Floral (all functions)", "amountINR": 600000, "category": "decor"},
            {"item": "Photography & Cinematography", "amountINR": 350000, "category": "photo"},
            {"item": "Sangeet DJ + Live Dhol", "amountINR": 150000, "category": "entertainment"},
            {"item": "Bridal Makeup, Mehndi & Trousseau", "amountINR": 300000, "category": "bride"},
            {"item": "Guest Hospitality & Transport", "amountINR": 200000, "category": "logistics"},
            {"item": "Pandit Ji, Pooja Samagri & Misc", "amountINR": 100000, "category": "rituals"},
        ],
        "checklist": [
            {"task": "Book Pandit Ji for pheras & confirm muhurat", "category": "rituals", "done": True},
            {"task": "Finalize heritage venue & sign contract", "category": "venue", "done": True},
            {"task": "Send WhatsApp invites to all 300 guests", "category": "invites", "done": True},
            {"task": "Order haldi supplies: marigold, ubtan, pital thalis", "category": "haldi", "done": True},
            {"task": "Book mehndi artists (bridal + 40 guests)", "category": "mehndi", "done": False},
            {"task": "Finalize sangeet performance list & rehearsals", "category": "sangeet", "done": False},
            {"task": "Taste session with caterer: Dal Baati & Laal Maas", "category": "food", "done": False},
            {"task": "Arrange baraat ghodi & band baja", "category": "baraat", "done": False},
            {"task": "Book guest rooms + airport pickups", "category": "logistics", "done": False},
            {"task": "Order wedding favors: Jaipuri potli gifts", "category": "gifts", "done": False},
        ],
        "food": {
            "dietType": "Both Veg & Non-veg",
            "menuSuggestions": [
                "Dal Baati Churma", "Laal Maas", "Paneer Lababdar", "Jodhpuri Kabuli Pulao",
                "Pyaaz Kachori Chaat Counter", "Live Jalebi & Rabri Station", "Ghevar Tower", "Thandai Bar",
            ],
            "notes": "Separate pure-veg kitchen for pooja-side family. Jain options on request. Late-night maggi & chai counter after sangeet.",
        },
        "vendorCategories": ["banquet_hall", "caterer", "decorator", "photographer", "mehndi_artist", "dj", "pandit"],
    },
    "shortlistedVendors": [
        {"id": "seed-v1", "name": "Rajwada Royal Caterers", "address": "C-Scheme, Jaipur", "rating": 4.6,
         "ratingCount": 412, "priceRange": "₹800-1,500 / plate", "category": "caterer", "shortlisted": True,
         "mapsUri": "https://www.google.com/maps/search/?api=1&query=caterers+jaipur", "source": "curated"},
        {"id": "seed-v2", "name": "Phool Bagh Decorators", "address": "MI Road, Jaipur", "rating": 4.5,
         "ratingCount": 156, "priceRange": "₹50,000-3,00,000", "category": "decorator", "shortlisted": True,
         "mapsUri": "https://www.google.com/maps/search/?api=1&query=decorators+jaipur", "source": "curated"},
        {"id": "seed-v3", "name": "Candid Frames Studio", "address": "Vaishali Nagar, Jaipur", "rating": 4.8,
         "ratingCount": 245, "priceRange": "₹50,000-2,00,000", "category": "photographer", "shortlisted": True,
         "mapsUri": "https://www.google.com/maps/search/?api=1&query=wedding+photographers+jaipur", "source": "curated"},
    ],
    "reminders": [
        {"id": str(uuid.uuid4()), "text": "Final headcount to caterer", "when": "2026-12-01", "done": False, "createdAt": now_iso()},
        {"id": str(uuid.uuid4()), "text": "Sangeet rehearsal: full family run-through", "when": "2026-12-05", "done": False, "createdAt": now_iso()},
        {"id": str(uuid.uuid4()), "text": "Pick up bridal lehenga from Johari Bazaar", "when": "2026-11-28", "done": True, "createdAt": now_iso()},
    ],
    "potluck": [],
}

RSVPS = [
    ("Priya Sharma", "going", 4), ("Rahul Malhotra", "going", 2), ("Anita & Vikram Singh", "going", 3),
    ("Neha Gupta", "going", 2), ("Karan Mehra", "going", 1), ("Bhalla Family", "going", 6),
    ("Sunita Aunty", "going", 2), ("Rohan Kapoor", "maybe", 2), ("Deepika Iyer", "maybe", 1),
    ("Amitabh Joshi", "maybe", 2), ("Farhan Sheikh", "no", 1), ("Ritu Chawla", "going", 3),
]


async def seed():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    poster_url = None
    if POSTER_SRC.exists():
        POSTER_DIR.mkdir(parents=True, exist_ok=True)
        dest = POSTER_DIR / f"{SLUG}.png"
        shutil.copy(POSTER_SRC, dest)
        poster_url = f"/api/posters/{SLUG}.png"

    event = {**EVENT, "posterUrl": poster_url}

    await db.events.delete_many({"slug": SLUG})
    await db.rsvps.delete_many({"eventSlug": SLUG})
    await db.events.insert_one(event)
    for name, status, heads in RSVPS:
        await db.rsvps.insert_one({
            "id": str(uuid.uuid4()), "eventSlug": SLUG, "name": name, "status": status,
            "headcount": heads, "note": None, "createdAt": now_iso(),
        })
    print(f"Seeded demo event: /e/{SLUG} (poster: {poster_url})")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
