"""Utsav: AI-powered Indian event planner. FastAPI backend."""
import base64
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from agent import run_agent_turn, generate_poster_image  # noqa: E402
from vendors import search_vendors, CATEGORY_LABELS  # noqa: E402

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

POSTER_DIR = ROOT_DIR / "static" / "posters"
POSTER_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Utsav API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("utsav")


# ----------------------------- helpers ------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:48].strip("-")
    return f"{s or 'utsav-event'}-{uuid.uuid4().hex[:4]}"


async def rsvp_summary(slug: str) -> dict:
    pipeline = [
        {"$match": {"eventSlug": slug}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "heads": {"$sum": "$headcount"}}},
    ]
    rows = await db.rsvps.aggregate(pipeline).to_list(10)
    summary = {"going": 0, "maybe": 0, "no": 0, "goingHeadcount": 0}
    for r in rows:
        if r["_id"] in summary:
            summary[r["_id"]] = r["count"]
        if r["_id"] == "going":
            summary["goingHeadcount"] = r["heads"]
    return summary


async def get_event_or_404(slug: str) -> dict:
    event = await db.events.find_one({"slug": slug}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ----------------------------- models -------------------------------------

class ChatRequest(BaseModel):
    sessionId: str
    message: Optional[str] = None
    tappedAnswers: Optional[dict] = None


class RsvpRequest(BaseModel):
    name: str = "Guest"
    status: Literal["going", "maybe", "no"]
    headcount: int = 1
    note: Optional[str] = None


class ShortlistRequest(BaseModel):
    vendor: dict
    shortlisted: bool


class ChecklistPatch(BaseModel):
    index: int
    done: bool


class BudgetPatch(BaseModel):
    index: int
    amountINR: float


class FoodPatch(BaseModel):
    dietType: str


class ReminderCreate(BaseModel):
    text: str
    when: Optional[str] = None


class ReminderPatch(BaseModel):
    index: int
    done: bool


class PotluckCreate(BaseModel):
    name: str
    dish: str


# ----------------------------- routes -------------------------------------

@api_router.get("/")
async def root():
    return {"message": "Utsav API. Bolo idea, Utsav banaye mehfil."}


@api_router.post("/chat")
async def chat(req: ChatRequest):
    if not req.message and not req.tappedAnswers:
        raise HTTPException(status_code=400, detail="message or tappedAnswers required")

    session = await db.sessions.find_one({"sessionId": req.sessionId}, {"_id": 0})
    transcript = session["transcript"] if session else []

    if req.tappedAnswers is not None:
        import json as _json
        user_input = f"USER_TAPPED_ANSWERS: {_json.dumps(req.tappedAnswers, ensure_ascii=False)}"
    else:
        user_input = req.message

    assistant_turns = sum(1 for t in transcript if t["role"] == "assistant")
    force_complete = assistant_turns >= 2

    try:
        turn = await run_agent_turn(transcript, user_input, force_complete=force_complete)
    except Exception as e:
        logger.error(f"Agent failure: {e}")
        raise HTTPException(status_code=502, detail="Utsav AI thoda busy hai. Please try again.")

    transcript.append({"role": "user", "content": user_input})
    transcript.append({"role": "assistant", "content": turn.model_dump_json()})
    await db.sessions.update_one(
        {"sessionId": req.sessionId},
        {"$set": {"sessionId": req.sessionId, "transcript": transcript, "updatedAt": now_iso()}},
        upsert=True,
    )

    response = turn.model_dump()
    response["sessionId"] = req.sessionId

    if turn.phase == "complete" and turn.eventPlan:
        plan = turn.eventPlan.model_dump()
        slug = slugify(plan["title"])
        event = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            "eventType": turn.eventType,
            "plan": plan,
            "shortlistedVendors": [],
            "reminders": [],
            "potluck": [],
            "posterUrl": None,
            "isDemo": False,
            "createdAt": now_iso(),
        }
        await db.events.insert_one({**event})
        response["eventSlug"] = slug

    return response


