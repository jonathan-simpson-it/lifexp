/**
 * Maintenance freshness.
 *
 * The whole point of this module is what it refuses to compute. There is no
 * "overdue" boolean, no days-late number, no failure count, and no streak. An
 * item that has not been done in a while is simply *faded*, the gradient runs
 * from fresh to faded and stops there.
 *
 * Pure and dependency-free so a test can assert the vocabulary directly.
 */

const DAY = 86_400_000;

export type FreshnessTone = "fresh" | "settling" | "aging" | "distant";

export type Freshness = {
  daysSince: number | null;
  /** 0 = just done, 1 = at or beyond the user's own interval. Bar width. */
  fraction: number;
  tone: FreshnessTone;
  /** "12 days ago", "today", "never". Never mentions lateness. */
  label: string;
};

/** Human day count. Same-day counts as "today", not "0 days ago". */
export function describeDaysSince(daysSince: number | null): string {
  if (daysSince === null) return "not yet logged";
  if (daysSince <= 0) return "today";
  if (daysSince === 1) return "yesterday";
  return `${daysSince} days ago`;
}

export function freshnessFor(
  lastDoneAt: Date | null,
  intervalDays: number,
  now = new Date(),
): Freshness {
  if (!lastDoneAt) {
    return {
      daysSince: null,
      fraction: 1,
      tone: "distant",
      label: describeDaysSince(null),
    };
  }

  const daysSince = Math.max(
    0,
    Math.floor((now.getTime() - lastDoneAt.getTime()) / DAY),
  );

  const interval = Math.max(intervalDays, 1);
  const ratio = daysSince / interval;
  const fraction = Math.min(Math.max(ratio, 0), 1);

  // Descriptive, not evaluative. "distant" is as strong as the language gets:
  // it says something about time, not about the person.
  const tone: FreshnessTone =
    ratio < 0.5 ? "fresh" : ratio < 0.85 ? "settling" : ratio < 1 ? "aging" : "distant";

  return { daysSince, fraction, tone, label: describeDaysSince(daysSince) };
}

export type MaintenanceCard = {
  id: string;
  name: string;
  intervalDays: number;
  lastDoneAt: Date | null;
  freshness: Freshness;
};

/**
 * Most faded first, so the answer to "what could use attention?" is just the
 * top of the list, without the app ever having to say anything is wrong.
 */
export function sortByFaded(cards: MaintenanceCard[]): MaintenanceCard[] {
  return [...cards].sort((a, b) => {
    if (b.freshness.fraction !== a.freshness.fraction) {
      return b.freshness.fraction - a.freshness.fraction;
    }
    return (b.freshness.daysSince ?? 0) - (a.freshness.daysSince ?? 0);
  });
}
