import { db } from "@/lib/db";
import { demoAchievedMilestones, demoBadgeAwards, isDemoMode } from "@/lib/demo";
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
  const awards = isDemoMode()
    ? demoBadgeAwards()
    : await db.badgeAward.findMany({ where: { userId } });

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

export type RecapBadge = { key: string; title: string; icon: string };

/**
 * Badges earned in the last `days`, flattened to plain data.
 *
 * The window is computed here rather than in the page for two reasons: badge
 * definitions carry an `earned()` predicate that cannot cross into a client
 * component, and reading the clock inside a component is an impure render.
 * Filtering in the query also means the page never loads awards it will drop.
 */
export async function getRecentBadges(
  userId: string,
  days = 7,
): Promise<RecapBadge[]> {
  const since = new Date(Date.now() - days * 86_400_000);

  const awards = isDemoMode()
    ? demoBadgeAwards()
        .filter((award) => award.awardedAt >= since)
        .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime())
    : await db.badgeAward.findMany({
        where: { userId, awardedAt: { gte: since } },
        orderBy: { awardedAt: "desc" },
      });

  return awards.flatMap((award) => {
    const definition = BADGES.find((b) => b.key === award.badgeKey);
    return definition
      ? [{ key: definition.key, title: definition.title, icon: definition.icon }]
      : [];
  });
}

/**
 * Whether the weekly recap should be offered, and which week it is for.
 *
 * Sunday and Monday only. Lives here so the clock is read outside of any
 * component, and so the client half only has to answer "has this week's recap
 * been dismissed?".
 */
export function getRecapWindow(now = new Date()) {
  const day = now.getUTCDay(); // 0 Sunday, 1 Monday

  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - day);

  return {
    isRecapDay: day === 0 || day === 1,
    weekStamp: startOfWeek.toISOString().slice(0, 10),
  };
}

/** Milestones reached across all skills, most recent first. */
export async function getAchievedMilestones(userId: string, take = 6) {
  if (isDemoMode()) return demoAchievedMilestones(take);

  return db.milestone.findMany({
    where: { skill: { userId }, achievedAt: { not: null } },
    include: { skill: { select: { name: true, slug: true, colorSeed: true } } },
    orderBy: { achievedAt: "desc" },
    take,
  });
}
