import { useState } from "react";
import axios from "axios";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { API, formatINR, formatINRCompact } from "@/lib/utsav";

const STEP = 10000;

export function BudgetModule({ event, onUpdate }) {
  const [items, setItems] = useState(event.plan.budgetItems || []);
  const total = items.reduce((s, i) => s + (i.amountINR || 0), 0);

  async function adjust(index, delta) {
    const next = items.map((it, i) => (i === index ? { ...it, amountINR: Math.max(0, it.amountINR + delta) } : it));
    setItems(next);
    try {
      await axios.patch(`${API}/events/${event.slug}/budget`, { index, amountINR: next[index].amountINR });
      onUpdate?.({ ...event, plan: { ...event.plan, budgetItems: next, budgetINR: next.reduce((s, i) => s + i.amountINR, 0) } });
    } catch {
      setItems(items);
      toast.error("Budget update failed");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]" data-testid="module-budget">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">Budget Estimator</h3>
        <span className="rounded-full border border-[hsl(var(--utsav-gold))] bg-[hsl(var(--secondary))] px-3 py-1 text-sm font-bold" data-testid="event-budget-total">
          {formatINRCompact(total)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5" data-testid={`budget-item-${i}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{it.item}</p>
              <p className="text-xs text-muted-foreground">{formatINR(it.amountINR)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid={`budget-item-${i}-minus`}
                onClick={() => adjust(i, -STEP)}
                aria-label="Decrease"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                data-testid={`budget-item-${i}-plus`}
                onClick={() => adjust(i, STEP)}
                aria-label="Increase"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold">Running total</span>
        <span className="text-lg font-bold text-[hsl(var(--primary))]">{formatINR(total)}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">Tap +/− to adjust by ₹10,000. Indian numbering — lakhs & crores.</p>
    </section>
  );
}
