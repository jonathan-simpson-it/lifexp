import { describe, expect, it } from "vitest";
import {
  describeDaysSince,
  freshnessFor,
  sortByFaded,
  type MaintenanceCard,
} from "./freshness";

const NOW = new Date("2026-08-12T12:00:00.000Z");
const DAY = 86_400_000;

function ago(days: number) {
  return new Date(NOW.getTime() - days * DAY);
}

describe("freshness", () => {
  it("reads today, yesterday, then a plain count", () => {
    expect(freshnessFor(ago(0), 7, NOW).label).toBe("today");
    expect(freshnessFor(ago(1), 7, NOW).label).toBe("yesterday");
    expect(freshnessFor(ago(12), 14, NOW).label).toBe("12 days ago");
    expect(describeDaysSince(null)).toBe("not yet logged");
  });

  it("fills the bar in proportion to the user's own interval", () => {
    expect(freshnessFor(ago(0), 10, NOW).fraction).toBe(0);
    expect(freshnessFor(ago(5), 10, NOW).fraction).toBeCloseTo(0.5);
    expect(freshnessFor(ago(10), 10, NOW).fraction).toBe(1);
  });

  /**
   * The important one. Going far past the interval must saturate, never
   * overflow into a growing overdue quantity — there is no such measure in
   * this product.
   */
  it("caps at full instead of overflowing", () => {
    expect(freshnessFor(ago(300), 7, NOW).fraction).toBe(1);
    expect(freshnessFor(ago(3000), 7, NOW).fraction).toBe(1);
  });

  it("steps through tones without ever reaching an alarm state", () => {
    expect(freshnessFor(ago(1), 10, NOW).tone).toBe("fresh");
    expect(freshnessFor(ago(6), 10, NOW).tone).toBe("settling");
    expect(freshnessFor(ago(9), 10, NOW).tone).toBe("aging");
    expect(freshnessFor(ago(40), 10, NOW).tone).toBe("distant");
  });

  it("handles an item that has never been logged", () => {
    const fresh = freshnessFor(null, 7, NOW);
    expect(fresh.daysSince).toBeNull();
    expect(fresh.label).toBe("not yet logged");
  });

  it("tolerates a nonsense interval without dividing by zero", () => {
    expect(freshnessFor(ago(3), 0, NOW).fraction).toBe(1);
    expect(Number.isFinite(freshnessFor(ago(3), -5, NOW).fraction)).toBe(true);
  });

  /**
   * The vocabulary guarantee. If someone later adds "overdue" to a label, this
   * fails — which is the point.
   */
  it("never uses punitive language", () => {
    const forbidden = /overdue|late|missed|failed|behind|due|expired|neglect/i;

    for (const days of [0, 1, 3, 7, 14, 30, 90, 365]) {
      for (const interval of [1, 3, 7, 14, 30]) {
        const fresh = freshnessFor(ago(days), interval, NOW);
        expect(`${fresh.label} ${fresh.tone}`).not.toMatch(forbidden);
      }
    }
  });
});

describe("ordering", () => {
  it("puts the most faded first so the top of the list is the answer", () => {
    const card = (name: string, days: number, interval: number): MaintenanceCard => ({
      id: name,
      name,
      intervalDays: interval,
      lastDoneAt: ago(days),
      freshness: freshnessFor(ago(days), interval, NOW),
    });

    const sorted = sortByFaded([
      card("gym", 1, 3),
      card("bedsheets", 13, 14),
      card("vacuum", 30, 7),
    ]);

    expect(sorted.map((c) => c.name)).toEqual(["vacuum", "bedsheets", "gym"]);
  });

  it("breaks ties between saturated items by how long it has been", () => {
    const card = (name: string, days: number): MaintenanceCard => ({
      id: name,
      name,
      intervalDays: 7,
      lastDoneAt: ago(days),
      freshness: freshnessFor(ago(days), 7, NOW),
    });

    // Both are at fraction 1; the older one should still sort first.
    const sorted = sortByFaded([card("a", 20), card("b", 90)]);
    expect(sorted.map((c) => c.name)).toEqual(["b", "a"]);
  });
});
