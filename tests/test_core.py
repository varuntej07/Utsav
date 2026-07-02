"""
Utsav Core POC - Tests the 3 riskiest integrations in isolation:
1. Gemini strict-JSON multi-turn planning agent (idea -> clarifying cards -> tapped answers -> complete eventPlan)
2. Nano Banana poster generation
3. Google Places API vendor lookup (with fallback check)

Run: cd /app && python tests/test_core.py
"""
import asyncio
import base64
import json
import os
import re
import sys
import uuid
from typing import List, Literal, Optional

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError, model_validator

load_dotenv("/app/backend/.env")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
PLACES_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")

from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------------------------------------------------------------------------
# JSON Contract (Pydantic)
# ---------------------------------------------------------------------------

class CardOption(BaseModel):
    label: str
    value: str

class ClarifyingCard(BaseModel):
    id: str
    question: str
    inputType: Literal["chips", "multiselect", "slider", "date", "time", "budget", "toggle"]
    options: List[CardOption] = []
    icon: str = "sparkles"
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None

class TimelineItem(BaseModel):
    function: str
    date: Optional[str] = None
    time: Optional[str] = None
    muhurat: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, v):
        if isinstance(v, dict) and "function" not in v:
            for alt in ("event", "name", "title", "activity", "ceremony"):
                if alt in v and isinstance(v[alt], str):
                    v["function"] = v.pop(alt)
                    break
        return v

class BudgetItem(BaseModel):
    item: str
    amountINR: float
    category: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, v):
        if isinstance(v, dict):
            if "amountINR" not in v:
                for alt in ("cost", "amount", "price", "costINR", "budget"):
                    if alt in v:
                        v["amountINR"] = v.pop(alt)
                        break
            if "item" not in v:
                for alt in ("name", "title", "category"):
                    if alt in v and isinstance(v[alt], str):
                        v["item"] = v[alt]
                        break
        return v

class ChecklistItem(BaseModel):
    task: str
    category: Optional[str] = None
    done: bool = False

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, v):
        if isinstance(v, str):
            return {"task": v}
        if isinstance(v, dict) and "task" not in v:
            for alt in ("item", "title", "name", "text"):
                if alt in v and isinstance(v[alt], str):
                    v["task"] = v.pop(alt)
                    break
        return v

class FoodPlan(BaseModel):
    dietType: Optional[str] = None
    menuSuggestions: List[str] = []
    notes: Optional[str] = None

class EventPlan(BaseModel):
    title: str
    emoji: str = "🎉"
    description: str = ""
    date: Optional[str] = None
    time: Optional[str] = None
    muhurat: Optional[str] = None
    venueType: Optional[str] = None
    location: Optional[str] = None
    budgetINR: Optional[float] = None
    guestCount: Optional[int] = None
    modules: List[str] = []
    timeline: List[TimelineItem] = []
    budgetItems: List[BudgetItem] = []
    checklist: List[ChecklistItem] = []
    food: Optional[FoodPlan] = None
    vendorCategories: List[str] = []

class AgentTurn(BaseModel):
    assistantMessage: str
    phase: Literal["clarifying", "planning", "complete"]
    eventType: str
    clarifyingCards: List[ClarifyingCard] = []
    eventPlan: Optional[EventPlan] = None


