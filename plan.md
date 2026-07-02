# Utsav — Development Plan (React + FastAPI + MongoDB)

## 1) Objectives
- Deliver a premium, hackathon-ready AI event planner for India: **one message → tap-to-answer clarifications → complete shareable event page**.
- Prove the **core innovation**: Gemini returns **strict JSON contract** each turn; frontend renders dynamic UI from it (no fixed forms).
- Integrate **real vendor data** (Google Places) with caching + graceful seeded fallback.
- Provide **public /e/:slug event pages** with RSVP, WhatsApp invites, Maps directions, Calendar links, and **button-triggered** AI poster generation (Nano Banana).

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation) (must pass before app build)
**Goal:** Validate the 3 riskiest integrations end-to-end via `test_core.py`.

**User stories (POC)**
1. As a user, I can type “Punjabi wedding in Jaipur” and receive **only valid JSON** with clarifying cards.
2. As a user, I can send tapped answers and get the **next JSON turn** without schema breaks.
3. As a user, I can reach `phase=complete` and obtain a populated `eventPlan` with modules.
4. As a user, I can generate a poster image from plan details and receive an image URL/bytes.
5. As a user, I can fetch real nearby venues/vendors via Google Places, and still see results if the API fails.

**Steps**
1. Websearch/playbook: best practices for **Gemini “strict JSON” prompting** + validation/repair patterns.
2. Define the JSON schema (Pydantic) for:
   - `assistantMessage`, `phase`, `eventType`, `clarifyingCards[]`, `eventPlan` (with modules)
3. `test_core.py` (single script) implementing:
   - Multi-turn simulation: idea → clarifying → tapped answers → complete
   - Hard validation: `json.loads` + Pydantic parse; fail fast on any mismatch
   - JSON repair fallback: if invalid, re-ask Gemini: “Return ONLY valid JSON matching schema”
4. Nano Banana poster POC:
   - Prompt template from `eventPlan` fields → generate image → save locally + print URL/path
5. Google Places POC (using provided key via env):
   - Text search/nearby search for venue/vendor types near a sample location
   - Cache response (simple local file cache for POC)
   - Fallback to seeded vendor list if Places fails/quota
6. Exit criteria: all 3 POC sections pass twice consecutively (no manual edits).

---

### Phase 2 — V1 App Development (MVP around proven core)
**Goal:** Ship the full flow: landing → planner (dynamic cards) → event page (/e/:slug) with modules + integrations.

**User stories (V1)**
1. As a user, I can start on the landing page and immediately describe my event without signup.
2. As a user, I can answer 3–5 clarifying questions per round by tapping chips/sliders/date-time.
3. As a user, I can see a beautiful event page generated instantly at `/e/:slug` and share it.
4. As a guest, I can RSVP (Going/Maybe/Can’t) without login and see updated counts.
5. As a host, I can open Vendors and shortlist options with real data (or fallback) and ₹ ranges.

**Backend (FastAPI + MongoDB)**
1. Data models (Mongo): `ConversationSession`, `Event`, `RSVP`, `VendorCache`, `PosterAsset`.
2. Endpoints (MVP):
   - `POST /api/chat` (sessionId, userInput OR tappedAnswers) → Gemini → validated JSON
   - `POST /api/events` (from complete `eventPlan`) → returns `{slug}`
   - `GET /api/events/{slug}`
   - `POST /api/events/{slug}/rsvp`
   - `GET /api/events/{slug}/vendors?category=...` (Places + cache + fallback)
   - `POST /api/events/{slug}/poster` (Nano Banana; store + return URL)
3. Strict JSON enforcement:
   - Validate Gemini responses server-side; if invalid, auto-repair + retry once
4. Vendor lookup:
   - Use Places API; normalize fields into UI-ready vendor cards; cache by `(location, category)`
5. Seed script:
   - Insert one premium North Indian wedding demo event with filled modules + poster placeholder.

**Frontend (React + Tailwind + shadcn/ui + Framer Motion)**
1. Routes:
   - `/` landing (tagline, event-type chips, “Describe your event…” input)
   - `/plan` planner chat UI
   - `/e/:slug` public event page