@api_router.get("/demo")
async def get_demo():
    event = await db.events.find_one({"isDemo": True}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Demo event not seeded")
    event["rsvpSummary"] = await rsvp_summary(event["slug"])
    return event


@api_router.get("/events/{slug}")
async def get_event(slug: str):
    event = await get_event_or_404(slug)
    event["rsvpSummary"] = await rsvp_summary(slug)
    return event


@api_router.post("/events/{slug}/rsvp")
async def create_rsvp(slug: str, req: RsvpRequest):
    await get_event_or_404(slug)
    doc = {
        "id": str(uuid.uuid4()),
        "eventSlug": slug,
        "name": req.name.strip() or "Guest",
        "status": req.status,
        "headcount": max(1, min(req.headcount, 20)),
        "note": req.note,
        "createdAt": now_iso(),
    }
    await db.rsvps.insert_one({**doc})
    return {"ok": True, "rsvp": doc, "summary": await rsvp_summary(slug)}


@api_router.get("/events/{slug}/rsvps")
async def list_rsvps(slug: str):
    await get_event_or_404(slug)
    rsvps = await db.rsvps.find({"eventSlug": slug}, {"_id": 0}).sort("createdAt", -1).to_list(500)
    return {"rsvps": rsvps, "summary": await rsvp_summary(slug)}


@api_router.get("/events/{slug}/vendors")
async def get_vendors(slug: str, category: Optional[str] = None):
    event = await get_event_or_404(slug)
    plan = event["plan"]
    categories = plan.get("vendorCategories") or ["venue", "caterer", "decorator", "photographer"]
    cat = category or categories[0]
    vendors = await search_vendors(db, plan.get("location"), cat)
    shortlisted_ids = {v["id"] for v in event.get("shortlistedVendors", [])}
    for v in vendors:
        v["shortlisted"] = v["id"] in shortlisted_ids
    return {
        "category": cat,
        "categories": [{"key": c, "label": CATEGORY_LABELS.get(c, c.replace("_", " ").title())} for c in categories],
        "vendors": vendors,
    }


@api_router.post("/events/{slug}/vendors/shortlist")
async def shortlist_vendor(slug: str, req: ShortlistRequest):
    event = await get_event_or_404(slug)
    shortlisted = [v for v in event.get("shortlistedVendors", []) if v["id"] != req.vendor.get("id")]
    if req.shortlisted:
        vendor = dict(req.vendor)
        vendor["shortlisted"] = True
        shortlisted.append(vendor)
    await db.events.update_one({"slug": slug}, {"$set": {"shortlistedVendors": shortlisted}})
    return {"ok": True, "shortlistedVendors": shortlisted}


@api_router.patch("/events/{slug}/checklist")
async def patch_checklist(slug: str, req: ChecklistPatch):
    event = await get_event_or_404(slug)
    checklist = event["plan"].get("checklist", [])
    if not 0 <= req.index < len(checklist):
        raise HTTPException(status_code=400, detail="Invalid checklist index")
    checklist[req.index]["done"] = req.done
    await db.events.update_one({"slug": slug}, {"$set": {"plan.checklist": checklist}})
    return {"ok": True, "checklist": checklist}


@api_router.patch("/events/{slug}/budget")
async def patch_budget(slug: str, req: BudgetPatch):
    event = await get_event_or_404(slug)
    items = event["plan"].get("budgetItems", [])
    if not 0 <= req.index < len(items):
        raise HTTPException(status_code=400, detail="Invalid budget index")
    items[req.index]["amountINR"] = max(0, req.amountINR)
    total = sum(i["amountINR"] for i in items)
    await db.events.update_one({"slug": slug}, {"$set": {"plan.budgetItems": items, "plan.budgetINR": total}})
    return {"ok": True, "budgetItems": items, "budgetINR": total}


@api_router.patch("/events/{slug}/food")
async def patch_food(slug: str, req: FoodPatch):
    await get_event_or_404(slug)
    await db.events.update_one({"slug": slug}, {"$set": {"plan.food.dietType": req.dietType}})
    return {"ok": True, "dietType": req.dietType}


@api_router.post("/events/{slug}/potluck")
async def add_potluck(slug: str, req: PotluckCreate):
    event = await get_event_or_404(slug)
    entry = {"id": str(uuid.uuid4()), "name": req.name.strip() or "Guest", "dish": req.dish.strip(), "createdAt": now_iso()}
    potluck = event.get("potluck", []) + [entry]
    await db.events.update_one({"slug": slug}, {"$set": {"potluck": potluck}})
    return {"ok": True, "potluck": potluck}


@api_router.post("/events/{slug}/reminders")
async def add_reminder(slug: str, req: ReminderCreate):
    event = await get_event_or_404(slug)
    reminder = {"id": str(uuid.uuid4()), "text": req.text.strip(), "when": req.when, "done": False, "createdAt": now_iso()}
    reminders = event.get("reminders", []) + [reminder]
    await db.events.update_one({"slug": slug}, {"$set": {"reminders": reminders}})
    return {"ok": True, "reminders": reminders}


@api_router.patch("/events/{slug}/reminders")
async def patch_reminder(slug: str, req: ReminderPatch):
    event = await get_event_or_404(slug)
    reminders = event.get("reminders", [])
    if not 0 <= req.index < len(reminders):
        raise HTTPException(status_code=400, detail="Invalid reminder index")
    reminders[req.index]["done"] = req.done
    await db.events.update_one({"slug": slug}, {"$set": {"reminders": reminders}})
    return {"ok": True, "reminders": reminders}


@api_router.post("/events/{slug}/poster")
async def generate_poster(slug: str):
    event = await get_event_or_404(slug)
    plan = {**event["plan"], "eventType": event.get("eventType", "celebration")}
    try:
        img = await generate_poster_image(plan)
    except Exception as e:
        logger.error(f"Poster generation failed: {e}")
        raise HTTPException(status_code=502, detail="Poster generation failed. Please try again.")
    if not img:
        raise HTTPException(status_code=502, detail="No image returned. Please try again.")

    ext = "png" if "png" in img.get("mime_type", "") else "jpg"
    filename = f"{slug}-{uuid.uuid4().hex[:6]}.{ext}"
    (POSTER_DIR / filename).write_bytes(base64.b64decode(img["data"]))
    poster_url = f"/api/posters/{filename}"
    await db.events.update_one({"slug": slug}, {"$set": {"posterUrl": poster_url}})
    return {"ok": True, "posterUrl": poster_url}


@api_router.get("/posters/{filename}")
async def serve_poster(filename: str):
    if "/" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = POSTER_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Poster not found")
    media = "image/png" if filename.endswith(".png") else "image/jpeg"
    return FileResponse(path, media_type=media)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
