import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * Stable per-skill colour, derived from the seed stored on the row.
 *
 * Every skill is a variant of the one sage hue rather than a point on the full
 * colour wheel. Skills still need to be told apart — the calendar draws a dot
 * per skill and the garden tints each plant — but a rainbow of arbitrary hues
 * made those the loudest thing on screen and contradicted a palette that is
 * meant to be a single colour.
 *
 * Differentiation comes mostly from **lightness**, which separates cleanly
 * within one hue family; the small hue drift (148–187) just stops neighbouring
 * skills looking like the same paint at different opacity. Low chroma keeps the
 * whole set reading as sage.
 */
export function skillColor(colorSeed: number, opts: { soft?: boolean } = {}) {
  const seed = Math.abs(colorSeed);
  const hue = 148 + (seed % 40);
  // Two different reductions of the seed so hue and lightness do not move
  // together, which would collapse the set back onto one visual axis.
  const lightness = 0.44 + (((seed * 7) % 26) / 100);

  return opts.soft
    ? `oklch(0.93 0.022 ${hue})`
    : `oklch(${lightness.toFixed(3)} 0.055 ${hue})`;
}

/**
 * The distance to a milestone, as a bare quantity: "70.1h", "81 sessions".
 *
 * Deliberately without the trailing "to go" that `remainingLabel` carries,
 * because every place this appears already says where it is going —
 * "70.1h to Elementary". Using the label there produced "70.1h to go to
 * Elementary", which is what shipped until someone read it out loud.
 */
export function formatRemaining(
  remaining: number | null,
  unit: "minutes" | "sessions" | null,
): string | null {
  if (remaining === null || unit === null) return null;
  if (unit === "sessions") {
    return `${remaining} ${remaining === 1 ? "session" : "sessions"}`;
  }
  return formatDuration(remaining);
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