SYSTEM_PROMPT = """You are Utsav, a warm, expert Indian event-planning AI agent. Tagline: "Bolo idea. Utsav banaye mehfil."

You know ALL Indian events deeply: weddings (multi-day: Roka, Engagement, Haldi, Mehndi, Sangeet, Wedding, Reception), Naamkaran, Annaprashan, Mundan, 1st Birthday, 21st Birthday, Griha Pravesh/Housewarming, Satyanarayan Pooja, farmhouse parties, kitty parties, anniversaries, engagements, Godh Bharai, retirement, corporate offsites, and any generic event. You know regional traditions (North/South/Bengali/Punjabi/Marwari/Gujarati/Maharashtrian), muhurat customs, pooja samagri, Indian food (veg/non-veg/Jain), and realistic Indian pricing in INR.

CRITICAL OUTPUT RULE: You MUST respond with ONLY a single valid JSON object. No markdown fences, no prose outside JSON. Schema:

{
  "assistantMessage": "short, warm, Hinglish-friendly (1-2 sentences)",
  "phase": "clarifying | planning | complete",
  "eventType": "wedding | haldi | mehndi | sangeet | reception | first_birthday | naamkaran | annaprashan | mundan | griha_pravesh | housewarming | farmhouse_party | birthday_21 | kitty_party | pooja | engagement | anniversary | baby_shower | retirement | corporate | generic",
  "clarifyingCards": [
    {
      "id": "unique_snake_case_id",
      "question": "How many guests?",
      "inputType": "chips | multiselect | slider | date | time | budget | toggle",
      "options": [{"label": "Intimate (<50)", "value": "50"}],
      "icon": "users | calendar | map-pin | wallet | utensils | music | sparkles | heart | home | baby | clock | flame",
      "min": null, "max": null, "step": null
    }
  ],
  "eventPlan": null
}

RULES:
1. FIRST TURN after user describes event: set phase="clarifying", detect eventType, return 3-5 clarifyingCards for ONLY the missing critical info. Event-type-aware questions:
   - wedding: functions (multiselect: Roka/Haldi/Mehndi/Sangeet/Wedding/Reception), region/tradition (chips), guest count (chips), budget tier (budget), date (date), veg/non-veg (chips)
   - naamkaran/annaprashan/mundan: date (date), pandit needed (toggle), guest count (chips), prasad/bhog preference (chips)
   - griha_pravesh: pooja type (chips), pandit (toggle), vastu muhurat timing (chips), guest count (chips)
   - farmhouse_party: music/DJ (toggle), bar (toggle), overnight stay (toggle), guest count (chips), date (date)
   - birthday: theme (chips), guest count (chips), venue type (chips), cake preference (chips)
   Use "chips" for single-select, "multiselect" for multiple, "budget" inputType for budget with min/max/step in INR, "slider" for numeric ranges, "toggle" for yes/no, "date"/"time" for date/time.
2. Options must ALWAYS be provided for chips/multiselect/budget/toggle (toggle: exactly 2 options Yes/No style). For slider/budget provide min, max, step.
3. AFTER user taps answers (they arrive as JSON of id:value pairs): if enough info collected (after 1, max 2 rounds of clarifying), set phase="complete" and return FULL eventPlan. Do NOT ask more than 2 rounds.
4. When phase="complete": eventPlan must be FULLY populated:
   - title (creative, festive, includes names if given), emoji, description (2-3 warm sentences)
   - date (ISO YYYY-MM-DD, future dates in 2026), time, muhurat (if relevant to event type else null)
   - venueType, location (city user gave, else "Delhi NCR"), budgetINR (realistic), guestCount
   - modules: pick relevant from ["timeline","vendors","guestlist","food","budget","checklist","rituals","reminders","poster"]
   - timeline: for multi-function events every function with EXACT keys: {"function": "Haldi Ceremony", "date": "2026-12-09", "time": "10:00 AM", "muhurat": "Shubh Muhurat 10:15 AM", "description": "...", "emoji": "💛"} — the name key MUST be "function". Single events get arrival/ceremony/food segments.
   - budgetItems: 5-8 itemized realistic INR line items summing to ~budgetINR. EXACT keys: {"item": "Catering", "amountINR": 400000, "category": "food"} — the amount key MUST be "amountINR".
   - checklist: 6-10 event-specific task OBJECTS (pooja samagri, haldi supplies, etc.). EXACT keys: {"task": "Book pandit ji", "category": "rituals", "done": false} — each entry MUST be an object with "task".
   - food: dietType + 5-8 menuSuggestions (regional-appropriate) + notes
   - vendorCategories: relevant vendor types e.g. ["caterer","decorator","pandit","photographer","dj","mehndi_artist","banquet_hall"]
5. clarifyingCards MUST be [] when phase="complete". eventPlan MUST be null when phase="clarifying".
6. assistantMessage: warm Hinglish tone, e.g. "Wah! Shaadi hai — bataiye, kaunse functions plan kar rahe hain?"

OUTPUT ONLY THE JSON OBJECT."""


