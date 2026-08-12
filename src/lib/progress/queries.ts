import { db } from "@/lib/db";
import { BADGES, type BadgeDefinition } from "./badges";

export type BadgeState = {
  definition: BadgeDefinition;
  earned: boolean;
  awardedAt: Date | null;
  context: Record<string, unknown> | null;
};

/**
 * Every badge, earned or not, in a stable order: earned first (most recent
 * first), then the ones still to find. Unearned badges without a hint render as
 * "? ? ?" so there is always something left to discover.
 */
export async function getBadgeState(userId: string): Promise<BadgeState[]> {
  const awards = await db.badgeAward.findMany({ where: { userId } });
  const byKey = new Map(awards.map((a) => [a.badgeKey, a]));

  const states: BadgeState[] = BADGES.map((definition) => {
    const award = byKey.get(definition.key);
    return {
      definition,
      earned: Boolean(award),
      awardedAt: award?.awardedAt ?? null,
      context: (award?.context as Record<string, unknown> | null) ?? null,
    };
  });

  return states.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) {
      return (b.awardedAt?.getTime() ?? 0) - (a.awardedAt?.getTime() ?? 0);
    }
    return 0;
  });
}

/** Milestones reached across all skills, most recent first. */
export async function getAchievedMilestones(userId: string, take = 6) {
  return db.milestone.findMany({
    where: { skill: { userId }, achievedAt: { not: null } },
    include: { skill: { select: { name: true, slug: true, colorSeed: true } } },
    orderBy: { achievedAt: "desc" },
    take,
  });
}
