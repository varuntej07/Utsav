# Utsav 🪔

**Bolo idea. Utsav banaye mehfil.** — describe any Indian celebration in one line, and Utsav plans the whole thing: timeline, vendors, budget, menu, and a shareable invite page. No signup required.

Utsav is an AI-powered event planner built for Indian celebrations of every kind: weddings (Roka through Reception), Haldi, Mehndi, Sangeet, Naamkaran, Griha Pravesh, birthdays, farmhouse parties, pooja, kitty parties, corporate offsites, and more. It understands Hinglish and several regional languages, so you can just type how you'd actually describe the event to a friend.

## How it works

1. **Describe your event** on the landing page, in plain English, Hinglish, or a regional language — or tap a quick-start chip (Shaadi, Haldi, Naamkaran, ...).
2. **Answer a few tap-to-answer cards** (guest count, city, budget, date, food preference, etc.) — no typing, no forms.
3. **Get a shareable event page** at `/e/your-event-slug` with a function-by-function timeline, vendor suggestions, no-login RSVP, an itemized budget, a menu, a checklist, reminders, an AI-generated poster, and one-tap sharing to WhatsApp / Maps / Calendar.

## Architecture

```
                ┌───────────────────────────────┐
                │            Browser             │
                │     React 19 + Tailwind CSS    │
                │                                 │
                │  Landing → Planner → /e/:slug   │
                └───────────────┬─────────────────┘
                                │ axios (JSON over HTTPS)
                                ▼
        ┌──────────────────────────────────────────────────┐
        │                 FastAPI  —  /api/*                 │
        │  /chat   /demo   /events/{slug}   /rsvp             │
        │  /vendors  /checklist  /budget  /food  /reminders   │
        │  /potluck  /poster                                  │
        └───────┬───────────────────┬───────────────┬────────┘
                │                   │               │
                ▼                   ▼               ▼
        ┌───────────────┐   ┌────────────────┐   ┌───────────────────┐
        │    MongoDB      │   │     Gemini      │   │  Google Places API  │
        │  sessions       │   │  (via Emergent   │   │  (New)              │
        │  events         │   │   LLM proxy)     │   │  24h Mongo cache +   │
        │  rsvps          │   │ planning JSON +  │   │  curated fallback    │
        │  vendor_cache   │   │ poster image gen │   │  vendor list         │
        └───────────────┘   └────────────────┘   └───────────────────┘
```

The interesting part isn't the boxes above, it's what happens inside `/chat` — the conversational planner is **stateless by design**: the server never pins a chat session to a model connection. Every turn replays the *entire* transcript into a brand-new `LlmChat`, so any backend replica can handle any turn of any conversation.

```
 User taps/types an answer
            │
            ▼
 Full transcript + new input replayed into a
 FRESH LlmChat  (server keeps no in-memory session)
            │
            ▼
     Gemini responds with raw text
            │
            ▼
   extract_json()  strips ``` fences, finds { ... }
            │
            ▼
   Pydantic validates the shape (AgentTurn)
       │                             │
     valid                    invalid / broken schema
       │                             │
       │                             ▼
       │                 one repair prompt sent back:
       │                 "fix your JSON" → re-validate
       │                             │
       └─────────────┬───────────────┘
                      ▼
             phase == "complete" ?
              │                  │
             no                 yes
              │                  │
              ▼                  ▼
    show clarifying cards   insert into `events`,
    wait for the next tap   redirect to /e/{slug}
```

That "one repair prompt" step exists because Gemini doesn't always return perfectly-typed JSON on the first try — early testing caught it returning `options: null` and date strings inside numeric `min`/`max` fields for date-type cards, which used to 502 the whole planner. `schemas.py` now coerces both cases before validation even runs (see `ClarifyingCard.coerce`), and `backend/test_schemas.py` pins the regression down so it can't silently come back.

## Two examples that show the non-obvious parts

**1. It skips what you already told it, in whatever language you told it in.**

Type (one of the landing page's own quick-start examples):
> "Maa paapa first birthday Hyderabad lo, 60 guests, jungle theme"

Guest count, city, and theme are already in that one line, so the planner doesn't waste a card asking about them — it jumps straight to what's actually missing (venue type, cake preference, games/entertainment, food preference), and replies in the same Telugu-in-Latin-script style the user typed in, not generic English. Two taps later: a full plan with a jungle-themed budget line, `cake`/`decorator`/`photographer` vendor categories, and a page at something like `/e/paapa-first-birthday-jungle-bash-4f2a`.

**2. A question no generic "event form" would think to ask.**

Type:
> "Naamkaran for our baby in Pune next month, keep it small"

Because the detected `eventType` is `naamkaran`, one of the clarifying cards is a toggle you won't find in any wedding-planner template: **"Keep baby's name private on the invite, or public?"** That answer isn't a special database field — per the diagram above, it's just replayed back into the *next* Gemini turn as part of the transcript, so it directly shapes how the final `title`/`description` get written (e.g. "Ashirwad Ceremony for Baby Sharma's Family" instead of naming the child). It's a small, concrete example of why the agent only needs to be stateless: the transcript *is* the state.

## Tech stack

- **Backend**: FastAPI + MongoDB (via Motor), Pydantic v2 for strict validation of the AI's JSON output.
- **AI**: Google Gemini (`gemini-3-flash-preview` for planning, `gemini-3.1-flash-image-preview` for poster generation), accessed through Emergent's LLM integration SDK.
- **Vendor data**: Google Places API (New), with a 24h cache and a curated fallback dataset.
- **Frontend**: React 19, Tailwind CSS, shadcn/ui, Framer Motion.

## Getting started

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` with:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=utsav
EMERGENT_LLM_KEY=your_emergent_llm_key
GOOGLE_PLACES_API_KEY=your_google_places_key   # optional — falls back to curated vendor data
```

Then seed a demo event and start the API:

```bash
python seed.py
uvicorn server:app --reload
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

Set `REACT_APP_BACKEND_URL` in `frontend/.env` to point at the backend above.

## Credits

Initial build scaffolded with [Emergent](https://emergent.sh); pre-submission polish (bug fixes, tests, accessibility, docs) done with [Claude Code](https://claude.com/claude-code).
