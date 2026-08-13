import { describe, expect, it } from "vitest";
import { evaluateAwards } from "./award-engine";
import { BADGES, type AwardSnapshot, type SnapshotExperience } from "./badges";

const NOW = new Date("2026-08-12T12:00:00.000Z");
const DAY = 86_400_000;

function daysBefore(days: number, hourUtc = 12): Date {
  const d = new Date(NOW.getTime() - days * DAY);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hourUtc),
  );
}

function experience(
  overrides: Partial<SnapshotExperience> & { occurredAt: Date },
): SnapshotExperience {
  return {
    id: Math.random().toString(36).slice(2),
    minutes: 60,
    hasNotes: false,
    skillIds: ["skill-a"],
    ...overrides,
  };
}

function snapshot(overrides: Partial<AwardSnapshot> = {}): AwardSnapshot {
  return {
    now: NOW,
    timezone: "UTC",
    experiences: [],
    maintenanceLogCount: 0,
    achievedMilestoneCount: 0,
    ...overrides,
  };
}

function keys(snap: AwardSnapshot, held: string[] = []) {
  return evaluateAwards(snap, held).map((a) => a.badgeKey);
}

describe("award engine", () => {
  it("awards nothing for an empty life", () => {
    expect(keys(snapshot())).toEqual([]);
  });

  it("never awards the same badge twice", () => {
    const snap = snapshot({
      experiences: [experience({ occurredAt: daysBefore(1) })],
    });

    expect(keys(snap)).toContain("first-experience");
    expect(keys(snap, ["first-experience"])).not.toContain("first-experience");
  });

  it("survives a badge predicate that throws", () => {
    // A buggy badge must not take the user's write down with it.
    const broken = BADGES.find((b) => b.key === "polymath")!;
    const original = broken.earned;
    broken.earned = () => {
      throw new Error("boom");
    };

    try {
      const snap = snapshot({
        experiences: [experience({ occurredAt: daysBefore(1) })],
      });
      expect(keys(snap)).toContain("first-experience");
    } finally {
      broken.earned = original;
    }
  });

  describe("boundaries", () => {
    it("deep-diver fires at exactly four hours, not below", () => {
      const under = snapshot({
        experiences: [experience({ occurredAt: daysBefore(1), minutes: 239 })],
      });
      const at = snapshot({
        experiences: [experience({ occurredAt: daysBefore(1), minutes: 240 })],
      });

      expect(keys(under)).not.toContain("deep-diver");
      expect(keys(at)).toContain("deep-diver");
    });

    it("hundred-hours fires at exactly 100 hours", () => {
      const make = (count: number) =>
        snapshot({
          experiences: Array.from({ length: count }, (_, i) =>
            experience({ occurredAt: daysBefore(i + 1), minutes: 60 }),
          ),
        });

      expect(keys(make(99))).not.toContain("hundred-hours");
      expect(keys(make(100))).toContain("hundred-hours");
    });

    it("the-return fires at a 21 day gap, not 20", () => {
      const withGap = (gap: number) =>
        snapshot({
          experiences: [
            experience({ occurredAt: daysBefore(gap + 1) }),
            experience({ occurredAt: daysBefore(1) }),
          ],
        });

      expect(keys(withGap(20))).not.toContain("the-return");
      expect(keys(withGap(21))).toContain("the-return");
    });

    it("polymath needs three skills inside one week", () => {
      const spread = snapshot({
        experiences: [
          experience({ occurredAt: daysBefore(20), skillIds: ["a"] }),
          experience({ occurredAt: daysBefore(10), skillIds: ["b"] }),
          experience({ occurredAt: daysBefore(1), skillIds: ["c"] }),
        ],
      });
      const together = snapshot({
        experiences: [
          experience({ occurredAt: daysBefore(5), skillIds: ["a"] }),
          experience({ occurredAt: daysBefore(3), skillIds: ["b"] }),
          experience({ occurredAt: daysBefore(1), skillIds: ["c"] }),
        ],
      });

      expect(keys(spread)).not.toContain("polymath");
      expect(keys(together)).toContain("polymath");
    });
  });

  describe("quiet-month", () => {
    it("celebrates a completed month with only one or two experiences", () => {
      const snap = snapshot({
        experiences: [
          // A single experience in July, a completed month.
          experience({ occurredAt: new Date("2026-07-14T12:00:00.000Z") }),
          experience({ occurredAt: daysBefore(1) }),
        ],
      });

      expect(keys(snap)).toContain("quiet-month");
    });

    it("ignores the month currently underway", () => {
      // Only August activity: the month isn't over, so calling it quiet would
      // be telling someone they've failed a month that is still happening.
      const snap = snapshot({
        experiences: [experience({ occurredAt: daysBefore(1) })],
      });

      expect(keys(snap)).not.toContain("quiet-month");
    });

    it("does not fire for a busy completed month", () => {
      const snap = snapshot({
        experiences: [
          experience({ occurredAt: new Date("2026-07-05T12:00:00.000Z") }),
          experience({ occurredAt: new Date("2026-07-15T12:00:00.000Z") }),
          experience({ occurredAt: new Date("2026-07-25T12:00:00.000Z") }),
        ],
      });

      expect(keys(snap)).not.toContain("quiet-month");
    });
  });

  describe("hour-of-day badges respect the user's timezone", () => {
    it("counts 23:00 in Tokyo as night, not the UTC afternoon", () => {
      // 14:00 UTC is 23:00 in Tokyo.
      const experiences = Array.from({ length: 10 }, (_, i) =>
        experience({ occurredAt: daysBefore(i + 1, 14) }),
      );

      expect(keys(snapshot({ experiences, timezone: "UTC" }))).not.toContain(
        "night-owl",
      );
      expect(keys(snapshot({ experiences, timezone: "Asia/Tokyo" }))).toContain(
        "night-owl",
      );
    });
  });

  /**
   * The product guarantee, asserted rather than assumed. If someone ever adds a
   * streak badge, this fails.
   */
  describe("no streak mechanics", () => {
    it("does not reward consecutive days", () => {
      const consecutive = snapshot({
        experiences: Array.from({ length: 30 }, (_, i) =>
          experience({ occurredAt: daysBefore(i + 1) }),
        ),
      });
      const scattered = snapshot({
        experiences: Array.from({ length: 30 }, (_, i) =>
          experience({ occurredAt: daysBefore(i * 3 + 1) }),
        ),
      });

      // Every badge earned by showing up daily is also reachable by showing up
      // irregularly, nothing is gated on the days being consecutive.
      const dailyOnly = keys(consecutive).filter((k) => !keys(scattered).includes(k));
      expect(dailyOnly).toEqual([]);
    });

    it("has no badge whose name or copy promises a streak", () => {
      for (const badge of BADGES) {
        const copy = `${badge.key} ${badge.title} ${badge.description} ${badge.hint ?? ""}`;
        expect(copy).not.toMatch(/streak|consecutive|every day|don't break|keep it up/i);
      }
    });
  });
});