def extract_json(text: str) -> dict:
    """Robustly extract a JSON object from LLM output."""
    text = text.strip()
    # strip markdown fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    # find first { to last }
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object found in: {text[:200]}")
    return json.loads(text[start:end + 1])


async def agent_turn(chat: LlmChat, user_text: str) -> AgentTurn:
    resp = await chat.send_message(UserMessage(text=user_text))
    try:
        data = extract_json(resp)
        return AgentTurn(**data)
    except (ValueError, ValidationError, json.JSONDecodeError) as e:
        print(f"  [repair] Invalid JSON ({e}); asking model to fix...")
        resp2 = await chat.send_message(UserMessage(
            text="Your last response was invalid. Return ONLY the valid JSON object per the schema. No prose, no markdown."))
        data = extract_json(resp2)
        return AgentTurn(**data)


async def test_gemini_planning_agent() -> bool:
    print("\n" + "=" * 70)
    print("POC 1: Gemini strict-JSON multi-turn planning agent")
    print("=" * 70)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"poc-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")

    # Turn 1: user idea
    print("\n[Turn 1] User: 'Planning my sister's Punjabi wedding in Jaipur this December'")
    t1 = await agent_turn(chat, "Planning my sister's Punjabi wedding in Jaipur this December")
    print(f"  phase={t1.phase} eventType={t1.eventType} cards={len(t1.clarifyingCards)}")
    print(f"  assistantMessage: {t1.assistantMessage}")
    for c in t1.clarifyingCards:
        print(f"    - [{c.inputType}] {c.question} ({len(c.options)} options, icon={c.icon})")
    assert t1.phase == "clarifying", f"Expected clarifying, got {t1.phase}"
    assert t1.eventType == "wedding"
    assert 3 <= len(t1.clarifyingCards) <= 5, f"Expected 3-5 cards, got {len(t1.clarifyingCards)}"
    for c in t1.clarifyingCards:
        if c.inputType in ("chips", "multiselect", "toggle"):
            assert len(c.options) >= 2, f"Card {c.id} missing options"

    # Turn 2: tapped answers
    answers = {}
    for c in t1.clarifyingCards:
        if c.inputType == "multiselect":
            answers[c.id] = [o.value for o in c.options[:4]]
        elif c.inputType in ("chips", "toggle", "budget"):
            answers[c.id] = c.options[1].value if len(c.options) > 1 else (c.options[0].value if c.options else "yes")
        elif c.inputType == "slider":
            answers[c.id] = str(int((c.min or 0) + ((c.max or 100) - (c.min or 0)) / 2))
        elif c.inputType == "date":
            answers[c.id] = "2026-12-10"
        elif c.inputType == "time":
            answers[c.id] = "19:00"
    print(f"\n[Turn 2] User taps: {json.dumps(answers, ensure_ascii=False)}")
    t2 = await agent_turn(chat, f"USER_TAPPED_ANSWERS: {json.dumps(answers, ensure_ascii=False)}")
    print(f"  phase={t2.phase} cards={len(t2.clarifyingCards)}")
    print(f"  assistantMessage: {t2.assistantMessage}")

    if t2.phase == "clarifying":
        # one more round allowed
        answers2 = {}
        for c in t2.clarifyingCards:
            if c.inputType == "multiselect":
                answers2[c.id] = [o.value for o in c.options[:2]]
            elif c.options:
                answers2[c.id] = c.options[0].value
            elif c.inputType == "date":
                answers2[c.id] = "2026-12-10"
            else:
                answers2[c.id] = "50000"
        print(f"\n[Turn 3] User taps: {json.dumps(answers2, ensure_ascii=False)}")
        t2 = await agent_turn(chat, f"USER_TAPPED_ANSWERS: {json.dumps(answers2, ensure_ascii=False)}")
        print(f"  phase={t2.phase}")

    assert t2.phase == "complete", f"Expected complete, got {t2.phase}"
    plan = t2.eventPlan
    assert plan is not None, "eventPlan missing on complete"
    print(f"\n  EVENT PLAN: {plan.emoji} {plan.title}")
    print(f"    date={plan.date} location={plan.location} budget=₹{plan.budgetINR} guests={plan.guestCount}")
    print(f"    modules={plan.modules}")
    print(f"    timeline={len(plan.timeline)} items, budgetItems={len(plan.budgetItems)}, checklist={len(plan.checklist)}")
    print(f"    vendorCategories={plan.vendorCategories}")
    assert plan.title and plan.modules and len(plan.timeline) >= 3
    assert len(plan.budgetItems) >= 4 and len(plan.checklist) >= 5
    assert plan.food and len(plan.food.menuSuggestions) >= 3
    print("\n  POC 1 PASSED ✓")
    return True


