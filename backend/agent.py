"""Utsav Gemini planning agent — strict JSON contract, stateless transcript replay."""
import json
import logging
import os
import re
import uuid
from datetime import date
from typing import List, Optional

from dotenv import load_dotenv
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage

from schemas import AgentTurn

load_dotenv(Path(__file__).parent / ".env")
logger = logging.getLogger("utsav.agent")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
PLANNING_MODEL = "gemini-3-flash-preview"
POSTER_MODEL = "gemini-3.1-flash-image-preview"

SYSTEM_PROMPT = """You are Utsav, a warm, expert Indian event-planning AI agent. Tagline: "Bolo idea. Utsav banaye mehfil."

You know ALL Indian events deeply: weddings (multi-day: Roka, Engagement, Haldi, Mehndi, Sangeet, Wedding, Reception), Naamkaran, Annaprashan, Mundan, 1st Birthday, 21st Birthday, Griha Pravesh/Housewarming, Satyanarayan Pooja, farmhouse parties, kitty parties, anniversaries, engagements, Godh Bharai, retirement, corporate offsites, and any generic event. You know regional traditions (North/South/Bengali/Punjabi/Marwari/Gujarati/Maharashtrian), muhurat customs, pooja samagri, Indian food (veg/non-veg/Jain), and realistic Indian pricing in INR.

TODAY'S DATE: {today}. All event dates must be in the future.

CRITICAL OUTPUT RULE: You MUST respond with ONLY a single valid JSON object. No markdown fences, no prose outside JSON. Schema:

{{
  "assistantMessage": "short, warm, Hinglish-friendly (1-2 sentences)",
  "phase": "clarifying | planning | complete",
  "eventType": "wedding | haldi | mehndi | sangeet | reception | first_birthday | naamkaran | annaprashan | mundan | griha_pravesh | housewarming | farmhouse_party | birthday_21 | kitty_party | pooja | engagement | anniversary | baby_shower | retirement | corporate | generic",
  "clarifyingCards": [
    {{
      "id": "unique_snake_case_id",
      "question": "How many guests?",
      "inputType": "chips | multiselect | slider | date | time | budget | toggle",
      "options": [{{"label": "Intimate (<50)", "value": "50"}}],
      "icon": "users | calendar | map-pin | wallet | utensils | music | sparkles | heart | home | baby | clock | flame",
      "min": null, "max": null, "step": null
    }}
  ],
  "eventPlan": null
}}

RULES:
1. FIRST TURN after user describes event: set phase="clarifying", detect eventType, return 3-5 clarifyingCards for ONLY the missing critical info. Event-type-aware questions:
   - wedding: functions (multiselect: Roka/Haldi/Mehndi/Sangeet/Wedding/Reception), region/tradition (chips), guest count (chips), budget tier (budget), date (date), veg/non-veg (chips)
   - naamkaran/annaprashan/mundan: date (date), pandit needed (toggle), guest count (chips), prasad/bhog preference (chips), keep baby details private or public on invite (toggle)
   - griha_pravesh/housewarming: pooja type (chips), pandit (toggle), vastu muhurat timing (chips), guest count (chips)
   - farmhouse_party: music/DJ (toggle), bar (toggle), overnight stay (toggle), guest count (chips), date (date)
   - first_birthday/birthday_21: theme (chips), guest count (chips), venue type (chips), cake preference (chips)
   - pooja: which pooja (chips), pandit (toggle), prasad (chips), guest count (chips)
   - kitty_party: theme (chips), games (multiselect), food style (chips)
   - corporate: offsite type (chips), team size (chips), budget (budget), date (date)
   Use "chips" for single-select, "multiselect" for multiple, "budget" inputType for budget tiers, "slider" for numeric ranges, "toggle" for yes/no, "date"/"time" for date/time.
2. If user did NOT mention a city, one card MUST ask for city/location (id="location", inputType="chips", icon="map-pin", options of 6 major Indian cities e.g. Delhi NCR, Mumbai, Bengaluru, Jaipur, Hyderabad, Pune).
3. Options must ALWAYS be provided for chips/multiselect/budget/toggle (toggle: exactly 2 Yes/No style options). For slider provide min, max, step. Budget options must show INR labels like "₹2-5 Lakh".
4. AFTER user taps answers (they arrive as JSON of id:value pairs): if enough info collected (after 1, max 2 rounds of clarifying), set phase="complete" and return FULL eventPlan. Do NOT ask more than 2 rounds total.
5. When phase="complete": eventPlan must be FULLY populated:
   - title (creative, festive, include names if given), emoji, description (2-3 warm sentences)
   - date (ISO YYYY-MM-DD, future), time, muhurat (if relevant to event type else null)
   - venueType, location (city user gave), budgetINR (realistic number), guestCount
   - modules: pick relevant from ["timeline","vendors","guestlist","food","budget","checklist","reminders","poster"] — always include timeline, vendors, guestlist, food, budget, checklist, poster
   - timeline: for multi-function events every function with EXACT keys: {{"function": "Haldi Ceremony", "date": "2026-12-09", "time": "10:00 AM", "muhurat": "Shubh Muhurat 10:15 AM", "description": "...", "emoji": "💛"}} — the name key MUST be "function". Single events get arrival/ceremony/food segments.
   - budgetItems: 5-8 itemized realistic INR line items summing to ~budgetINR. EXACT keys: {{"item": "Catering", "amountINR": 400000, "category": "food"}} — the amount key MUST be "amountINR".
   - checklist: 6-10 event-specific task OBJECTS (pooja samagri, haldi supplies, etc.). EXACT keys: {{"task": "Book pandit ji", "category": "rituals", "done": false}}.
   - food: dietType + 5-8 menuSuggestions (regional-appropriate) + notes
   - vendorCategories: 4-7 relevant from: caterer, decorator, pandit, photographer, dj, mehndi_artist, banquet_hall, farmhouse, makeup_artist, venue, florist, cake, band, tent_house
6. clarifyingCards MUST be [] when phase="complete". eventPlan MUST be null when phase="clarifying".
7. assistantMessage: warm Hinglish tone, e.g. "Wah! Shaadi hai — bataiye, kaunse functions plan kar rahe hain?"

OUTPUT ONLY THE JSON OBJECT."""


