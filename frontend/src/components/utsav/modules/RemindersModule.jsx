import { useState } from "react";
import axios from "axios";
import { BellRing, Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { API, formatDateLong } from "@/lib/utsav";

export function RemindersModule({ event, onUpdate }) {
  const [reminders, setReminders] = useState(event.reminders || []);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");

  async function add() {
    if (!text.trim()) return;
    try {
      const { data } = await axios.post(`${API}/events/${event.slug}/reminders`, { text: text.trim(), when: when || null });
      setReminders(data.reminders);
      onUpdate?.({ ...event, reminders: data.reminders });
      setText("");
      setWhen("");
      setOpen(false);
      toast.success("Reminder set!");
    } catch {
      toast.error("Could not add reminder");
    }
  }

  async function toggle(index) {
    const next = reminders.map((r, i) => (i === index ? { ...r, done: !r.done } : r));
    setReminders(next);
    try {
      await axios.patch(`${API}/events/${event.slug}/reminders`, { index, done: next[index].done });
    } catch {
      setReminders(reminders);
      toast.error("Could not update reminder");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]" data-testid="module-reminders">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">Reminders</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="reminders-add-button" variant="outline" size="sm" className="rounded-full gap-1 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]">
              <Plus size={14} /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">New reminder</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input data-testid="reminder-text-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Final headcount to caterer" className="h-11 rounded-xl" />
              <Input data-testid="reminder-date-input" type="date" value={when} onChange={(e) => setWhen(e.target.value)} className="h-11 rounded-xl" />
              <Button data-testid="reminder-save-button" onClick={add} disabled={!text.trim()} className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90">
                Set reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BellRing size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No reminders yet — add nudges so nothing slips.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {reminders.map((r, i) => (
            <label key={r.id || i} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[hsl(var(--muted))]" data-testid={`reminder-item-${i}`}>
              <Checkbox
                checked={r.done}
                onCheckedChange={() => toggle(i)}
                data-testid={`reminder-item-${i}-checkbox`}
                className="mt-0.5 data-[state=checked]:border-[hsl(var(--primary))] data-[state=checked]:bg-[hsl(var(--primary))]"
              />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${r.done ? "text-muted-foreground line-through" : ""}`}>{r.text}</p>
                {r.when && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarDays size={10} /> {formatDateLong(r.when)}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
