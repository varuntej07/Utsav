import { useEffect, useState } from "react";
import axios from "axios";
import { Star, MapPin, Heart, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API } from "@/lib/utsav";

export function VendorsModule({ event }) {
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlisted, setShortlisted] = useState(event.shortlistedVendors || []);

  useEffect(() => {
    fetchVendors(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.slug]);

  async function fetchVendors(cat) {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/events/${event.slug}/vendors`, { params: cat ? { category: cat } : {} });
      setCategory(data.category);
      setCategories(data.categories);
      setVendors(data.vendors);
    } catch {
      toast.error("Vendors load nahi hue — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleShortlist(vendor) {
    const isShortlisted = shortlisted.some((v) => v.id === vendor.id);
    const next = isShortlisted ? shortlisted.filter((v) => v.id !== vendor.id) : [...shortlisted, { ...vendor, shortlisted: true }];
    setShortlisted(next);
    try {
      await axios.post(`${API}/events/${event.slug}/vendors/shortlist`, { vendor, shortlisted: !isShortlisted });
      toast.success(isShortlisted ? "Removed from shortlist" : `${vendor.name} shortlisted!`);
    } catch {
      setShortlisted(shortlisted);
      toast.error("Could not update shortlist");
    }
  }

  const isShortlistedId = (id) => shortlisted.some((v) => v.id === id);

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[var(--shadow-card)]" data-testid="module-vendors">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-[-0.01em]">Vendor Shortlist</h3>
        <span className="text-xs text-muted-foreground">{shortlisted.length} shortlisted · near {event.plan.location}</span>
      </div>

      {categories.length > 0 && (
        <Tabs value={category || ""} onValueChange={(v) => fetchVendors(v)}>
          <TabsList className="mb-4 flex h-auto w-full justify-start gap-1 overflow-x-auto scrollbar-hide bg-[hsl(var(--muted))] p-1">
            {categories.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                data-testid={`vendors-tab-${c.key}`}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))]"
              >
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl poster-shimmer" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No vendors found for this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vendors.map((v) => {
            const sl = isShortlistedId(v.id);
            return (
              <div
                key={v.id}
                className={`rounded-xl border p-4 transition-colors ${sl ? "border-[hsl(var(--utsav-gold))] bg-[hsl(38_92%_55%/0.07)]" : "border-border bg-white"}`}
                data-testid={`vendor-card-${v.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm">{v.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin size={10} className="shrink-0" /> {v.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={`vendor-shortlist-${v.id}`}
                    onClick={() => toggleShortlist(v)}
                    aria-label="Shortlist vendor"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                      sl ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white" : "border-border bg-white text-muted-foreground hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                    }`}
                  >
                    <Heart size={15} fill={sl ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {v.rating && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star size={12} className="fill-[hsl(var(--utsav-gold))] text-[hsl(var(--utsav-gold))]" />
                      {v.rating} {v.ratingCount ? <span className="text-muted-foreground">({v.ratingCount})</span> : null}
                    </span>
                  )}
                  <span className="font-medium text-[hsl(var(--primary))]">{v.priceRange}</span>
                  {v.mapsUri && (
                    <a href={v.mapsUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground">
                      Map <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        {vendors[0]?.source === "google_places" ? "Live results via Google Places" : "Curated suggestions — live lookup unavailable right now"}
      </p>
    </section>
  );
}
