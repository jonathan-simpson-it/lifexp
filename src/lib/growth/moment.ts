import { db } from "@/lib/db";
import {
  nextMilestone,
  type MilestoneRow,
  type MilestoneTier,
} from "@/lib/progress/milestones";

/**
 * One skill's state at one instant.
 *
 * This exists for the reward moment. When something is logged the app wants to
 * show what actually changed, the plant growing a stage, the remaining
 * distance dropping, and "what changed" needs a before and an after, which no
 * other read model provides. `getGrowthOverview` loads every skill a user has;
 * this loads one, so it is cheap enough to call twice on a write path.
 */
export type SkillMoment = {
  id: string;
  name: string;
  colorSeed: number;
  templateKey: string | null;
  /** Highest achieved tier, the plant's stage comes from this and nothing else. */
  tier: MilestoneTier | null;
  totalMinutes: number;
  experienceCount: number;
  /** Label of the milestone being climbed toward, e.g. "Elementary". */
  nextLabel: string | null;
  /** Formatted distance still to go, e.g. "67.5h to go". */
  remainingLabel: string | null;
  /** The same distance unformatted, so the reward can animate it downward. */
  remaining: number | null;
  remainingUnit: "minutes" | "sessions" | null;
  /** 0–1 along the current segment, measured from the previous milestone. */
  fraction: number;
};

export async function getSkillMoment(
  userId: string,
  skillId: string,
): Promise<SkillMoment | null> {
  const skill = await db.skill.findFirst({
    where: { id: skillId, userId },
    include: { milestones: { orderBy: { order: "asc" } } },
  });
  if (!skill) return null;

  // Only this skill's experiences. An experience's full duration counts toward
  // each skill it is linked to, so this is a straight sum with no apportioning,
  // the same rule ARCHITECTURE §4.1 describes.
  const rows = await db.experience.findMany({
    where: { userId, skills: { some: { skillId } } },
    select: { minutes: true },
  });

  const totalMinutes = rows.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
  const progress = { totalMinutes, experienceCount: rows.length };

  const milestones: MilestoneRow[] = skill.milestones.map((m) => ({
    id: m.id,
    label: m.label,
    tier: m.tier as MilestoneTier,
    order: m.order,
    thresholdMinutes: m.thresholdMinutes,
    thresholdCount: m.thresholdCount,
    achievedAt: m.achievedAt,
  }));

  const { next, previous, fraction, remainingLabel, remaining, remainingUnit } =
    nextMilestone(milestones, progress);

  const highestAchieved = [...milestones]
    .filter((m) => m.achievedAt)
    .sort((a, b) => b.order - a.order)[0];

  return {
    id: skill.id,
    name: skill.name,
    colorSeed: skill.colorSeed,
    templateKey: skill.templateKey,
    tier: (highestAchieved ?? previous)?.tier ?? null,
    totalMinutes,
    experienceCount: rows.length,
    nextLabel: next?.label ?? null,
    remainingLabel,
    remaining,
    remainingUnit,
    fraction,
  };
}
