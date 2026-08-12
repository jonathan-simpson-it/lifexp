import { describe, expect, it } from "vitest";
import { bucketByDay, summariseWeek } from "./summarise";

const NOW = new Date("2026-08-12T12:00:00.000Z");
const DAY = 86_400_000;

function ago(days: number) {
  return new Date(NOW.getTime() - days * DAY);
}

function exp(
  id: string,
  days: number,
  minutes: number | null,
  skillIds: string[],
) {
  return {
    id,
    title: id,
    notes: null,
    occurredAt: ago(days),
    minutes,
    skills: skillIds.map((skillId) => ({ skillId })),
  };
}

describe("weekly summary", () => {
  it("counts only the last seven days", () => {
    const week = summariseWeek(
      [exp("a", 1, 60, ["s1"]), exp("b", 9, 60, ["s1"])],
      NOW,
    );

    expect(week.experienceCount).toBe(1);
    expect(week.minutes).toBe(60);
  });

  /**
   * The subtle rule from the schema: an experience's full duration counts
   * toward each of its skills, but a cross-skill experience is still only one
   * chunk of the person's actual week.
   */
  it("does not double-count a two-skill experience in the total", () => {
    const week = summariseWeek([exp("a", 1, 75, ["japanese", "reading"])], NOW);

    expect(week.minutes).toBe(75);
    expect(week.experienceCount).toBe(1);
    expect(week.skillCount).toBe(2);
  });

  it("counts distinct skills, not links", () => {
    const week = summariseWeek(
      [
        exp("a", 1, 30, ["s1"]),
        exp("b", 2, 30, ["s1"]),
        exp("c", 3, 30, ["s2"]),
      ],
      NOW,
    );

    expect(week.skillCount).toBe(2);
    expect(week.experienceCount).toBe(3);
  });

  it("treats a missing duration as zero minutes but still an experience", () => {
    const week = summariseWeek([exp("a", 1, null, ["s1"])], NOW);

    expect(week.minutes).toBe(0);
    expect(week.experienceCount).toBe(1);
  });

  it("reports an empty week without inventing anything", () => {
    expect(summariseWeek([], NOW)).toEqual({
      skillCount: 0,
      minutes: 0,
      experienceCount: 0,
    });
  });
});

describe("heatmap bucketing", () => {
  it("returns one bucket per day, oldest first", () => {
    const buckets = bucketByDay([ago(1)], 7, NOW);

    expect(buckets).toHaveLength(7);
    expect(buckets[0].date.getTime()).toBeLessThan(buckets[6].date.getTime());
  });

  it("groups several experiences on the same day", () => {
    const buckets = bucketByDay([ago(1), ago(1), ago(1)], 7, NOW);
    const total = buckets.reduce((sum, b) => sum + b.count, 0);

    expect(total).toBe(3);
    expect(Math.max(...buckets.map((b) => b.count))).toBe(3);
  });

  it("leaves empty days at zero rather than omitting them", () => {
    const buckets = bucketByDay([], 14, NOW);

    expect(buckets).toHaveLength(14);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("ignores activity older than the window", () => {
    const buckets = bucketByDay([ago(100)], 7, NOW);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(0);
  });
});
