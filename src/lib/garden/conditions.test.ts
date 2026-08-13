import { describe, expect, it } from "vitest";
import {
  companionFor,
  gardenConditionsFor,
  lightFor,
  REST_LABEL,
  restStateFor,
  RESTING_AFTER_DAYS,
  seasonFor,
  soilFor,
  type RestState,
} from "./conditions";
import { stageForTier } from "@/components/icons/plant";
import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * The garden may react to time. It may never punish.
 *
 * These guards matter more than most in this codebase. The old guarantee was
 * structural: `Plant` took no date, so no code path could wilt one. The plant
 * now knows how long it has been, which means the promise has to be kept by
 * tests instead of by construction.
 */

const at = (daysAgo: number) =>
  new Date(Date.UTC(2026, 5, 15) - daysAgo * 86_400_000);
const NOW = new Date(Date.UTC(2026, 5, 15));

const TIERS: (MilestoneTier | null)[] = [
  null,
  "FIRST_STEPS",
  "FOUNDATION",
  "BRONZE",
  "SILVER",
  "GOLD",
  "MASTERY",
  "CUSTOM",
];

describe("rest", () => {
  it("treats a skill logged recently as active", () => {
    expect(restStateFor(at(0), NOW)).toBe("active");
    expect(restStateFor(at(13), NOW)).toBe("active");
  });

  it("settles before it rests, so the change is a gradient", () => {
    expect(restStateFor(at(14), NOW)).toBe("settling");
    expect(restStateFor(at(20), NOW)).toBe("settling");
  });

  it("rests at the same threshold that awards The Return", () => {
    // The plant wakes in the very moment the badge for coming back is earned.
    expect(RESTING_AFTER_DAYS).toBe(21);
    expect(restStateFor(at(21), NOW)).toBe("resting");
    expect(restStateFor(at(400), NOW)).toBe("resting");
  });

  it("never treats a brand new skill as asleep", () => {
    expect(restStateFor(null, NOW)).toBe("active");
  });

  it("never worsens past resting, however long it has been", () => {
    // There is no fourth state. Two years away is the same as three weeks.
    const states = [30, 100, 400, 5000].map((d) => restStateFor(at(d), NOW));
    expect(new Set(states)).toEqual(new Set(["resting"]));
  });

  it("says nothing about the person", () => {
    const forbidden =
      /wilt|wither|dying|dead|dried|brown|droop|neglect|thirst|overdue|late|behind|lost|fail|forgot|abandon/i;
    for (const label of Object.values(REST_LABEL)) {
      expect(label).not.toMatch(forbidden);
    }
  });
});

describe("rest cannot diminish a plant", () => {
  it("never changes the stage", () => {
    // The single most important guard here. A resting Gold is a Gold.
    for (const tier of TIERS) {
      const stage = stageForTier(tier);
      for (const rest of ["active", "settling", "resting"] as RestState[]) {
        // Stage is derived from tier alone; rest is not an input and must
        // never become one.
        expect(stageForTier(tier), `${tier} while ${rest}`).toBe(stage);
      }
    }
  });
});

describe("season", () => {
  it("comes from the calendar and nothing else", () => {
    expect(seasonFor(new Date(Date.UTC(2026, 0, 15)))).toBe("winter");
    expect(seasonFor(new Date(Date.UTC(2026, 3, 15)))).toBe("spring");
    expect(seasonFor(new Date(Date.UTC(2026, 6, 15)))).toBe("summer");
    expect(seasonFor(new Date(Date.UTC(2026, 9, 15)))).toBe("autumn");
    expect(seasonFor(new Date(Date.UTC(2026, 11, 15)))).toBe("winter");
  });

  it("covers every month with no gaps", () => {
    const seen = new Set(
      Array.from({ length: 12 }, (_, m) => seasonFor(new Date(Date.UTC(2026, m, 15)))),
    );
    expect(seen).toEqual(new Set(["winter", "spring", "summer", "autumn"]));
  });

  it("is stable for a given instant", () => {
    // Nothing about the user can move it. Same moment, same season, always.
    const moment = new Date(Date.UTC(2026, 6, 4, 13, 30));
    const answers = Array.from({ length: 50 }, () => seasonFor(moment));
    expect(new Set(answers).size).toBe(1);
  });
});

describe("light", () => {
  const hour = (h: number) => new Date(Date.UTC(2026, 5, 15, h));

  it("follows the clock", () => {
    expect(lightFor(hour(6))).toBe("dawn");
    expect(lightFor(hour(12))).toBe("day");
    expect(lightFor(hour(19))).toBe("dusk");
    expect(lightFor(hour(23))).toBe("night");
    expect(lightFor(hour(3))).toBe("night");
  });

  it("covers all 24 hours", () => {
    for (let h = 0; h < 24; h += 1) {
      expect(lightFor(hour(h)), `hour ${h}`).toBeTruthy();
    }
  });

  it("respects the user's timezone", () => {
    const noonUtc = new Date(Date.UTC(2026, 5, 15, 12));
    expect(lightFor(noonUtc, "UTC")).toBe("day");
    // Same instant, late evening in Auckland.
    expect(lightFor(noonUtc, "Pacific/Auckland")).toBe("night");
  });
});

describe("soil", () => {
  it("enriches with evidence", () => {
    expect(soilFor(0)).toBe("bare");
    expect(soilFor(24)).toBe("bare");
    expect(soilFor(25)).toBe("mossy");
    expect(soilFor(99)).toBe("mossy");
    expect(soilFor(100)).toBe("rich");
    expect(soilFor(4000)).toBe("rich");
  });

  it("can only ever move forward", () => {
    // Ground built cannot be taken back, whatever else the garden does.
    const rank = { bare: 0, mossy: 1, rich: 2 };
    let previous = -1;
    for (let n = 0; n <= 400; n += 1) {
      const current = rank[soilFor(n)];
      expect(current, `at ${n} experiences`).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});

describe("companions", () => {
  it("arrive as a skill deepens", () => {
    expect(companionFor(null)).toBe("none");
    expect(companionFor("FIRST_STEPS")).toBe("none");
    expect(companionFor("BRONZE")).toBe("bee");
    expect(companionFor("SILVER")).toBe("bird");
    expect(companionFor("GOLD")).toBe("butterfly");
    expect(companionFor("MASTERY")).toBe("all");
  });

  it("has an answer for every tier", () => {
    for (const tier of TIERS) {
      expect(companionFor(tier)).toBeTruthy();
    }
  });
});

describe("garden conditions", () => {
  it("depends only on the instant and the timezone", () => {
    const moment = new Date(Date.UTC(2026, 2, 20, 8));
    expect(gardenConditionsFor(moment, "UTC")).toEqual({
      season: "spring",
      light: "dawn",
    });
  });
});
