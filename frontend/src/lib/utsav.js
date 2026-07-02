// Utsav shared helpers — API base, INR formatting, share-link builders
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export function formatINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatINRCompact(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n % 1e7 === 0 ? 0 : 1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n % 1e5 === 0 ? 0 : 1)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}k`;
  return formatINR(n);
}

export function formatDateLong(iso) {
  if (!iso) return "";
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function eventUrl(slug) {
  return `${window.location.origin}/e/${slug}`;
}

export function whatsappShareLink(plan, slug) {
  const text = [
    `${plan.emoji || "\u{1F389}"} You're invited to *${plan.title}*!`,
    plan.date ? `\u{1F4C5} ${formatDateLong(plan.date)}${plan.time ? ` \u00b7 ${plan.time}` : ""}` : null,
    plan.muhurat ? `\u{1F549} ${plan.muhurat}` : null,
    plan.location ? `\u{1F4CD} ${plan.location}` : null,
    "",
    `RSVP & full details \u{1F447}`,
    eventUrl(slug),
  ]
    .filter((l) => l !== null)
    .join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mapsLink(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || "")}`;
}

export function calendarLink({ title, date, time, details, location }) {
  if (!date) return null;
  const clean = date.replace(/-/g, "");
  let dates = `${clean}/${clean}`;
  if (time) {
    // parse "7:00 PM" style
    const m = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      const ap = (m[3] || "").toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      const start = `${clean}T${String(h).padStart(2, "0")}${String(min).padStart(2, "0")}00`;
      const endH = Math.min(h + 3, 23);
      const end = `${clean}T${String(endH).padStart(2, "0")}${String(min).padStart(2, "0")}00`;
      dates = `${start}/${end}`;
    }
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Utsav Event",
    dates,
    details: details || "Planned with Utsav \u2014 Bolo idea. Utsav banaye mehfil.",
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
