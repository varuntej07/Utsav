import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { API } from "@/lib/utsav";

export function ChecklistModule({ event, onUpdate }) {
  const [items, setItems] = useState(event.plan.checklist || []);
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  async function toggle(index) {
    const next = items.map((it, i) => (i === index ? { ...it, done: !it.done } : it));
    setItems(next);
    try {
      await axios.patch(`${API}/events/${event.slug}/checklist`, { index, done: next[index].done });
      onUpdate?.({ ...event, plan: { ...event.plan, checklist: next } });
    } catch {
      setItems(items);
      toast.error("Could not update checklist");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]" data-testid="module-checklist">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">Rituals & Checklist</h3>
        <span className="text-xs font-semibold text-muted-foreground" data-testid="checklist-progress-label">{done}/{items.length} done</span>
      </div>
      <Progress value={pct} className="h-2 bg-[hsl(var(--muted))]" />
      <div className="mt-4 flex flex-col gap-1">
        {items.map((it, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[hsl(var(--muted))]"
            data-testid={`checklist-item-${i}`}
          >
            <Checkbox
              checked={it.done}
              onCheckedChange={() => toggle(i)}
              data-testid={`checklist-item-${i}-checkbox`}
              className="mt-0.5 data-[state=checked]:border-[hsl(var(--primary))] data-[state=checked]:bg-[hsl(var(--primary))]"
            />
            <div className="min-w-0">
              <p className={`text-sm font-medium ${it.done ? "text-muted-foreground line-through" : ""}`}>{it.task}</p>
              {it.category && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.category}</p>}
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
