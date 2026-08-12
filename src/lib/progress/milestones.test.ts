import { describe, expect, it } from "vitest";
import {
  formatHours,
  isMilestoneMet,
  ladderFor,
  nextMilestone,
  pickTemplate,
  type MilestoneRow,
} from "./milestones";

function milestone(
  order: number,
  overrides: Partial<MilestoneRow> = {},
): MilestoneRow {
  return {
    id: `m${order}`,
    label: `Step ${order}`,
    tier: "BRONZE",
    order,
    thresholdMinutes: null,
    thresholdCount: null,
    achievedAt: null,
    ...overrides,
  };
}

const HOURS_LADDER: MilestoneRow[] = [
  milestone(0, { thresholdMinutes: 10 * 60, label: "First Steps" }),
  milestone(1, { thresholdMinutes: 50 * 60, label: "Foundation" }),
  milestone(2, { thresholdMinutes: 150 * 60, label: "Bronze" }),
];

describe("templates", () => {
  it("recognises a language and gives it the PRD's ladder", () => {
    expect(pickTemplate("Japanese")?.key).toBe("language");

    const hours = ladderFor("Japanese").map((step) => step.hours);
    expect(hours).toContain(150);
    expect(hours).toContain(400);
    expect(hours).toContain(1300);
  });

  it("counts music in sessions rather than hours", () => {
    const ladder = ladderFor("Piano");
    expect(ladder.every((step) => step.sessions && !step.hours)).toBe(true);
  });

  it("falls back to the generic ladder for something unrecognised", () => {
    expect(pickTemplate("Beekeeping")).toBeNull();
    expect(ladderFor("Beekeeping")[0].hours).toBe(10);
  });

  it("matches case-insensitively", () => {
    expect(pickTemplate("PIANO")?.key).toBe("music");
    expect(pickTemplate("learning japanese")?.key).toBe("language");
  });
});

describe("meeting a milestone", () => {
  it("compares minutes when the threshold is in minutes", () => {
    const m = milestone(0, { thresholdMinutes: 600 });
    expect(isMilestoneMet(m, { totalMinutes: 599, experienceCount: 99 })).toBe(false);
    expect(isMilestoneMet(m, { totalMinutes: 600, experienceCount: 0 })).toBe(true);
  });

  it("compares count when the threshold is a session count", () => {
    const m = milestone(0, { thresholdCount: 10 });
    expect(isMilestoneMet(m, { totalMinutes: 99_999, experienceCount: 9 })).toBe(false);
    expect(isMilestoneMet(m, { totalMinutes: 0, experienceCount: 10 })).toBe(true);
  });

  it("never auto-completes a custom goal", () => {
    // "Ski intermediate slopes confidently" is not something hours can prove.
    const m = milestone(0);
    expect(isMilestoneMet(m, { totalMinutes: 1_000_000, experienceCount: 999 })).toBe(
      false,
    );
  });
});

describe("progress toward the next milestone", () => {
  it("measures from the previous milestone, not from zero", () => {
    // 100h sits a quarter of the way from Foundation (50h) to Bronze (150h).
    const { next, fraction } = nextMilestone(HOURS_LADDER, {
      totalMinutes: 100 * 60,
      experienceCount: 20,
    });

    expect(next?.label).toBe("Bronze");
    expect(fraction).toBeCloseTo(0.5);
  });

  it("reports remaining distance in human units", () => {
    const { remainingLabel } = nextMilestone(HOURS_LADDER, {
      totalMinutes: 20 * 60,
      experienceCount: 5,
    });
    expect(remainingLabel).toBe("30h to go");
  });

  it("uses sessions when the ladder counts sessions", () => {
    const ladder = [milestone(0, { thresholdCount: 10, label: "First Steps" })];
    const { remainingLabel } = nextMilestone(ladder, {
      totalMinutes: 0,
      experienceCount: 9,
    });
    expect(remainingLabel).toBe("1 session to go");
  });

  it("saturates once every milestone is behind you", () => {
    const { next, fraction, remainingLabel } = nextMilestone(HOURS_LADDER, {
      totalMinutes: 500 * 60,
      experienceCount: 500,
    });

    expect(next).toBeNull();
    expect(fraction).toBe(1);
    expect(remainingLabel).toBeNull();
  });

  it("ignores custom milestones when picking the next measurable step", () => {
    const withCustom = [...HOURS_LADDER, milestone(3, { label: "Feel fluent" })];
    const { next } = nextMilestone(withCustom, {
      totalMinutes: 200 * 60,
      experienceCount: 50,
    });
    expect(next).toBeNull();
  });
});

describe("formatting hours", () => {
  it("keeps small durations in minutes", () => {
    expect(formatHours(45)).toBe("45m");
  });

  it("shows one decimal place until three figures", () => {
    expect(formatHours(90)).toBe("1.5h");
    expect(formatHours(60)).toBe("1h");
  });

  it("drops the decimal once it would be noise", () => {
    expect(formatHours(19_800)).toBe("330h");
  });
});
