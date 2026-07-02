import { MessageCircle, Navigation, CalendarPlus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { whatsappShareLink, mapsLink, calendarLink, eventUrl } from "@/lib/utsav";

export function StickyShareBar({ event }) {
  const plan = event.plan;
  const wa = whatsappShareLink(plan, event.slug);
  const maps = plan.location ? mapsLink(plan.location) : null;
  const gcal = calendarLink({
    title: `${plan.emoji || ""} ${plan.title}`.trim(),
    date: plan.date,
    time: plan.time,
    details: plan.description,
    location: plan.location,
  });

  function copyLink() {
    navigator.clipboard
      .writeText(eventUrl(event.slug))
      .then(() => toast.success("Link copied. Share away!"))
      .catch(() => toast.error("Could not copy link"));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur" data-testid="event-share-bar">
      <div className="mx-auto flex w-full max-w-[1100px] items-center gap-2 px-4 py-3 sm:px-6">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
          <Button
            data-testid="event-share-whatsapp-button"
            className="w-full rounded-xl gap-2 bg-[#1DA851] px-5 font-semibold text-white shadow-[var(--shadow-md)] hover:bg-[#178a43]"
          >
            <MessageCircle size={16} /> Invite on WhatsApp
          </Button>
        </a>
        {maps && (
          <a href={maps} target="_blank" rel="noopener noreferrer">
            <Button data-testid="event-directions-button" variant="outline" className="rounded-xl gap-1.5 border-border bg-white hover:bg-[hsl(var(--secondary))]">
              <Navigation size={15} />
              <span className="hidden sm:inline">Directions</span>
            </Button>
          </a>
        )}
        {gcal && (
          <a href={gcal} target="_blank" rel="noopener noreferrer">
            <Button data-testid="event-calendar-button" variant="outline" className="rounded-xl gap-1.5 border-border bg-white hover:bg-[hsl(var(--secondary))]">
              <CalendarPlus size={15} />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </a>
        )}
        <Button data-testid="event-copy-link-button" variant="ghost" onClick={copyLink} className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground">
          <Link2 size={15} />
          <span className="hidden sm:inline">Copy link</span>
        </Button>
      </div>
    </div>
  );
}
