import { CalendarDays, Clock, Flame, CalendarPlus } from "lucide-react";
import { calendarLink, formatDateLong } from "@/lib/utsav";

export function TimelineModule({ plan }) {
  return (
    <section className="rounded-3xl bg-white p-6 sm:p-7 shadow-[var(--shadow-card)]" data-testid="module-timeline">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">Timeline & Functions</h3>
        <span className="text-xs text-muted-foreground">{plan.timeline.length} functions</span>
      </div>
      <div className="flex flex-col">
        {plan.timeline.map((t, i) => {
          const gcal = calendarLink({
            title: `${t.emoji || ""} ${t.function} | ${plan.title}`.trim(),
            date: t.date || plan.date,
            time: t.time,
            details: t.description,
            location: plan.location,
          });
          return (
            <div key={i} className="relative flex gap-4 pb-6 last:pb-0" data-testid={`timeline-item-${i}`}>
              {/* rail */}
              <div className="flex flex-col items-center">
                <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--utsav-gold))] bg-[hsl(var(--secondary))] text-lg">
                  {t.emoji || "\u2726"}
                </span>
                {i < plan.timeline.length - 1 && <span className="w-px flex-1 bg-[hsl(var(--border))]" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{t.function}</p>
                  {t.muhurat && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--utsav-gold))] bg-[hsl(var(--utsav-gold)/0.14)] px-2 py-0.5 text-[11px] font-medium">
                      <Flame size={10} className="text-[hsl(var(--utsav-gold))]" /> {t.muhurat}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {t.date && (
                    <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {formatDateLong(t.date)}</span>
                  )}
                  {t.time && (
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {t.time}</span>
                  )}
                  {gcal && (
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`timeline-item-${i}-calendar-link`}
                      className="inline-flex items-center gap-1 font-medium text-[hsl(var(--primary-text))] hover:underline"
                    >
                      <CalendarPlus size={11} /> Add to Calendar
                    </a>
                  )}
                </div>
                {t.description && <p className="mt-1.5 text-sm text-muted-foreground">{t.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
