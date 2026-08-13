import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * The garden's conditions.
 *
 * Like `lib/maintenance/freshness.ts`, the important part of this module is
 * what it refuses to compute. There is no "thirsty", no "needs attention", no
 * days-late, and nothing that gets worse the longer you leave it.
 *
 * A skill you have not touched in a while is **resting**, not neglected. A
 * perennial left alone does not die; it goes dormant and it comes back, and the
 * moment you record something it wakes. That is the honest version of the
 * garden reacting to time, and it is the only version compatible with a product
 * whose premise is that a slow month still counts.
 *
 * Everything here is pure and takes its clock as an argument, because reading
 * the time during render is an impure render and is already a lint error in
 * this codebase. Components receive a state, never a date.
 */

const DAY = 86_400_000;

/* --- rest ---------------------------------------------------------------- */

export type RestState = "active" | "settling" | "resting";

/**
 * `resting` begins at 21 days, which is deliberately the same threshold as the
 * `the-return` badge. A plant therefore wakes in the very same moment the badge
 * that celebrates coming back is awarded.
 */
export const RESTING_AFTER_DAYS = 21;
const SETTLING_AFTER_DAYS = 14;

export function restStateFor(
  lastActiveAt: Date | null,
  now = new Date(),
): RestState {
  // Never logged is not asleep. A brand new skill has not had the chance.
  if (!lastActiveAt) return "active";

  const days = Math.floor((now.getTime() - lastActiveAt.getTime()) / DAY);
  if (days >= RESTING_AFTER_DAYS) return "resting";
  if (days >= SETTLING_AFTER_DAYS) return "settling";
  return "active";
}

/**
 * How a rest state is described out loud.
 *
 * Scanned by a test against the same decay vocabulary the e2e guards use. The
 * words here say something about time, never about the person: "resting", not
 * "neglected"; nothing "needs" anything.
 */
export const REST_LABEL: Record<RestState, string> = {
  active: "",
  settling: "",
  resting: "resting",
};

/* --- season -------------------------------------------------------------- */

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * From the calendar alone. Nothing the user does can change the season, which
 * is the whole reason it is safe: it makes the garden move without ever being
 * a comment on their behaviour.
 *
 * Northern hemisphere by default. Guessing from a timezone string would be
 * wrong more often than it is right, so this is a stated simplification rather
 * than a silent one, and the fix later is a per-user setting.
 */
export function seasonFor(now = new Date(), timeZone = "UTC"): Season {
  const month = Number(
    new Intl.DateTimeFormat("en-GB", { month: "numeric", timeZone }).format(now),
  );

  if (month <= 2 || month === 12) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

/* --- light --------------------------------------------------------------- */

export type Light = "dawn" | "day" | "dusk" | "night";

export function lightFor(now = new Date(), timeZone = "UTC"): Light {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(now),
  );

  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "dusk";
  return "night";
}

/* --- soil ---------------------------------------------------------------- */

export type Soil = "bare" | "mossy" | "rich";

/**
 * Ground built from evidence.
 *
 * Driven by the number of experiences, which only ever goes up, so the soil can
 * only ever enrich. It is the anti-streak rule made literal: whatever else the
 * garden does, the ground you have built cannot be taken back.
 */
export function soilFor(experienceCount: number): Soil {
  if (experienceCount >= 100) return "rich";
  if (experienceCount >= 25) return "mossy";
  return "bare";
}

/* --- companions ---------------------------------------------------------- */

export type Companion = "none" | "bee" | "bird" | "butterfly" | "all";

/**
 * Life that arrives as a skill deepens, and never leaves. Tied to the highest
 * tier reached, which is itself never revoked.
 */
export function companionFor(tier: MilestoneTier | null): Companion {
  switch (tier) {
    case "BRONZE":
      return "bee";
    case "SILVER":
      return "bird";
    case "GOLD":
      return "butterfly";
    case "MASTERY":
      return "all";
    default:
      return "none";
  }
}

/* --- the bed ------------------------------------------------------------- */

export type GardenConditions = { season: Season; light: Light };

export function gardenConditionsFor(
  now = new Date(),
  timeZone = "UTC",
): GardenConditions {
  return { season: seasonFor(now, timeZone), light: lightFor(now, timeZone) };
}
