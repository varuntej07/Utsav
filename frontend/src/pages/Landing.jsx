import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Flame, Sparkles, Send, MapPin, CalendarDays, Users,
  MessageCircle, CheckCircle2, PartyPopper, Home as HomeIcon,
  Cake, Music, Heart, Baby, Briefcase, Coffee, Gem, Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { API, formatDateLong } from "@/lib/utsav";

const EVENT_CHIPS = [
  { label: "Shaadi", icon: Gem, prompt: "Planning a wedding" },
  { label: "Haldi", icon: Flower2, prompt: "Planning a Haldi ceremony" },
  { label: "Naamkaran", icon: Baby, prompt: "Planning a Naamkaran (naming ceremony) for our baby" },
  { label: "Griha Pravesh", icon: HomeIcon, prompt: "Planning a Griha Pravesh for our new home" },
  { label: "Birthday", icon: Cake, prompt: "Planning a birthday party" },
  { label: "Farmhouse Party", icon: Music, prompt: "Planning a farmhouse party with friends" },
  { label: "Kitty Party", icon: Coffee, prompt: "Planning a kitty party" },
  { label: "Pooja", icon: Flame, prompt: "Planning a Satyanarayan Pooja at home" },
  { label: "Anniversary", icon: Heart, prompt: "Planning our anniversary celebration" },
  { label: "Corporate", icon: Briefcase, prompt: "Planning a corporate offsite for my team" },
];

