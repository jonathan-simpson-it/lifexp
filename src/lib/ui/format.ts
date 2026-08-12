import type { MilestoneTier } from "@/lib/progress/milestones";

/** Stable per-skill colour, derived from the seed stored on the row. */
export function skillColor(colorSeed: number, opts: { soft?: boolean } = {}) {
  const hue = colorSeed % 360;
  return opts.soft
    ? `oklch(0.93 0.035 ${hue})`
    : `oklch(0.58 0.09 ${hue})`;
}

export const TIER_COLOR: Record<MilestoneTier, string> = {
  FIRST_STEPS: "var(--tier-first-steps)",
  FOUNDATION: "var(--tier-foundation)",
  BRONZE: "var(--tier-bronze)",
  SILVER: "var(--tier-silver)",
  GOLD: "var(--tier-gold)",
  MASTERY: "var(--tier-mastery)",
  CUSTOM: "var(--medal)",
};

/** "1.5h", "327h", "45m", "—" for nothing recorded. */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  return hours >= 100 ? `${Math.round(hours)}h` : `${Number(hours.toFixed(1))}h`;
}

/** Relative day label, always gentle: "today", "yesterday", "12 days ago". */
export function relativeDay(date: Date, now = new Date()): string {
  const startOf = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "a month ago" : `${months} months ago`;
  }
  const years = Math.round(days / 365);
  return years === 1 ? "a year ago" : `${years} years ago`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const DATE_FMT_WITH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(date: Date, now = new Date()): string {
  const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
  return sameYear ? DATE_FMT.format(date) : DATE_FMT_WITH_YEAR.format(date);
}

/** Groups timeline entries under "Today" / "Yesterday" / a date. */
export function dayHeading(date: Date, now = new Date()): string {
  const relative = relativeDay(date, now);
  if (relative === "today") return "Today";
  if (relative === "yesterday") return "Yesterday";
  return formatDate(date, now);
}
