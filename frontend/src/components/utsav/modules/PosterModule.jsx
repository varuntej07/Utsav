import { useState } from "react";
import axios from "axios";
import { ImageIcon, Download, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API, BACKEND_URL } from "@/lib/utsav";

export function PosterModule({ event, onUpdate }) {
  const [generating, setGenerating] = useState(false);
  const posterUrl = event.posterUrl ? `${BACKEND_URL}${event.posterUrl}` : null;

  async function generate() {
    setGenerating(true);
    try {
      const { data } = await axios.post(`${API}/events/${event.slug}/poster`, {}, { timeout: 120000 });
      onUpdate?.({ ...event, posterUrl: data.posterUrl });
      toast.success("Poster ready! Kitna sundar laga?");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Poster generation failed — try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]" data-testid="module-poster">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">AI Invitation Poster</h3>
        {posterUrl && !generating && (
          <button
            type="button"
            data-testid="poster-regenerate-button"
            onClick={generate}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw size={12} /> Regenerate
          </button>
        )}
      </div>

      {generating ? (
        <div className="flex aspect-[3/4] max-h-[440px] w-full flex-col items-center justify-center gap-3 rounded-xl poster-shimmer" data-testid="poster-generating">
          <Sparkles size={22} className="text-[hsl(var(--primary))]" />
          <p className="px-6 text-center text-sm font-medium text-foreground/70">
            Utsav is painting your poster… takes ~30 seconds
          </p>
        </div>
      ) : posterUrl ? (
        <div>
          <img
            src={posterUrl}
            alt={`Poster for ${event.plan.title}`}
            data-testid="poster-image"
            className="mx-auto max-h-[440px] w-auto rounded-xl object-contain shadow-[var(--shadow-md)]"
          />
          <div className="mt-4 flex justify-center">
            <a href={posterUrl} download={`${event.slug}-poster`} target="_blank" rel="noopener noreferrer">
              <Button data-testid="poster-download-button" variant="outline" className="rounded-xl gap-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]">
                <Download size={15} /> Download poster
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="flex aspect-[3/4] max-h-[440px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[hsl(var(--utsav-gold))] bg-[hsl(38_92%_55%/0.06)]">
          <ImageIcon size={26} className="text-[hsl(var(--utsav-gold))]" />
          <p className="max-w-[240px] px-4 text-center text-sm text-muted-foreground">
            Generate a shareable AI poster with your event name, date & theme.
          </p>
          <Button
            data-testid="poster-generate-button"
            onClick={generate}
            className="rounded-xl gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] hover:bg-[hsl(var(--primary))]/90"
          >
            <Sparkles size={15} /> Generate Poster
          </Button>
        </div>
      )}
    </section>
  );
}
