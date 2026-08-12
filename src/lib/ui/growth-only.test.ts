import { describe, expect, it } from "vitest";
import { STAGE_LABEL, stageForTier, SWAY_AMPLITUDE } from "@/components/icons/plant";
import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * Growth is the only direction.
 *
 * These assert the property the garden rests on: nothing in the plant system
 * can express decay. It is checked here rather than trusted to a comment,
 * because the tempting version of "watering" — a plant that gets thirsty and
 * browns when neglected — is a streak wearing a costume, and it would arrive
 * as a small, reasonable-looking patch.
 */

const TIERS: MilestoneTier[] = [
  "FIRST_STEPS",
  "FOUNDATION",
  "BRONZE",
  "SILVER",
  "GOLD",
  "MASTERY",
  "CUSTOM",
];

describe("plant stages", () => {
  it("maps every tier to a stage, and no tier to nothing", () => {
    for (const tier of TIERS) {
      expect(stageForTier(tier)).toBeTruthy();
    }
  });

  it("treats an unmilestoned skill as a seed, never as an absence", () => {
    // A skill with no milestone yet is at the start of its ladder, not
    // missing from the garden.
    expect(stageForTier(null)).toBe("seed");
  });

  it("has no stage that describes decay", () => {
    const decay = /wilt|wither|dying|dead|dried|brown|droop|neglect|fading/i;

    for (const label of Object.values(STAGE_LABEL)) {
      expect(label).not.toMatch(decay);
    }
    for (const stage of Object.keys(STAGE_LABEL)) {
      expect(stage).not.toMatch(decay);
    }
  });

  it("never diminishes a skill in its accessible name", () => {
    // "only a sprout" or "just a seed" would turn the garden into a ranking.
    for (const label of Object.values(STAGE_LABEL)) {
      expect(label).not.toMatch(/\bonly\b|\bjust\b|\bstill\b/i);
    }
  });

  it("gives every stage a sway amplitude, falling as the plant grows", () => {
    const order = [
      "sprout",
      "sapling",
      "young",
      "flowering",
      "fruiting",
      "grand",
    ] as const;

    const value = (stage: (typeof order)[number]) =>
      parseFloat(SWAY_AMPLITUDE[stage]);

    for (const stage of Object.keys(STAGE_LABEL)) {
      expect(SWAY_AMPLITUDE[stage as keyof typeof SWAY_AMPLITUDE]).toBeTruthy();
    }

    // A seedling whips about; a grand tree barely moves.
    for (let i = 1; i < order.length; i += 1) {
      expect(value(order[i])).toBeLessThan(value(order[i - 1]));
    }
  });
});
