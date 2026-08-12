import { db } from "@/lib/db";
import { evaluateAwards } from "./award-engine";
import { isMilestoneMet } from "./milestones";
import type { AwardSnapshot } from "./badges";

export type SyncResult = {
  newMilestoneIds: string[];
  newBadgeKeys: string[];
};

/**
 * Recompute milestones and badges for a user and persist anything newly earned.
 *
 * Called after every experience and maintenance write. It is a full recompute
 * rather than an incremental update, which costs a couple of queries but means
 * there is no drift to debug: editing an experience's duration downward, or
 * deleting one, is handled by the same code path as creating one.
 *
 * Idempotent. Milestones are only ever moved from unachieved to achieved, and
 * badge inserts rely on the unique (userId, badgeKey) constraint.
 */
export async function syncProgress(userId: string): Promise<SyncResult> {
  const [user, experiences, maintenanceLogCount, existingBadges] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      }),
      db.experience.findMany({
        where: { userId },
        select: {
          id: true,
          occurredAt: true,
          minutes: true,
          notes: true,
          skills: { select: { skillId: true } },
        },
      }),
      db.maintenanceLog.count({ where: { item: { userId } } }),
      db.badgeAward.findMany({
        where: { userId },
        select: { badgeKey: true },
      }),
    ]);

  // --- milestones ---------------------------------------------------------
  // Per-skill totals. An experience's full duration counts toward each of its
  // skills (see the comment on ExperienceSkill in schema.prisma).
  const perSkill = new Map<string, { totalMinutes: number; experienceCount: number }>();
  for (const experience of experiences) {
    for (const { skillId } of experience.skills) {
      const entry = perSkill.get(skillId) ?? { totalMinutes: 0, experienceCount: 0 };
      entry.totalMinutes += experience.minutes ?? 0;
      entry.experienceCount += 1;
      perSkill.set(skillId, entry);
    }
  }

  // Only unachieved milestones are considered, which means a milestone is
  // never revoked. Deleting or shortening an experience can take a skill back
  // below a threshold, and we deliberately leave the medal in place: it
  // records that the person got there, and taking it away for a data
  // correction would be exactly the kind of punishment this product refuses.
  const unachieved = await db.milestone.findMany({
    where: { skill: { userId }, achievedAt: null },
    select: {
      id: true,
      skillId: true,
      thresholdMinutes: true,
      thresholdCount: true,
    },
  });

  const now = new Date();
  const newMilestoneIds = unachieved
    .filter((milestone) => {
      const progress = perSkill.get(milestone.skillId);
      if (!progress) return false;
      return isMilestoneMet(milestone, progress);
    })
    .map((m) => m.id);

  if (newMilestoneIds.length > 0) {
    await db.milestone.updateMany({
      where: { id: { in: newMilestoneIds } },
      data: { achievedAt: now },
    });
  }

  // Counted after the update above, so reaching a skill's first milestone and
  // earning the "first-milestone" badge happen in the same pass rather than
  // the badge lagging a write behind.
  const achievedMilestoneCount = await db.milestone.count({
    where: { skill: { userId }, achievedAt: { not: null } },
  });

  // --- badges -------------------------------------------------------------
  const snapshot: AwardSnapshot = {
    now,
    timezone: user?.timezone || "UTC",
    experiences: experiences.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      minutes: e.minutes,
      hasNotes: Boolean(e.notes && e.notes.trim().length > 0),
      skillIds: e.skills.map((s) => s.skillId),
    })),
    maintenanceLogCount,
    achievedMilestoneCount,
  };

  const pending = evaluateAwards(
    snapshot,
    existingBadges.map((b) => b.badgeKey),
  );

  if (pending.length > 0) {
    // skipDuplicates covers the race where two writes land at once; the unique
    // constraint is the real guarantee.
    await db.badgeAward.createMany({
      data: pending.map((award) => ({
        userId,
        badgeKey: award.badgeKey,
        context: award.context as object,
      })),
      skipDuplicates: true,
    });
  }

  return {
    newMilestoneIds,
    newBadgeKeys: pending.map((p) => p.badgeKey),
  };
}
