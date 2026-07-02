import { useState } from "react";
import { format } from "date-fns";
import {
  Users, CalendarDays, MapPin, Wallet, Utensils, Music,
  Sparkles, Heart, Home, Baby, Clock, Flame, Check,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatINRCompact } from "@/lib/utsav";

const ICONS = {
  users: Users, calendar: CalendarDays, "map-pin": MapPin, wallet: Wallet,
  utensils: Utensils, music: Music, sparkles: Sparkles, heart: Heart,
  home: Home, baby: Baby, clock: Clock, flame: Flame,
};

const DEFAULT_TIMES = ["10:00 AM", "12:00 PM", "4:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

function Chip({ selected, onClick, children, testId, multi }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-[var(--shadow-sm)] transition-colors active:scale-[0.98] ${
        selected
          ? multi
            ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
            : "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
          : "border-border bg-white hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--secondary))]"
      }`}
    >
      {selected && <Check size={14} />}
      {children}
    </button>
  );
}

function ChipsInput({ card, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {card.options.map((o) => (
        <Chip
          key={o.value}
          testId={`clarify-${card.id}-option-${o.value}`}
          selected={value === o.value}
          onClick={() => onChange(value === o.value ? undefined : o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function MultiselectInput({ card, value = [], onChange }) {
  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {card.options.map((o) => (
        <Chip
          key={o.value}
          multi
          testId={`clarify-${card.id}-option-${o.value}`}
          selected={value.includes(o.value)}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function SliderInput({ card, value, onChange, isBudget }) {
  const min = card.min ?? (isBudget ? 50000 : 10);
  const max = card.max ?? (isBudget ? 5000000 : 1000);
  const step = card.step ?? (isBudget ? 25000 : 10);
  const current = value !== undefined ? Number(value) : Math.round((min + max) / 2);
  return (
    <div className="px-1">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-[hsl(var(--utsav-gold))] bg-[hsl(var(--secondary))] px-3 py-1 text-sm font-semibold">
          {isBudget ? formatINRCompact(current) : current}
        </span>
        <span className="text-xs text-muted-foreground">
          {isBudget ? `${formatINRCompact(min)} - ${formatINRCompact(max)}` : `${min} - ${max}`}
        </span>
      </div>
      <Slider
        data-testid={`clarify-${card.id}-slider`}
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={([v]) => onChange(String(v))}
      />
    </div>
  );
}

function DateInput({ card, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={`clarify-${card.id}-date-trigger`}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-[var(--shadow-sm)] transition-colors ${
            value ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "border-border bg-white hover:bg-[hsl(var(--secondary))]"
          }`}
        >
          <CalendarDays size={15} />
          {value ? format(new Date(`${value}T00:00:00`), "EEE, d MMM yyyy") : "Pick a date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(`${value}T00:00:00`) : undefined}
          onSelect={(d) => {
            if (d) onChange(format(d, "yyyy-MM-dd"));
            setOpen(false);
          }}
          disabled={(d) => d < new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function TimeInput({ card, value, onChange }) {
  const options = card.options?.length ? card.options.map((o) => o.value) : DEFAULT_TIMES;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((t) => (
        <Chip
          key={t}
          testId={`clarify-${card.id}-option-${t.replace(/[\s:]/g, "")}`}
          selected={value === t}
          onClick={() => onChange(value === t ? undefined : t)}
        >
          <Clock size={13} /> {t}
        </Chip>
      ))}
    </div>
  );
}

function renderInput(card, value, onChange) {
  switch (card.inputType) {
    case "chips":
    case "toggle":
      return <ChipsInput card={card} value={value} onChange={onChange} />;
    case "multiselect":
      return <MultiselectInput card={card} value={value} onChange={onChange} />;
    case "budget":
      return card.options?.length ? (
        <ChipsInput card={card} value={value} onChange={onChange} />
      ) : (
        <SliderInput card={card} value={value} onChange={onChange} isBudget />
      );
    case "slider":
      return <SliderInput card={card} value={value} onChange={onChange} />;
    case "date":
      return <DateInput card={card} value={value} onChange={onChange} />;
    case "time":
      return <TimeInput card={card} value={value} onChange={onChange} />;
    default:
      return <ChipsInput card={{ ...card, options: card.options || [] }} value={value} onChange={onChange} />;
  }
}

export function ClarifyingCards({ cards, answers, onChange }) {
  return (
    <div className="flex flex-col gap-3" data-testid="clarifying-cards">
      {cards.map((card, idx) => {
        const Icon = ICONS[card.icon] || Sparkles;
        return (
          <div
            key={card.id}
            className="anim-rise rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-[var(--shadow-card)]"
            style={{ animationDelay: `${idx * 80}ms` }}
            data-testid={`clarifying-card-${card.id}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                <Icon size={15} />
              </span>
              <p className="font-semibold tracking-[-0.01em]">{card.question}</p>
            </div>
            {renderInput(card, answers[card.id], (v) => onChange(card.id, v))}
          </div>
        );
      })}
    </div>
  );
}

export function answersSummary(cards, answers) {
  const parts = [];
  cards.forEach((c) => {
    const v = answers[c.id];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    const labelOf = (val) => c.options?.find((o) => o.value === val)?.label || val;
    if (Array.isArray(v)) parts.push(v.map(labelOf).join(", "));
    else if (c.inputType === "budget" && !c.options?.length) parts.push(formatINRCompact(Number(v)));
    else parts.push(labelOf(v));
  });
  return parts.join(" · ");
}
