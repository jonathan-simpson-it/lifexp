import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Full data export.
 *
 * Deliberately plain, complete JSON with no LifeXP-specific encoding: the PRD's
 * long-term direction is local-first ownership, and an export that can only be
 * read back by us is not ownership.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const [skills, experiences, maintenance, badges] = await Promise.all([
    db.skill.findMany({
      where: { userId },
      include: { milestones: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.experience.findMany({
      where: { userId },
      include: { skills: { select: { skillId: true } } },
      orderBy: { occurredAt: "asc" },
    }),
    db.maintenanceItem.findMany({
      where: { userId },
      include: { logs: { orderBy: { doneAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.badgeAward.findMany({ where: { userId }, orderBy: { awardedAt: "asc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    format: "lifexp.export.v1",
    skills: skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      secondaryUnit: skill.secondaryUnit,
      createdAt: skill.createdAt,
      milestones: skill.milestones.map((m) => ({
        label: m.label,
        tier: m.tier,
        thresholdMinutes: m.thresholdMinutes,
        thresholdCount: m.thresholdCount,
        achievedAt: m.achievedAt,
      })),
    })),
    experiences: experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      notes: experience.notes,
      occurredAt: experience.occurredAt,
      minutes: experience.minutes,
      source: experience.source,
      skillIds: experience.skills.map((s) => s.skillId),
    })),
    maintenance: maintenance.map((item) => ({
      name: item.name,
      intervalDays: item.intervalDays,
      log: item.logs.map((entry) => entry.doneAt),
    })),
    badges: badges.map((badge) => ({
      key: badge.badgeKey,
      awardedAt: badge.awardedAt,
      context: badge.context,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="lifexp-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
