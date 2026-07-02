import { useEffect, useState } from "react";
import axios from "axios";
import { Check, HelpCircle, X, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API } from "@/lib/utsav";

const STATUS_META = {
  going: { label: "Going", icon: Check, color: "hsl(142 52% 36%)" },
  maybe: { label: "Maybe", icon: HelpCircle, color: "hsl(38 92% 45%)" },
  no: { label: "Can't", icon: X, color: "hsl(0 60% 50%)" },
};

export function RsvpModule({ event }) {
  const [summary, setSummary] = useState(event.rsvpSummary || { going: 0, maybe: 0, no: 0, goingHeadcount: 0 });
  const [rsvps, setRsvps] = useState([]);
  const [name, setName] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [myStatus, setMyStatus] = useState(() => localStorage.getItem(`utsav_rsvp_${event.slug}`));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${API}/events/${event.slug}/rsvps`).then((r) => {
      setRsvps(r.data.rsvps);
      setSummary(r.data.summary);
    }).catch(() => {});
  }, [event.slug]);

  async function submit(status) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/events/${event.slug}/rsvp`, {
        name: name.trim() || "Guest",
        status,
        headcount: Number(headcount) || 1,
      });
      setSummary(data.summary);
      setRsvps((r) => [data.rsvp, ...r]);
      setMyStatus(status);
      localStorage.setItem(`utsav_rsvp_${event.slug}`, status);
      toast.success(status === "going" ? "Yay! Milte hain wahan \u{1F389}" : "RSVP saved. Thank you!");
    } catch {
      toast.error("RSVP save nahi hua. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]" data-testid="module-rsvp">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">Guest List & RSVP</h3>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" data-testid="rsvp-headcount">
          <Users size={12} /> {summary.goingHeadcount} attending
        </span>
      </div>

      {/* Live counts */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} className="rounded-xl border border-border bg-[hsl(var(--muted))] px-3 py-3 text-center" data-testid={`rsvp-count-${key}`}>
            <p className="text-2xl font-bold" style={{ color: meta.color }}>{summary[key]}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{meta.label}</p>
          </div>
        ))}
      </div>

      {/* RSVP form */}
      {myStatus ? (
        <div className="mt-4 rounded-xl border border-[hsl(142_52%_36%)]/40 bg-[hsl(142_52%_36%)]/8 px-4 py-3 text-sm" data-testid="rsvp-responded">
          You responded <strong>{STATUS_META[myStatus]?.label}</strong>. Change of plans?{" "}
          <button className="font-semibold text-[hsl(var(--primary))] underline" data-testid="rsvp-change-button" onClick={() => { setMyStatus(null); localStorage.removeItem(`utsav_rsvp_${event.slug}`); }}>
            RSVP again
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex gap-2">
            <Input
              data-testid="rsvp-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-11 rounded-xl bg-white"
            />
            <select
              data-testid="rsvp-headcount-select"
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
              className="h-11 rounded-xl border border-input bg-white px-3 text-sm"
              aria-label="Number of people"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <Button
                  key={key}
                  data-testid={`event-rsvp-${key}-button`}
                  disabled={submitting}
                  onClick={() => submit(key)}
                  variant="outline"
                  className="h-11 rounded-xl gap-1.5 border-border bg-white font-semibold hover:bg-[hsl(var(--secondary))]"
                  style={{ color: meta.color }}
                >
                  <Icon size={15} /> {meta.label}
                </Button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">One tap, no account needed.</p>
        </div>
      )}

      {/* Recent guests */}
      {rsvps.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent responses</p>
          <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1" data-testid="rsvp-guest-list">
            {rsvps.slice(0, 20).map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta?.icon || Check;
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-sm">
                  <span className="truncate font-medium">{r.name}{r.headcount > 1 ? ` +${r.headcount - 1}` : ""}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: meta?.color }}>
                    <Icon size={12} /> {meta?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