const EXAMPLES = [
  { lang: "Hinglish", text: "Meri behen ki shaadi hai Jaipur mein this December, 300 guests", icon: Gem, meta: "Wedding \u00b7 Jaipur" },
  { lang: "English", text: "Housewarming party for our new flat in Bengaluru, 40 guests", icon: HomeIcon, meta: "Griha Pravesh \u00b7 Bengaluru" },
  { lang: "Telugu", text: "Maa paapa first birthday Hyderabad lo, 60 guests, jungle theme", icon: Cake, meta: "1st Birthday \u00b7 Hyderabad" },
  { lang: "Malayalam", text: "Ente veettil griha pravesham Kochi il, 50 aalukal, pooja venam", icon: Flame, meta: "Griha Pravesh \u00b7 Kochi" },
  { lang: "Tamil", text: "En thangachi oda engagement Chennai la, 100 perukku", icon: Heart, meta: "Engagement \u00b7 Chennai" },
  { lang: "Bengali", text: "Amar chheler annaprashan Kolkata te, 80 jon guest", icon: Baby, meta: "Annaprashan \u00b7 Kolkata" },
  { lang: "English", text: "Farmhouse party with DJ and BBQ near Gurgaon for 30 friends", icon: Music, meta: "Farmhouse Party \u00b7 Gurgaon" },
  { lang: "Hinglish", text: "Papa ke retirement ki grand party Pune mein, 70 guests", icon: Briefcase, meta: "Retirement \u00b7 Pune" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [demo, setDemo] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/demo`).then((r) => setDemo(r.data)).catch((e) => {
      console.error("Failed to load demo event:", e);
    });
  }, []);

  const start = () => {
    const message = text.trim();
    if (!message) return;
    sessionStorage.setItem("utsav_initial", message);
    navigate("/plan", { state: { initialMessage: message } });
  };

  return (
    <div className="min-h-screen bg-white bg-[radial-gradient(1000px_circle_at_50%_-10%,hsl(36_95%_50%/0.07),transparent_55%)]">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="landing-logo">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <Flame size={18} />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">Utsav</span>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex gap-1 rounded-full border-[hsl(var(--accent))] bg-white px-3 py-1 text-xs text-foreground">
            <Sparkles size={12} className="text-[hsl(var(--accent))]" /> AI Event Planner for India
          </Badge>
        </header>

        {/* Hero */}
        <section className="mt-12 sm:mt-20">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.05]"
            data-testid="landing-hero-title"
          >
            Bolo idea.
            <br />
            <span className="text-[hsl(30_90%_45%)]">Utsav banaye mehfil.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground"
          >
            Describe any celebration in one line: shaadi, pooja, birthday ya farmhouse party.
            Utsav plans the timeline, vendors, budget, menu and a shareable invite page. No signup.
          </motion.p>

          {/* Describe input */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 rounded-2xl border border-border bg-white p-3 shadow-[var(--shadow-md)]"
          >
            <Textarea
              ref={inputRef}
              data-testid="landing-describe-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  start();
                }
              }}
              placeholder='Describe your event… e.g. "Meri behen ki shaadi hai in Jaipur this December, 300 guests"'
              className="min-h-[88px] resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0 p-2"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs text-muted-foreground hidden sm:block">Hinglish works too. Enter to start.</span>
              <Button
                data-testid="landing-start-button"
                onClick={start}
                disabled={!text.trim()}
                className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] hover:bg-[hsl(var(--primary))]/90 gap-2 px-5"
              >
                Plan my Utsav <Send size={15} />
              </Button>
            </div>
          </motion.div>

          {/* Quick-start chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x"
            data-testid="landing-event-chips"
          >
            {EVENT_CHIPS.map(({ label, icon: Icon, prompt }) => (
              <button
                key={label}
                data-testid={`landing-event-type-chip-${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => {
                  setText(prompt + " ");
                  inputRef.current?.focus();
                }}
                className="snap-start inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium shadow-[var(--shadow-sm)] transition-colors hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--secondary))] active:scale-[0.98]"
              >
                <Icon size={14} className="text-[hsl(var(--primary))]" />
                {label}
              </button>
            ))}
          </motion.div>

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[hsl(142_52%_36%)]" /> No signup needed</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle size={14} className="text-[hsl(142_52%_36%)]" /> Share on WhatsApp</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-[hsl(142_52%_36%)]" /> Guests RSVP in one tap</span>
          </div>
        </section>

        {/* Example ideas carousel */}
        <section className="mt-14" data-testid="landing-examples-carousel">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Kisi bhi bhasha mein bolo. Tap an idea to try
          </h2>
          <div className="relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="marquee-track">
              {[...EXAMPLES, ...EXAMPLES].map(({ lang, text: exText, icon: Icon, meta }, i) => (
                <button
                  key={i}
                  type="button"
                  data-testid={`landing-example-card-${i % EXAMPLES.length}`}
                  aria-hidden={i >= EXAMPLES.length}
                  tabIndex={i >= EXAMPLES.length ? -1 : 0}
                  onClick={() => {
                    sessionStorage.setItem("utsav_initial", exText);
                    navigate("/plan", { state: { initialMessage: exText } });
                  }}
                  className="group mr-3 w-[300px] shrink-0 rounded-2xl border border-border bg-white p-4 text-left shadow-[var(--shadow-sm)] transition-colors hover:border-[hsl(var(--accent))] hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[hsl(30_90%_45%)]">
                      <Icon size={13} /> {meta}
                    </span>
                    <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{lang}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-snug">{"\u201C"}{exText}{"\u201D"}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] opacity-0 transition-opacity group-hover:opacity-100">
                    Plan this <Send size={11} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Demo event card */}
        {demo && (
          <section className="anim-rise mt-14">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">See a live Utsav</h2>
            <div
              className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]"
              data-testid="landing-demo-card"
            >
              {demo.posterUrl && (
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${demo.posterUrl}`}
                  alt="Demo wedding poster"
                  className="h-36 w-28 rounded-xl object-cover shadow-[var(--shadow-md)]"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <PartyPopper size={16} className="text-[hsl(var(--accent))]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]">North Indian Wedding · Demo</span>
                </div>
                <h3 className="font-display mt-1 text-xl sm:text-2xl font-bold">{demo.plan.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {formatDateLong(demo.plan.date)}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={13} /> {demo.plan.location}</span>
                  <span className="inline-flex items-center gap-1"><Users size={13} /> {demo.rsvpSummary?.going || 0} going</span>
                </div>
                {demo.plan.muhurat && (
                  <Badge className="mt-2 rounded-full border border-[hsl(var(--utsav-gold))] bg-[hsl(var(--secondary))] text-foreground hover:bg-[hsl(var(--secondary))]">{demo.plan.muhurat}</Badge>
                )}
              </div>
              <Button
                data-testid="landing-view-demo-button"
                onClick={() => navigate(`/e/${demo.slug}`)}
                variant="outline"
                className="rounded-xl border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]"
              >
                View demo event
              </Button>
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Utsav, AI-powered event planning for every Indian celebration.
        </footer>
      </div>
    </div>
  );
}
