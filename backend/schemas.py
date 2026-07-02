"""Utsav JSON contract schemas: validated Gemini agent output + API models."""
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, model_validator


class CardOption(BaseModel):
    model_config = ConfigDict(extra="ignore")
    label: str
    value: str

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, v):
        if isinstance(v, str):
            return {"label": v, "value": v}
        if isinstance(v, dict) and "value" in v and not isinstance(v["value"], str):
            v["value"] = str(v["value"])
        return v


class ClarifyingCard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    question: str
    inputType: Literal["chips", "multiselect", "slider", "date", "time", "budget", "toggle"]
    options: List[CardOption] = []
    icon: str = "sparkles"
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, v):
        if isinstance(v, dict):
            # Gemini sometimes returns options: null
            if v.get("options") is None:
                v["options"] = []
            # Gemini sometimes puts date strings or junk in min/max/step
            for key in ("min", "max", "step"):
                val = v.get(key)
                if val is not None and not isinstance(val, (int, float)):
                    try:
                        v[key] = float(val)
                    except (TypeError, ValueError):
                        v[key] = None
            if v.get("icon") is None:
                v["icon"] = "sparkles"
        return v


class TimelineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
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
    model_config = ConfigDict(extra="ignore")
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
    model_config = ConfigDict(extra="ignore")
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
    model_config = ConfigDict(extra="ignore")
    dietType: Optional[str] = None
    menuSuggestions: List[str] = []
    notes: Optional[str] = None


class EventPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
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
    model_config = ConfigDict(extra="ignore")
    assistantMessage: str
    phase: Literal["clarifying", "planning", "complete"]
    eventType: str = "generic"
    clarifyingCards: List[ClarifyingCard] = []
    eventPlan: Optional[EventPlan] = None
