export const DEFAULT_PREFS = {
  theme: "light",
  font_size: "medium",
  high_contrast: false,
  dyslexic_font: false,
  language: "en",
  timezone: "Asia/Manila",
  date_format: "MM/DD/YYYY",
  time_format: "12",
};

export const FONT_ZOOM = { small: 0.92, medium: 1, large: 1.08, xlarge: 1.16 };

export const TIMEZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

function parts(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const out = {};
  formatter.formatToParts(date).forEach((part) => {
    if (part.type !== "literal") out[part.type] = part.value;
  });
  return out;
}

export function formatDate(value, prefs = DEFAULT_PREFS) {
  if (!value) return "—";
  const p = parts(value, prefs.timezone || "Asia/Manila");
  if (!p) return "—";
  if (prefs.date_format === "DD/MM/YYYY") return `${p.day}/${p.month}/${p.year}`;
  if (prefs.date_format === "YYYY/MM/DD") return `${p.year}/${p.month}/${p.day}`;
  return `${p.month}/${p.day}/${p.year}`;
}

export function formatTime(value, prefs = DEFAULT_PREFS) {
  if (!value) return "—";
  const p = parts(value, prefs.timezone || "Asia/Manila");
  if (!p) return "—";
  if (prefs.time_format === "24") return `${p.hour}:${p.minute}`;
  const hour = Number(p.hour);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${p.minute} ${suffix}`;
}

export function formatDateTime(value, prefs = DEFAULT_PREFS) {
  if (!value) return "—";
  return `${formatDate(value, prefs)} · ${formatTime(value, prefs)}`;
}

export function dayLabel(value, prefs = DEFAULT_PREFS) {
  if (!value) return "—";
  const p = parts(value, prefs.timezone || "Asia/Manila");
  if (!p) return "—";
  return `${p.month}/${p.day}`;
}
