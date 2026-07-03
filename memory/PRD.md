# Utsav - PRD & Implementation Memory

## Product
AI-powered conversational event-planning web app for India (hackathon entry).
Tagline: "Bolo idea. Utsav banaye mehfil."
No auth, no signup. One message -> tap-to-answer clarifying cards -> complete shareable event page.

## Stack (user-approved adaptation)
- Frontend: React (CRA) + Tailwind + shadcn/ui + Framer Motion (micro-interactions only)
- Backend: FastAPI + MongoDB (motor)
- LLM: Gemini via Emergent Universal Key (`gemini-3-flash-preview` planning JSON, `gemini-3.1-flash-image-preview` Nano Banana posters)
- Google Places API (New) for real vendor data, key in backend/.env, with curated fallback dataset

## Core Innovation
POST /api/chat returns a strict JSON contract each turn (assistantMessage, phase clarifying|planning|complete, eventType, clarifyingCards[], eventPlan). Frontend component registry renders inputTypes: chips, multiselect, slider, date, time, budget, toggle. Max 2 clarifying rounds (server-enforced force_complete). Stateless transcript replay stored in Mongo `sessions`.

## Key Files
- backend/agent.py: system prompt (event-type-aware questions incl. drinks/alcohol, veg/non-veg/Jain, baraat, pandit, theme; NO em-dashes rule; date/time cards must have options [] + null min/max), poster prompt (MINIMAL style: ivory bg, one subtle motif, no heavy ornamentation), extract_json + repair retry
- backend/schemas.py: Pydantic contract with tolerant coercion validators (options null->[], min/max junk->None, budget "cost"->amountINR, checklist strings->objects, timeline "event"->function)
- backend/vendors.py: Places textsearch + 24h Mongo cache (vendor_cache) + FALLBACK_VENDORS + PRICE_RANGES per category
- backend/server.py: /api/chat, /api/demo, /api/events/{slug} (+rsvp, rsvps, vendors, vendors/shortlist, checklist, budget, food, potluck, reminders, poster), /api/posters/{file}
- backend/seed.py: idempotent demo wedding seed (slug: simran-weds-arjun) with 12 RSVPs, minimal AI poster at static/posters/
- frontend pages: Landing.jsx (hero, chips, demo card), Planner.jsx (chat + ClarifyingCards + assembling screen), EventPage.jsx (/e/:slug modules)
- frontend/src/components/utsav/: ClarifyingCards.jsx (component registry), StickyShareBar.jsx (WhatsApp wa.me / Maps / Google Calendar / copy), modules/ (Timeline, Vendors, Rsvp, Budget, Food+potluck, Checklist, Reminders, Poster)

## User's explicit preferences
1. NO em-dashes anywhere on the site (also enforced in LLM prompt rule 8)
2. Posters MINIMAL, not decorative/busy
3. Clarifying questions must be event-appropriate & rich (drinks/alcohol, veg/non-veg, baraat etc.)
4. Poster generation button-triggered (not automatic)
5. Emergent LLM key for Gemini; user's own Google Places API key (in backend/.env)

## Critical learnings
- Framer-motion entrance animations stall for late-mounted components in headless browsers -> use CSS .anim-rise / .anim-stagger (index.css) for anything mounted after data fetch
- Gemini schema drift handled via coercion validators, never trust raw output
- Poster generation takes ~30-60s; frontend uses 120s axios timeout

## UI Refresh (user-requested)
- Fonts: Fraunces (soft serif headings) + Manrope (clean sans body)
- Colors: pure white base, charcoal text/buttons, marigold-amber accent (tokens in index.css)
- Landing: smooth infinite marquee carousel of multi-language example idea cards (Hinglish/English/Telugu/Malayalam/Tamil/Bengali), tap starts planner; demo event preview kept
- Agent rule 9: reply in the user's own language (any Indian language, Latin script ok)
- index.html title: Utsav | AI Event Planner for India

## Status
- Phase 1 POC: PASSED (2 consecutive runs)
- Phase 2 MVP: complete; testing agent iteration_1: backend 14/15 (chat bug FIXED after), frontend all flows passing
- Demo: /e/simran-weds-arjun
