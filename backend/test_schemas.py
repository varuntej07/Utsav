"""Regression tests for the Gemini output coercion in schemas.py.

Pins down a bug seen in test_reports/iteration_1.json: for date-type
clarifyingCards, Gemini sometimes returned options=None (instead of [])
and date strings in min/max (instead of numbers), which broke Pydantic
validation and 502'd POST /api/chat.
"""
from schemas import AgentTurn, ClarifyingCard


def test_date_card_with_null_options_and_date_string_bounds():
    card = ClarifyingCard.model_validate({
        "id": "wedding_date",
        "question": "When is the wedding?",
        "inputType": "date",
        "options": None,
        "min": "2026-12-08",
        "max": "2026-12-10",
    })
    assert card.options == []
    assert card.min is None
    assert card.max is None


def test_slider_card_with_numeric_strings_is_coerced_to_float():
    card = ClarifyingCard.model_validate({
        "id": "guest_count",
        "question": "How many guests?",
        "inputType": "slider",
        "min": "10",
        "max": "500",
        "step": "10",
    })
    assert card.min == 10.0
    assert card.max == 500.0
    assert card.step == 10.0


def test_full_agent_turn_with_malformed_date_card_still_validates():
    raw = {
        "assistantMessage": "Wah! Shaadi hai. Kab hai?",
        "phase": "clarifying",
        "eventType": "wedding",
        "clarifyingCards": [
            {
                "id": "wedding_date",
                "question": "When is the wedding?",
                "inputType": "date",
                "options": None,
                "icon": "calendar",
                "min": "2026-12-08",
                "max": "2026-12-10",
            }
        ],
        "eventPlan": None,
    }
    turn = AgentTurn(**raw)
    assert turn.clarifyingCards[0].options == []
    assert turn.clarifyingCards[0].min is None
