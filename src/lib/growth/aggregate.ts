import { db } from "@/lib/db";
import {
  nextMilestone,
  type MilestoneRow,
  type MilestoneTier,
} from "@/lib/progress/milestones";
import { summariseWeek, type WeekSummary } from "./summarise";

// Re-exported so callers have one import site for growth reads; the
// implementations live in ./summarise because they must stay Prisma-free.
export { summariseWeek, bucketByDay } from "./summarise";
export type { WeekSummary } from "./summarise";

/**
 * Read models for the dashboard, skill pages and timeline.
 *
 * These load a user's experiences into memory and aggregate in JS rather than
 * pushing the work into SQL. At personal scale that is the right trade: a
 * heavy user logging twice a day for five years has under 4,000 rows, each a
 * handful of columns. It keeps the multi-skill counting rule (below) expressed
 * once, in readable code, instead of duplicated across raw queries.
 */

const DAY = 86_400_000;

type ExperienceWithSkills = {
  id: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  minutes: number | null;
  skills: { skillId: string }[];
};

async function loadExperiences(userId: string): Promise<ExperienceWithSkills[]> {
  return db.experience.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      notes: true,
      occurredAt: true,
      minutes: true,
      skills: { select: { skillId: true } },
    },
    orderBy: { occurredAt: "desc" },
  });
}

export type SkillCard = {
  id: string;
  name: string;
  slug: string;
  colorSeed: number;
  secondaryUnit: string | null;
  totalMinutes: number;
  experienceCount: number;
  lastActiveAt: Date | null;
  nextLabel: string | null;
  nextRemaining: string | null;
  fraction: number;
  achievedTier: MilestoneTier | null;
  achievedLabel: string | null;
};

export type DashboardData = {
  week: WeekSummary;
  skills: SkillCard[];
  totalMinutes: number;
  totalExperiences: number;
};

export async function getGrowthOverview(userId: string): Promise<DashboardData> {
  const [skills, experiences] = await Promise.all([
    db.skill.findMany({
      where: { userId, archivedAt: null },
      include: { milestones: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    loadExperiences(userId),
  ]);

  // Index experiences by skill once, rather than filtering per skill.
  const bySkill = new Map<string, ExperienceWithSkills[]>();
  for (const experience of experiences) {
    for (const { skillId } of experience.skills) {
      const list = bySkill.get(skillId);
      if (list) list.push(experience);
      else bySkill.set(skillId, [experience]);
    }
  }

  const cards: SkillCard[] = skills.map((skill) => {
    const own = bySkill.get(skill.id) ?? [];
    const totalMinutes = own.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
    const progress = { totalMinutes, experienceCount: own.length };

    const milestones: MilestoneRow[] = skill.milestones.map((m) => ({
      id: m.id,
      label: m.label,
      tier: m.tier as MilestoneTier,
      order: m.order,
      thresholdMinutes: m.thresholdMinutes,
      thresholdCount: m.thresholdCount,
      achievedAt: m.achievedAt,
    }));

    const { next, previous, fraction, remainingLabel } = nextMilestone(
      milestones,
      progress,
    );

    const highestAchieved = [...milestones]
      .filter((m) => m.achievedAt)
      .sort((a, b) => b.order - a.order)[0];

    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      colorSeed: skill.colorSeed,
      secondaryUnit: skill.secondaryUnit,
      totalMinutes,
      experienceCount: own.length,
      // `own` inherits the descending order of the parent query.
      lastActiveAt: own[0]?.occurredAt ?? null,
      nextLabel: next?.label ?? null,
      nextRemaining: remainingLabel,
      fraction,
      achievedTier: (highestAchieved ?? previous)?.tier ?? null,
      achievedLabel: highestAchieved?.label ?? null,
    };
  });

  return {
    week: summariseWeek(experiences),
    skills: cards,
    totalMinutes: experiences.reduce((sum, e) => sum + (e.minutes ?? 0), 0),
    totalExperiences: experiences.length,
  };
}

export type TimelineEntry = {
  id: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  minutes: number | null;
  skills: { id: string; name: string; slug: string; colorSeed: number }[];
};

export async function getTimeline(
  userId: string,
  options: { skillId?: string; take?: number } = {},
): Promise<TimelineEntry[]> {
  const rows = await db.experience.findMany({
    where: {
      userId,
      ...(options.skillId ? { skills: { some: { skillId: options.skillId } } } : {}),
    },
    include: {
      skills: {
        include: {
          skill: {
            select: { id: true, name: true, slug: true, colorSeed: true },
          },
        },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: options.take ?? 100,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    occurredAt: row.occurredAt,
    minutes: row.minutes,
    skills: row.skills.map((link) => link.skill),
  }));
}

export async function getSkillDetail(userId: string, slug: string) {
  const skill = await db.skill.findUnique({
    where: { userId_slug: { userId, slug } },
    include: { milestones: { orderBy: { order: "asc" } } },
  });
  if (!skill || skill.userId !== userId) return null;

  const links = await db.experienceSkill.findMany({
    where: { skillId: skill.id },
    select: {
      experience: {
        select: { id: true, occurredAt: true, minutes: true, notes: true },
      },
    },
  });

  const totalMinutes = links.reduce(
    (sum, link) => sum + (link.experience.minutes ?? 0),
    0,
  );
  const progress = { totalMinutes, experienceCount: links.length };

  const milestones: MilestoneRow[] = skill.milestones.map((m) => ({
    id: m.id,
    label: m.label,
    tier: m.tier as MilestoneTier,
    order: m.order,
    thresholdMinutes: m.thresholdMinutes,
    thresholdCount: m.thresholdCount,
    achievedAt: m.achievedAt,
  }));

  return {
    skill,
    milestones,
    progress,
    ...nextMilestone(milestones, progress),
    activity: links.map((l) => l.experience.occurredAt),
  };
}

