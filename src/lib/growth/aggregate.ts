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
  /** Drives the skill glyph on chips and cards. */
  templateKey: string | null;
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
      templateKey: skill.templateKey,
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

export type QuickSkill = {
  id: string;
  name: string;
  colorSeed: number;
  templateKey: string | null;
};

/**
 * Skills for the quick-log chips, most recently used first.
 *
 * Recency ordering is what makes two-tap logging work: the thing you did
 * yesterday is almost always the thing you are logging now, so it should be
 * the leftmost chip.
 */
export async function getRecentSkills(
  userId: string,
  take = 8,
): Promise<QuickSkill[]> {
  const skills = await db.skill.findMany({
    where: { userId, archivedAt: null },
    select: {
      id: true,
      name: true,
      colorSeed: true,
      templateKey: true,
      createdAt: true,
      experiences: {
        select: { experience: { select: { occurredAt: true } } },
        orderBy: { experience: { occurredAt: "desc" } },
        take: 1,
      },
    },
  });

  return skills
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      colorSeed: skill.colorSeed,
      templateKey: skill.templateKey,
      lastUsed: skill.experiences[0]?.experience.occurredAt ?? skill.createdAt,
    }))
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
    .slice(0, take)
    .map(({ id, name, colorSeed, templateKey }) => ({
      id,
      name,
      colorSeed,
      templateKey,
    }));
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

export type CalendarDay = {
  /** YYYY-MM-DD, UTC. */
  date: string;
  minutes: number;
  experiences: {
    id: string;
    title: string;
    minutes: number | null;
    skills: { id: string; name: string; colorSeed: number }[];
  }[];
  maintenance: { id: string; name: string }[];
};

export type CalendarMonth = {
  year: number;
  /** 1-12. */
  month: number;
  days: CalendarDay[];
  totals: {
    minutes: number;
    experiences: number;
    skills: number;
    medals: number;
  };
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Everything that happened in one month, bucketed by day.
 *
 * Returns a bucket for every day that has something in it; the grid fills the
 * blanks. Days are UTC — consistent with `bucketByDay`, and at personal scale
 * the timezone edges are not worth per-user day boundaries.
 */
export async function getMonth(
  userId: string,
  year: number,
  month: number,
): Promise<CalendarMonth> {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  const [experiences, maintenanceLogs, milestones, badges] = await Promise.all([
    db.experience.findMany({
      where: { userId, occurredAt: { gte: from, lt: to } },
      select: {
        id: true,
        title: true,
        minutes: true,
        occurredAt: true,
        skills: {
          select: {
            skill: { select: { id: true, name: true, colorSeed: true } },
          },
        },
      },
      orderBy: { occurredAt: "asc" },
    }),
    db.maintenanceLog.findMany({
      where: { item: { userId }, doneAt: { gte: from, lt: to } },
      select: { id: true, doneAt: true, item: { select: { name: true } } },
    }),
    db.milestone.count({
      where: { skill: { userId }, achievedAt: { gte: from, lt: to } },
    }),
    db.badgeAward.count({
      where: { userId, awardedAt: { gte: from, lt: to } },
    }),
  ]);

  const byDay = new Map<string, CalendarDay>();
  const ensure = (key: string) => {
    let day = byDay.get(key);
    if (!day) {
      day = { date: key, minutes: 0, experiences: [], maintenance: [] };
      byDay.set(key, day);
    }
    return day;
  };

  for (const experience of experiences) {
    const day = ensure(dayKey(experience.occurredAt));
    day.minutes += experience.minutes ?? 0;
    day.experiences.push({
      id: experience.id,
      title: experience.title,
      minutes: experience.minutes,
      skills: experience.skills.map((link) => link.skill),
    });
  }

  for (const log of maintenanceLogs) {
    ensure(dayKey(log.doneAt)).maintenance.push({
      id: log.id,
      name: log.item.name,
    });
  }

  const skillIds = new Set(
    experiences.flatMap((e) => e.skills.map((s) => s.skill.id)),
  );

  return {
    year,
    month,
    days: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    totals: {
      // Summed over distinct experiences — see the note on ExperienceSkill.
      minutes: experiences.reduce((sum, e) => sum + (e.minutes ?? 0), 0),
      experiences: experiences.length,
      skills: skillIds.size,
      medals: milestones + badges,
    },
  };
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

