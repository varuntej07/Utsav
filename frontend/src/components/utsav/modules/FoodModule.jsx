import { useState } from "react";
import axios from "axios";
import { Leaf, Drumstick, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API } from "@/lib/utsav";

const DIET_OPTIONS = [
  { key: "Pure Veg", icon: Leaf },
  { key: "Both Veg & Non-veg", icon: Drumstick },
  { key: "Jain", icon: Sparkles },
];

export function FoodModule({ event, onUpdate }) {
  const food = event.plan.food || {};
  const [dietType, setDietType] = useState(food.dietType || "Pure Veg");
  const [potluck, setPotluck] = useState(event.potluck || []);
  const [pName, setPName] = useState("");
  const [pDish, setPDish] = useState("");
  const smallEvent = (event.plan.guestCount || 100) <= 60;

  async function setDiet(d) {
    const prev = dietType;
    setDietType(d);
    try {
      await axios.patch(`${API}/events/${event.slug}/food`, { dietType: d });
      onUpdate?.({ ...event, plan: { ...event.plan, food: { ...food, dietType: d } } });
    } catch {
      setDietType(prev);
      toast.error("Could not update");
    }
  }

  async function addPotluck() {
    if (!pDish.trim()) return;
    try {
      const { data } = await axios.post(`${API}/events/${event.slug}/potluck`, { name: pName.trim() || "Guest", dish: pDish.trim() });
      setPotluck(data.potluck);
      setPName("");
      setPDish("");
      toast.success("Yum! Added to the potluck list.");
    } catch {
      toast.error("Could not add dish");
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 sm:p-7 shadow-[var(--shadow-card)]" data-testid="module-food">
      <h3 className="font-display mb-4 text-lg sm:text-xl font-bold tracking-[-0.01em]">Food & Drinks</h3>

      {/* Diet toggles */}
      <div className="flex flex-wrap gap-2">
        {DIET_OPTIONS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            data-testid={`food-diet-${key.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            onClick={() => setDiet(key)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] ${
              dietType === key
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "border-border bg-white hover:bg-[hsl(var(--secondary))]"
            }`}
          >
            <Icon size={14} /> {key}
          </button>
        ))}
      </div>

      {/* Menu suggestions */}
      {food.menuSuggestions?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested menu</p>
          <div className="flex flex-wrap gap-2" data-testid="food-menu-list">
            {food.menuSuggestions.map((m, i) => (
              <span key={i} className="rounded-full border border-border bg-[hsl(var(--muted))] px-3 py-1.5 text-sm">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
      {food.notes && <p className="mt-3 text-xs text-muted-foreground">{food.notes}</p>}

      {/* Potluck sign-up for smaller events */}
      {smallEvent && (
        <div className="mt-5 rounded-xl bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Potluck sign-up</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input data-testid="potluck-name-input" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Your name" className="h-10 rounded-xl bg-white" />
            <Input data-testid="potluck-dish-input" value={pDish} onChange={(e) => setPDish(e.target.value)} placeholder="What will you bring?" className="h-10 rounded-xl bg-white" />
            <Button data-testid="potluck-add-button" onClick={addPotluck} disabled={!pDish.trim()} className="h-10 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 gap-1">
              <Plus size={14} /> Add
            </Button>
          </div>
          {potluck.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5" data-testid="potluck-list">
              {potluck.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-sm">
                  <span className="font-medium">{p.dish}</span>
                  <span className="text-xs text-muted-foreground">by {p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
