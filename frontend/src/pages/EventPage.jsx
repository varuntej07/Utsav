import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Flame, CalendarDays, MapPin, Users, Wallet, ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API, formatDateLong, formatINRCompact, mapsLink } from "@/lib/utsav";
import { TimelineModule } from "@/components/utsav/modules/TimelineModule";
import { VendorsModule } from "@/components/utsav/modules/VendorsModule";
import { RsvpModule } from "@/components/utsav/modules/RsvpModule";
import { BudgetModule } from "@/components/utsav/modules/BudgetModule";
import { FoodModule } from "@/components/utsav/modules/FoodModule";
import { ChecklistModule } from "@/components/utsav/modules/ChecklistModule";
import { RemindersModule } from "@/components/utsav/modules/RemindersModule";
import { PosterModule } from "@/components/utsav/modules/PosterModule";
import { StickyShareBar } from "@/components/utsav/StickyShareBar";

export default function EventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/events/${slug}`)
      .then((r) => setEvent(r.data))
      .catch(() => setError("Yeh event nahi mila — link check karke dobara try karein."));
  }, [slug]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
          <Flame size={24} />
        </span>
        <p className="text-lg font-medium" data-testid="event-not-found">{error}</p>
        <Link to="/" className="text-sm font-semibold text-[hsl(var(--primary))] underline" data-testid="event-back-home-link">
          Plan a new Utsav
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-10">
        <div className="h-48 rounded-2xl poster-shimmer" />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-64 rounded-2xl poster-shimmer" />
          <div className="h-64 rounded-2xl poster-shimmer" />
        </div>
      </div>
    );
  }

  const plan = event.plan;
  const modules = plan.modules || [];
  const has = (m) => modules.includes(m);
  const showChecklist = has("checklist") || has("rituals");

  return (
    <div className="min-h-screen noise-overlay bg-[radial-gradient(1100px_circle_at_15%_0%,hsl(38_92%_55%/0.14),transparent_55%),radial-gradient(800px_circle_at_95%_5%,hsl(354_55%_28%/0.07),transparent_50%)]">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 pt-6 pb-32 sm:pb-28">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" data-testid="event-home-link">
            <ArrowLeft size={15} /> Utsav
          </Link>
          <Badge variant="outline" className="rounded-full border-[hsl(var(--accent))] bg-white text-xs">
            Shareable event page
          </Badge>
        </div>

        {/* Hero */}
        <header className="anim-rise mt-8 sm:mt-12" data-testid="event-hero">
          <div className="text-5xl sm:text-6xl">{plan.emoji}</div>
          <h1 className="font-display mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-tight" data-testid="event-title">
            {plan.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">{plan.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {plan.date && (
              <Badge className="gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white" data-testid="event-date-chip">
                <CalendarDays size={12} className="text-[hsl(var(--primary))]" />
                {formatDateLong(plan.date)}{plan.time ? ` · ${plan.time}` : ""}
              </Badge>
            )}
            {plan.muhurat && (
              <Badge className="gap-1.5 rounded-full border border-[hsl(var(--utsav-gold))] bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[hsl(var(--secondary))]" data-testid="event-muhurat-chip">
                <Flame size={12} className="text-[hsl(var(--utsav-gold))]" />
                {plan.muhurat}
              </Badge>
            )}
            {plan.location && (
              <a href={mapsLink(plan.location)} target="_blank" rel="noopener noreferrer" data-testid="event-location-chip">
                <Badge className="gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-[hsl(var(--secondary))]">
                  <MapPin size={12} className="text-[hsl(var(--primary))]" />
                  {plan.location} <ExternalLink size={10} />
                </Badge>
              </a>
            )}
            {plan.guestCount && (
              <Badge className="gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white">
                <Users size={12} className="text-[hsl(var(--primary))]" />
                ~{plan.guestCount} guests
              </Badge>
            )}
            {plan.budgetINR && (
              <Badge className="gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white">
                <Wallet size={12} className="text-[hsl(var(--primary))]" />
                {formatINRCompact(plan.budgetINR)} budget
              </Badge>
            )}
          </div>
        </header>

        {/* Modules */}
        <div className="anim-stagger mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {has("poster") && (
            <ModuleWrap>
              <PosterModule event={event} onUpdate={setEvent} />
            </ModuleWrap>
          )}
          {has("guestlist") && (
            <ModuleWrap>
              <RsvpModule event={event} />
            </ModuleWrap>
          )}
          {has("timeline") && plan.timeline?.length > 0 && (
            <ModuleWrap full>
              <TimelineModule plan={plan} />
            </ModuleWrap>
          )}
          {has("vendors") && (
            <ModuleWrap full>
              <VendorsModule event={event} />
            </ModuleWrap>
          )}
          {has("budget") && plan.budgetItems?.length > 0 && (
            <ModuleWrap>
              <BudgetModule event={event} onUpdate={setEvent} />
            </ModuleWrap>
          )}
          {has("food") && plan.food && (
            <ModuleWrap>
              <FoodModule event={event} onUpdate={setEvent} />
            </ModuleWrap>
          )}
          {showChecklist && plan.checklist?.length > 0 && (
            <ModuleWrap>
              <ChecklistModule event={event} onUpdate={setEvent} />
            </ModuleWrap>
          )}
          {has("reminders") && (
            <ModuleWrap>
              <RemindersModule event={event} onUpdate={setEvent} />
            </ModuleWrap>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Made with Utsav — Bolo idea. Utsav banaye mehfil.
        </footer>
      </div>

      <StickyShareBar event={event} />
    </div>
  );
}

function ModuleWrap({ children, full }) {
  return (
    <div className={`anim-rise ${full ? "lg:col-span-2" : ""}`}>
      {children}
    </div>
  );
}