2. Dynamic UI core:
   - Component registry for `inputType`: `chips`, `multiselect`, `slider`, `date`, `time`, `budget`, `toggle`
   - Clarifying cards render as tappable widgets; submit selections as structured payload
3. Event page modules (based on `eventPlan.modules`):
   - Timeline, Vendors, Guestlist+RSVP, Budget, Food, Checklist/Rituals, Reminders, Poster
4. Integrations UI:
   - WhatsApp `wa.me` link with prefilled invite text + event URL
   - Google Maps directions link from venue/location
   - Google Calendar “Add to Calendar” links per function
5. Poster:
   - “Generate Poster” button → calls backend → shows image + download
6. Motion/design:
   - Festive premium palette, rounded cards, subtle shadows, animated card entry.

**Phase-2 testing (1 full E2E round)**
- Manual E2E: landing → plan → complete → create event → open `/e/:slug` → RSVP → WhatsApp link → Maps/Calendar links → vendor fetch → poster generation.

---

### Phase 3 — Feature Expansion + Hardening
**Goal:** Improve reliability, richness of templates, and demo polish without changing core architecture.

**User stories (Expansion)**
1. As a user, I can plan different Indian event types (naamkaran, annaprashan, griha pravesh, pooja, farmhouse party) with relevant modules.
2. As a host, I can edit budget line items and see totals in lakhs/crores formatting.
3. As a host, I can toggle checklist items and see completion progress.
4. As a user, I can re-open a session and continue planning without losing context.
5. As a demo viewer, I can open the seeded wedding and see everything working instantly.

**Steps**
1. Expand event-type aware clarifying logic + templates (region/ritual aware).
2. Robust module rendering + empty/loading/error states for every module.
3. Better caching + rate limit handling for Places; add per-event vendor shortlist persistence.
4. Improve RSVP UX (guest name optional, headcount, comments) while still no-auth.
5. Add analytics-lite logging (server logs) to spot schema failures quickly.

**Phase-3 testing (1 full E2E round)**
- Run through at least 3 event types + seeded demo; verify Places fallback + poster generation.

---

## 3) Next Actions
1. Create `test_core.py` + Pydantic schema and run the multi-turn Gemini strict-JSON loop until stable.
2. Implement Nano Banana poster generation in POC and verify saved output.
3. Implement Places lookup POC using env var key + caching + fallback dataset.
4. After POC passes, scaffold FastAPI endpoints + Mongo models + seed demo event.
5. Build React planner (dynamic cards) + `/e/:slug` event page + integrations; run 1 E2E test.

---

## 4) Success Criteria
- **POC:** 2 consecutive runs where Gemini produces valid schema-compliant JSON across multi-turn; poster generation works; Places lookup returns real results and fallback works.
- **Core UX:** user can go from idea → taps → complete event page in under ~60 seconds.
- **No-auth sharing:** `/e/:slug` works on mobile; RSVP updates counts; WhatsApp/Maps/Calendar links function.
- **Demo polish:** seeded wedding looks premium, loads fast, and every button works (including poster generation).

---
## STATUS UPDATE (post Phase 2)
- Phase 1 POC: PASSED (Gemini JSON agent, Nano Banana poster, Google Places)
- Phase 2 MVP: COMPLETE. Testing agent iteration_1: backend 14/15, frontend all flows passing.
- CRITICAL chat validation bug FIXED (tolerant ClarifyingCard coercion + prompt rules for date/time cards). Verified with naamkaran + farmhouse + kitty flows.
- User feedback applied: no em-dashes site-wide (+ LLM rule), MINIMAL poster style (demo poster regenerated), richer event-aware clarifying questions (drinks/alcohol, veg/non-veg/Jain, baraat, pandit, theme).
- Demo event live at /e/simran-weds-arjun with minimal AI poster.
- Next (Phase 3 candidates): session resume, vendor shortlist UX polish, more templates hardening, analytics-lite logging.