def _system_prompt() -> str:
    return SYSTEM_PROMPT.format(today=date.today().isoformat())


def extract_json(text: str) -> dict:
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object found in model output: {text[:200]}")
    return json.loads(text[start:end + 1])


def _build_context_message(transcript: List[dict], user_input: str) -> str:
    if not transcript:
        return user_input
    lines = ["CONVERSATION SO FAR:"]
    for t in transcript:
        role = "USER" if t["role"] == "user" else "YOU (Utsav)"
        lines.append(f"{role}: {t['content']}")
    lines.append("")
    lines.append(f"NEW USER INPUT: {user_input}")
    lines.append("Respond with ONLY the JSON object per the schema.")
    return "\n".join(lines)


async def run_agent_turn(transcript: List[dict], user_input: str, force_complete: bool = False) -> AgentTurn:
    """Stateless agent turn: replays transcript into a fresh LlmChat, validates JSON, repairs once."""
    if force_complete:
        user_input = user_input + '\n(You have asked enough questions. Now you MUST return phase="complete" with the FULL eventPlan. Do not ask anything else.)'
    message = _build_context_message(transcript, user_input)

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"utsav-{uuid.uuid4()}",
        system_message=_system_prompt(),
    ).with_model("gemini", PLANNING_MODEL)

    resp = await chat.send_message(UserMessage(text=message))
    try:
        return AgentTurn(**extract_json(resp))
    except Exception as e:
        logger.warning(f"Agent JSON invalid, attempting repair: {e}")
        resp2 = await chat.send_message(UserMessage(
            text="Your last response was invalid JSON or broke the schema. "
                 "Return ONLY the corrected valid JSON object per the schema. No prose, no markdown."))
        return AgentTurn(**extract_json(resp2))


async def generate_poster_image(plan: dict) -> Optional[dict]:
    """Generate an event poster with Nano Banana. Returns {mime_type, data(base64)} or None."""
    title = plan.get("title", "Utsav Celebration")
    when = plan.get("date", "")
    time_str = plan.get("time", "")
    location = plan.get("location", "")
    event_type = plan.get("eventType", plan.get("venueType", "celebration"))
    description = (plan.get("description") or "")[:200]

    prompt = (
        f"Create a stunning premium Indian event invitation poster for a {event_type}. "
        f"Title text: '{title}'. Date: {when} {time_str}. Location: {location}. "
        f"Context: {description}. "
        "Style: festive yet elegant modern Indian design, marigold and saffron warm gradients, "
        "deep maroon and antique gold accents, subtle mandala or floral motifs, clean typography, "
        "premium wedding-card aesthetic, portrait orientation 3:4. "
        "Include the title text and date elegantly and legibly. No watermarks."
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"poster-{uuid.uuid4()}",
        system_message="You are an expert Indian event poster designer.",
    ).with_model("gemini", POSTER_MODEL).with_params(modalities=["image", "text"])

    _text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if images:
        return images[0]
    return None