async def test_poster_generation() -> bool:
    print("\n" + "=" * 70)
    print("POC 2: Nano Banana poster generation")
    print("=" * 70)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"poster-{uuid.uuid4()}",
        system_message="You are an expert Indian event poster designer.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    prompt = (
        "Create a stunning premium Indian wedding invitation poster. "
        "Title: 'Simran weds Arjun'. Date: 10 December 2026, Jaipur. "
        "Style: royal Rajasthani palace theme, marigold and saffron gradients, deep maroon and gold accents, "
        "elegant mandala patterns, festive but clean modern design. Portrait orientation. "
        "Include the title text and date elegantly."
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    print(f"  text response: {(text or '')[:80]}")
    assert images and len(images) > 0, "No image returned"
    img = images[0]
    print(f"  image mime: {img['mime_type']}, base64 head: {img['data'][:10]}...")
    image_bytes = base64.b64decode(img["data"])
    out = "/app/tests/poc_poster.png"
    with open(out, "wb") as f:
        f.write(image_bytes)
    size_kb = len(image_bytes) / 1024
    print(f"  saved {out} ({size_kb:.0f} KB)")
    assert size_kb > 10, "Image suspiciously small"
    print("\n  POC 2 PASSED ✓")
    return True


async def test_google_places() -> bool:
    print("\n" + "=" * 70)
    print("POC 3: Google Places vendor lookup")
    print("=" * 70)
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.id",
    }
    body = {"textQuery": "banquet halls in Jaipur", "maxResultCount": 5}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, headers=headers, json=body)
        print(f"  status: {r.status_code}")
        if r.status_code != 200:
            print(f"  response: {r.text[:300]}")
            print("  Places API (New) failed — trying legacy Text Search API...")
            legacy = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            r2 = await client.get(legacy, params={"query": "banquet halls in Jaipur", "key": PLACES_KEY})
            print(f"  legacy status: {r2.status_code}, api status: {r2.json().get('status')}")
            data = r2.json()
            assert data.get("status") == "OK", f"Legacy Places failed: {data.get('status')} {data.get('error_message')}"
            results = data["results"][:5]
            for p in results:
                print(f"    - {p['name']} | rating={p.get('rating')} | {p.get('formatted_address','')[:50]}")
            assert len(results) >= 2
            print("\n  POC 3 PASSED ✓ (legacy API)")
            return True
        data = r.json()
        places = data.get("places", [])
        for p in places:
            print(f"    - {p['displayName']['text']} | rating={p.get('rating')} ({p.get('userRatingCount')} reviews)")
        assert len(places) >= 2, "Too few places returned"
        print("\n  POC 3 PASSED ✓ (Places API New)")
        return True


async def main():
    results = {}
    for name, fn in [("gemini_planning_agent", test_gemini_planning_agent),
                     ("poster_generation", test_poster_generation),
                     ("google_places", test_google_places)]:
        try:
            results[name] = await fn()
        except Exception as e:
            print(f"\n  {name} FAILED: {type(e).__name__}: {e}")
            results[name] = False

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for k, v in results.items():
        print(f"  {'PASS' if v else 'FAIL'}  {k}")
    if all(results.values()):
        print("\nALL CORE POCs PASSED ✓✓✓")
        sys.exit(0)
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
