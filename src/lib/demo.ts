import { evaluateAwards } from "@/lib/progress/award-engine";
import {
  isMilestoneMet,
  ladderFor,
  nextMilestone,
  pickTemplate,
  type MilestoneRow,
  type MilestoneTier,
} from "@/lib/progress/milestones";
import {
  restStateFor,
  seasonFor,
  type RestState,
  type Season,
} from "@/lib/garden/conditions";

/**
 * Demo mode: the whole product, no database.
 *
 * The `ui-test-only` branch exists so the UI can be shown to a client from a
 * deployment with no environment variables at all. When DATABASE_URL is absent
 * (or LIFEXP_DEMO=1 is set) every read path returns the same six months of
 * deterministic example data the seed script writes, held in memory instead of
 * Postgres. Writes are accepted and celebrated but never persisted, which is
 * the point: this branch is for looking at, not for keeping.
 *
 * The fixture generator below is a direct port of `prisma/seed.ts`, dates and
 * all, so every screen (garden, medals, calendar, recap) has the same content
 * it would have locally after `npm run seed`.
 */

export const DEMO_USER_ID = "demo-user";
export const DEMO_EMAIL = "demo@lifexp.local";

export function isDemoMode(): boolean {
  if (process.env.LIFEXP_DEMO === "1") return true;
  return !process.env.DATABASE_URL;
}

export type DemoMilestone = {
  id: string;
  skillId: string;
  label: string;
  tier: MilestoneTier;
  order: number;
  thresholdMinutes: number | null;
  thresholdCount: number | null;
  achievedAt: Date | null;
};

export type DemoSkill = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  colorSeed: number;
  secondaryUnit: string | null;
  templateKey: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  milestones: DemoMilestone[];
};

export type DemoExperience = {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  minutes: number | null;
  source: "FORM" | "CHAT" | "CALENDAR";
  googleEventId: string | null;
  skills: { skillId: string }[];
};

export type DemoMaintenanceItem = {
  id: string;
  userId: string;
  name: string;
  intervalDays: number;
  createdAt: Date;
  archivedAt: Date | null;
  logs: { id: string; itemId: string; doneAt: Date }[];
};

export type DemoBadgeAward = {
  id: string;
  userId: string;
  badgeKey: string;
  awardedAt: Date;
  context: Record<string, unknown> | null;
};

export type DemoData = {
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
    lifexpCalendarId: string | null;
    calendarSyncError: string | null;
  };
  skills: DemoSkill[];
  experiences: DemoExperience[];
  maintenance: DemoMaintenanceItem[];
  badges: DemoBadgeAward[];
};

const DAY = 86_400_000;

/** Stable per-name colour, mirrored from lib/growth/skills.ts. */
function colorSeedFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

// Mulberry32, small, fast, and reproducible.
function makeRandom(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Plan = {
  daysAgo: number;
  hour: number;
  title: string;
  minutes: number | null;
  skills: string[];
  notes?: string;
};

const QUIET_FROM_DAYS_AGO = 96;
const QUIET_TO_DAYS_AGO = 62;

function isQuietPeriod(daysAgo: number): boolean {
  return daysAgo <= QUIET_FROM_DAYS_AGO && daysAgo >= QUIET_TO_DAYS_AGO;
}

function buildDemoData(now: Date): DemoData {
  const random = makeRandom(20260812);
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

  // `daysAgo` days before now, at a given hour, in UTC. The demo user's
  // timezone is UTC to match, so "recorded at 06:00" means exactly that.
  const at = (daysAgo: number, hour: number, minute = 0): Date => {
    const d = new Date(now.getTime() - daysAgo * DAY);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute, 0, 0),
    );
  };

  const userId = DEMO_USER_ID;

  const makeSkill = (name: string, slug: string, createdAt: Date): DemoSkill => {
    const skillId = `skill-${slug}`;
    const milestones: DemoMilestone[] = ladderFor(name).map((step, index) => ({
      id: `milestone-${slug}-${index}`,
      skillId,
      label: step.label,
      tier: step.tier,
      order: index,
      thresholdMinutes: step.hours ? step.hours * 60 : null,
      thresholdCount: step.sessions ?? null,
      achievedAt: null,
    }));

    return {
      id: skillId,
      userId,
      name,
      slug,
      colorSeed: colorSeedFor(name),
      secondaryUnit:
        name === "Reading" ? "books" : name === "Running" ? "km" : null,
      templateKey:
        name === "Japanese"
          ? "language"
          : name === "Piano"
            ? "music"
            : name === "Reading"
              ? "reading"
              : name === "Running"
                ? "fitness"
                : "craft",
      createdAt,
      archivedAt: null,
      milestones,
    };
  };

  const japanese = makeSkill("Japanese", "japanese", at(700, 19));
  const piano = makeSkill("Piano", "piano", at(340, 21));
  const running = makeSkill("Running", "running", at(150, 6));
  const reading = makeSkill("Reading", "reading", at(26, 22));
  const woodworking = makeSkill("Woodworking", "woodworking", at(240, 15));
  const skills = [japanese, piano, running, reading, woodworking];

  const plans: Plan[] = [];

  // Japanese: the long-running skill. Twice-weekly classes plus study, with a
  // 34-day silence in the middle that "The Return" is meant to notice.
  const japaneseTitles = [
    "Japanese class",
    "Anki reviews",
    "Reading NHK Easy News",
    "Conversation practice",
    "Grammar textbook",
    "Listening practice",
  ];
  for (let daysAgo = 700; daysAgo >= 0; daysAgo -= 2) {
    if (isQuietPeriod(daysAgo)) continue;
    if (random() < 0.25) continue;
    plans.push({
      daysAgo,
      hour: random() < 0.3 ? 6 : 19,
      title: pick(japaneseTitles),
      minutes: pick([45, 60, 60, 90, 90, 120]),
      skills: [japanese.id],
      notes:
        random() < 0.55
          ? pick([
              "Finally stopped mixing up は and が.",
              "Understood most of the lesson without subtitles.",
              "Hard going today. Showed up anyway.",
              "Had a five minute conversation without switching to English.",
            ])
          : undefined,
    });
  }

  // Piano: session-counted, short and frequent, about a year in.
  for (let daysAgo = 340; daysAgo >= 0; daysAgo -= 3) {
    if (isQuietPeriod(daysAgo)) continue;
    if (random() < 0.35) continue;
    plans.push({
      daysAgo,
      hour: 21,
      title: pick(["Piano practice", "Scales and arpeggios", "Learning a new piece"]),
      minutes: pick([20, 30, 30, 45]),
      skills: [piano.id],
    });
  }

  // Running: has an outlier long run, which earns "Deep Diver".
  for (let daysAgo = 150; daysAgo >= 0; daysAgo -= 6) {
    if (isQuietPeriod(daysAgo)) continue;
    if (random() < 0.3) continue;
    plans.push({
      daysAgo,
      hour: 6,
      title: pick(["Morning run", "Easy 5k", "Interval session"]),
      minutes: pick([30, 35, 45, 50]),
      skills: [running.id],
    });
  }
  plans.push({
    daysAgo: 44,
    hour: 8,
    title: "Half marathon",
    minutes: 255,
    skills: [running.id],
    notes: "Slower than I wanted. Finished, which was the point.",
  });

  // Reading: the newest skill, so the dashboard shows the bottom of a ladder.
  for (let daysAgo = 26; daysAgo >= 0; daysAgo -= 2) {
    if (random() < 0.4) continue;
    plans.push({
      daysAgo,
      hour: 22,
      title: pick(["Reading before bed", "Finished a chapter", "Read on the train"]),
      minutes: pick([25, 40, 60]),
      skills: [reading.id],
    });
  }

  // Woodworking: a real run of it last winter, then set aside, so its plant is
  // resting and wakes the moment anything is logged against it.
  for (let daysAgo = 240; daysAgo >= 100; daysAgo -= 7) {
    if (isQuietPeriod(daysAgo)) continue;
    if (random() < 0.3) continue;
    plans.push({
      daysAgo,
      hour: 15,
      title: pick([
        "Sanding and finishing",
        "Cut the joints for the shelf",
        "Workshop afternoon",
      ]),
      minutes: pick([90, 120, 150]),
      skills: [woodworking.id],
    });
  }

  // Cross-skill experiences, the ones that make the "count minutes fully per
  // skill, dedupe across skills" rule observable.
  plans.push({
    daysAgo: 12,
    hour: 18,
    title: "Read a Japanese short story",
    minutes: 75,
    skills: [japanese.id, reading.id],
    notes: "Two skills, one evening.",
  });
  plans.push({
    daysAgo: 5,
    hour: 20,
    title: "Japanese podcast on an easy run",
    minutes: 40,
    skills: [japanese.id, running.id],
  });

  // One experience with no duration at all, evidence without a number.
  plans.push({
    daysAgo: 2,
    hour: 13,
    title: "Ordered lunch entirely in Japanese",
    minutes: null,
    skills: [japanese.id],
    notes: "No idea how long it took. Felt enormous.",
  });

  const experiences: DemoExperience[] = plans.map((plan, index) => ({
    id: `experience-${index + 1}`,
    userId,
    title: plan.title,
    notes: plan.notes ?? null,
    occurredAt: at(plan.daysAgo, plan.hour, Math.floor(random() * 60)),
    minutes: plan.minutes,
    source: "FORM" as const,
    googleEventId: null,
    skills: plan.skills.map((skillId) => ({ skillId })),
  }));

  experiences.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  // Milestones, achieved exactly where the seed's progress sync would put them.
  const perSkill = new Map<string, { totalMinutes: number; experienceCount: number }>();
  for (const experience of experiences) {
    for (const { skillId } of experience.skills) {
      const entry = perSkill.get(skillId) ?? { totalMinutes: 0, experienceCount: 0 };
      entry.totalMinutes += experience.minutes ?? 0;
      entry.experienceCount += 1;
      perSkill.set(skillId, entry);
    }
  }
  for (const skill of skills) {
    const progress = perSkill.get(skill.id);
    if (!progress) continue;
    for (const milestone of skill.milestones) {
      if (isMilestoneMet(milestone, progress)) {
        milestone.achievedAt = firstCrossing(skill, milestone, experiences);
      }
    }
  }

  // Maintenance, spread across the freshness gradient: one just done, one
  // roughly due, one well past its usual rhythm. None of them are "late".
  const maintenancePlans: Array<{
    name: string;
    intervalDays: number;
    lastDoneDaysAgo: number[];
  }> = [
    { name: "Change bedsheets", intervalDays: 14, lastDoneDaysAgo: [12, 27, 40, 55] },
    { name: "Vacuum", intervalDays: 7, lastDoneDaysAgo: [9, 16, 22, 30, 38] },
    { name: "Water plants", intervalDays: 5, lastDoneDaysAgo: [4, 9, 15, 20] },
    { name: "Laundry", intervalDays: 7, lastDoneDaysAgo: [2, 9, 17, 24, 31] },
    { name: "Gym", intervalDays: 3, lastDoneDaysAgo: [1, 4, 8, 11, 14, 18] },
    { name: "Clean the fridge", intervalDays: 30, lastDoneDaysAgo: [26, 61] },
  ];

  const maintenance: DemoMaintenanceItem[] = maintenancePlans.map((item, index) => {
    const itemId = `maintenance-${index + 1}`;
    return {
      id: itemId,
      userId,
      name: item.name,
      intervalDays: item.intervalDays,
      createdAt: at(90, 11),
      archivedAt: null,
      logs: item.lastDoneDaysAgo.map((daysAgo, logIndex) => ({
        id: `maintenance-${index + 1}-log-${logIndex + 1}`,
        itemId,
        doneAt: at(daysAgo, 11),
      })),
    };
  });

  const maintenanceLogCount = maintenance.reduce((sum, item) => sum + item.logs.length, 0);
  const achievedMilestoneCount = skills.reduce(
    (sum, skill) => sum + skill.milestones.filter((m) => m.achievedAt).length,
    0,
  );

  const pending = evaluateAwards(
    {
      now,
      timezone: "UTC",
      experiences: experiences.map((e) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        minutes: e.minutes,
        hasNotes: Boolean(e.notes && e.notes.trim().length > 0),
        skillIds: e.skills.map((s) => s.skillId),
      })),
      maintenanceLogCount,
      achievedMilestoneCount,
    },
    [],
  );

  const badges: DemoBadgeAward[] = pending.map((award, index) => ({
    id: `badge-${index + 1}`,
    userId,
    badgeKey: award.badgeKey,
    awardedAt: awardedAtFor(
      award.badgeKey,
      experiences,
      maintenance,
      skills,
      now,
    ),
    context: award.context,
  }));

  return {
    user: {
      id: userId,
      name: "Demo",
      email: DEMO_EMAIL,
      timezone: "UTC",
      lifexpCalendarId: null,
      calendarSyncError: null,
    },
    skills,
    experiences,
    maintenance,
    badges,
  };
}

/** When a milestone's threshold was first crossed, for a believable medal date. */
function firstCrossing(
  skill: DemoSkill,
  milestone: DemoMilestone,
  experiences: DemoExperience[],
): Date | null {
  let totalMinutes = 0;
  let experienceCount = 0;
  for (const experience of experiences) {
    if (!experience.skills.some((s) => s.skillId === skill.id)) continue;
    totalMinutes += experience.minutes ?? 0;
    experienceCount += 1;
    if (isMilestoneMet(milestone, { totalMinutes, experienceCount })) {
      return experience.occurredAt;
    }
  }
  return null;
}

/**
 * A plausible award date per badge, derived from the fixture history, so the
 * medals shelf is not a wall of identical timestamps. Only ever called for
 * badges the award engine says are earned.
 */
function awardedAtFor(
  key: string,
  experiences: DemoExperience[],
  maintenance: DemoMaintenanceItem[],
  skills: DemoSkill[],
  now: Date,
): Date {
  const first = experiences[0]?.occurredAt ?? now;
  const nth = (dates: Date[], n: number) => dates[n - 1] ?? now;

  switch (key) {
    case "first-experience":
      return first;

    case "the-return": {
      let longest = 0;
      let returnedAt = now;
      for (let i = 1; i < experiences.length; i++) {
        const gap =
          (experiences[i].occurredAt.getTime() - experiences[i - 1].occurredAt.getTime()) /
          DAY;
        if (gap > longest) {
          longest = gap;
          returnedAt = experiences[i].occurredAt;
        }
      }
      return returnedAt;
    }

    case "polymath": {
      for (let i = 0; i < experiences.length; i++) {
        const end = experiences[i].occurredAt.getTime() + 7 * DAY;
        const seen = new Set<string>();
        for (let j = i; j < experiences.length; j++) {
          if (experiences[j].occurredAt.getTime() > end) break;
          experiences[j].skills.forEach((s) => seen.add(s.skillId));
        }
        if (seen.size >= 3) return experiences[i].occurredAt;
      }
      return now;
    }

    case "deep-diver": {
      const longest = experiences.reduce(
        (best, e) => ((e.minutes ?? 0) > (best.minutes ?? 0) ? e : best),
        experiences[0],
      );
      return longest?.occurredAt ?? now;
    }

    case "hundred-hours": {
      let total = 0;
      for (const e of experiences) {
        total += e.minutes ?? 0;
        if (total >= 6000) return e.occurredAt;
      }
      return now;
    }

    case "first-milestone": {
      const dates = skills
        .flatMap((s) => s.milestones.map((m) => m.achievedAt))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());
      return dates[0] ?? now;
    }

    case "night-owl":
      return nth(
        experiences
          .filter((e) => {
            const hour = e.occurredAt.getUTCHours();
            return hour >= 22 || hour < 4;
          })
          .map((e) => e.occurredAt),
        10,
      );

    case "early-bird":
      return nth(
        experiences
          .filter((e) => {
            const hour = e.occurredAt.getUTCHours();
            return hour >= 4 && hour < 7;
          })
          .map((e) => e.occurredAt),
        10,
      );

    case "quiet-month": {
      const byMonth = new Map<string, DemoExperience[]>();
      for (const e of experiences) {
        const key = e.occurredAt.toISOString().slice(0, 7);
        const list = byMonth.get(key);
        if (list) list.push(e);
        else byMonth.set(key, [e]);
      }
      const currentMonth = now.toISOString().slice(0, 7);
      for (const [month, list] of byMonth) {
        // Only completed months count, so the one underway is never called a
        // write-off.
        if (month >= currentMonth) continue;
        if (list.length >= 1 && list.length < 3) {
          return list[list.length - 1].occurredAt;
        }
      }
      return now;
    }

    case "caretaker": {
      const logs = maintenance
        .flatMap((item) => item.logs.map((log) => log.doneAt))
        .sort((a, b) => a.getTime() - b.getTime());
      return nth(logs, 25);
    }

    case "storyteller":
      return nth(
        experiences.filter((e) => e.notes).map((e) => e.occurredAt),
        20,
      );

    case "year-one":
      return new Date(first.getTime() + 365 * DAY);

    default:
      return now;
  }
}

// ---------------------------------------------------------------------------
// Cached access
// ---------------------------------------------------------------------------

let cache: { generatedAt: number; data: DemoData } | null = null;

/**
 * Fixtures are rebuilt if the cached copy is over an hour old, so "this week"
 * still means this week on a long-running demo deployment.
 */
export function getDemoData(): DemoData {
  const now = Date.now();
  if (!cache || now - cache.generatedAt > 3_600_000) {
    cache = { generatedAt: now, data: buildDemoData(new Date(now)) };
  }
  return cache.data;
}

// ---------------------------------------------------------------------------
// Query-shaped reads
// ---------------------------------------------------------------------------

export function demoUser() {
  return getDemoData().user;
}

export function demoSkillRows(): DemoSkill[] {
  return getDemoData().skills;
}

const byOccurredAtDesc = (a: { occurredAt: Date }, b: { occurredAt: Date }) =>
  b.occurredAt.getTime() - a.occurredAt.getTime();

export function demoExperienceRows(): DemoExperience[] {
  return [...getDemoData().experiences].sort(byOccurredAtDesc);
}

export function demoRecentExperiences(take: number): DemoExperience[] {
  return demoExperienceRows().slice(0, take);
}

export function demoRecentSkills(take: number) {
  const { skills, experiences } = getDemoData();
  const lastUsedFor = (skillId: string): Date | null => {
    const latest = experiences.find((e) => e.skills.some((s) => s.skillId === skillId));
    return latest?.occurredAt ?? null;
  };

  return skills
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      colorSeed: skill.colorSeed,
      templateKey: skill.templateKey,
      lastUsed: lastUsedFor(skill.id) ?? skill.createdAt,
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

export function demoTimeline(options: { skillId?: string; take?: number }) {
  const rows = demoExperienceRows()
    .filter((e) => !options.skillId || e.skills.some((s) => s.skillId === options.skillId))
    .slice(0, options.take ?? 100);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    occurredAt: row.occurredAt,
    minutes: row.minutes,
    skills: row.skills
      .map((link) => getDemoData().skills.find((s) => s.id === link.skillId))
      .filter((s): s is DemoSkill => Boolean(s))
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        colorSeed: skill.colorSeed,
      })),
  }));
}

export function demoMonthRows(year: number, month: number) {
  const { experiences, maintenance, skills, badges } = getDemoData();
  const from = new Date(Date.UTC(year, month - 1, 1)).getTime();
  const to = new Date(Date.UTC(year, month, 1)).getTime();
  const inRange = (date: Date) => date.getTime() >= from && date.getTime() < to;

  const monthExperiences = experiences
    .filter((e) => inRange(e.occurredAt))
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .map((e) => ({
      id: e.id,
      title: e.title,
      minutes: e.minutes,
      occurredAt: e.occurredAt,
      skills: e.skills.map((link) => {
        const skill = skills.find((s) => s.id === link.skillId)!;
        return {
          skill: { id: skill.id, name: skill.name, colorSeed: skill.colorSeed },
        };
      }),
    }));

  const maintenanceLogs = maintenance.flatMap((item) =>
    item.logs
      .filter((log) => inRange(log.doneAt))
      .map((log) => ({
        id: log.id,
        doneAt: log.doneAt,
        item: { name: item.name },
      })),
  );

  const milestoneCount = skills.reduce(
    (sum, skill) =>
      sum + skill.milestones.filter((m) => m.achievedAt && inRange(m.achievedAt)).length,
    0,
  );
  const badgeCount = badges.filter((b) => inRange(b.awardedAt)).length;

  return {
    experiences: monthExperiences,
    maintenanceLogs,
    milestoneCount,
    badgeCount,
  };
}

export function demoSkillDetail(slug: string) {
  const { skills, experiences } = getDemoData();
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) return null;

  const links = experiences
    .filter((e) => e.skills.some((s) => s.skillId === skill.id))
    .map((e) => ({
      experience: {
        id: e.id,
        occurredAt: e.occurredAt,
        minutes: e.minutes,
        notes: e.notes,
      },
    }));

  const totalMinutes = links.reduce(
    (sum, link) => sum + (link.experience.minutes ?? 0),
    0,
  );
  const progress = { totalMinutes, experienceCount: links.length };

  const milestones: MilestoneRow[] = skill.milestones.map((m) => ({
    id: m.id,
    label: m.label,
    tier: m.tier,
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

type MomentSkill = {
  id: string;
  name: string;
  colorSeed: number;
  templateKey: string | null;
  totalMinutes: number;
  experienceCount: number;
  lastActiveAt: Date | null;
  rest: RestState;
  tier: MilestoneTier | null;
  nextLabel: string | null;
  remainingLabel: string | null;
  remaining: number | null;
  remainingUnit: "minutes" | "sessions" | null;
  fraction: number;
  season: Season;
};

function momentFor(
  skill: DemoSkill,
  totalMinutes: number,
  experienceCount: number,
  lastActiveAt: Date | null,
  now: Date,
): MomentSkill {
  const progress = { totalMinutes, experienceCount };
  const milestones: MilestoneRow[] = skill.milestones.map((m) => ({
    id: m.id,
    label: m.label,
    tier: m.tier,
    order: m.order,
    thresholdMinutes: m.thresholdMinutes,
    thresholdCount: m.thresholdCount,
    achievedAt: m.achievedAt,
  }));

  const { next, previous, fraction, remainingLabel, remaining, remainingUnit } =
    nextMilestone(milestones, progress);

  const highestAchieved = [...milestones]
    .filter((m) => isMilestoneMet(m, progress))
    .sort((a, b) => b.order - a.order)[0];

  return {
    id: skill.id,
    name: skill.name,
    colorSeed: skill.colorSeed,
    templateKey: skill.templateKey,
    totalMinutes,
    experienceCount,
    lastActiveAt,
    rest: restStateFor(lastActiveAt, now),
    tier: (highestAchieved ?? previous)?.tier ?? null,
    nextLabel: next?.label ?? null,
    remainingLabel,
    remaining,
    remainingUnit,
    fraction,
    season: seasonFor(now),
  };
}

/** A skill's current state, for read paths that want one skill at a time. */
export function demoSkillMoment(skillId: string): MomentSkill | null {
  const { skills, experiences } = getDemoData();
  const skill = skills.find((s) => s.id === skillId);
  if (!skill) return null;

  const rows = experiences
    .filter((e) => e.skills.some((s) => s.skillId === skillId))
    .sort(byOccurredAtDesc);
  const totalMinutes = rows.reduce((sum, e) => sum + (e.minutes ?? 0), 0);

  return momentFor(skill, totalMinutes, rows.length, rows[0]?.occurredAt ?? null, new Date());
}

export function demoBadgeAwards() {
  return getDemoData().badges;
}

export function demoAchievedMilestones(take: number) {
  const { skills } = getDemoData();
  return skills
    .flatMap((skill) =>
      skill.milestones
        .filter((m) => m.achievedAt)
        .map((m) => ({
          ...m,
          skill: {
            name: skill.name,
            slug: skill.slug,
            colorSeed: skill.colorSeed,
          },
        })),
    )
    .sort((a, b) => (b.achievedAt?.getTime() ?? 0) - (a.achievedAt?.getTime() ?? 0))
    .slice(0, take);
}

export function demoMaintenanceItems() {
  return getDemoData().maintenance.map((item) => ({
    ...item,
    logs: [...item.logs].sort((a, b) => b.doneAt.getTime() - a.doneAt.getTime()),
  }));
}

export function demoSkillNames() {
  return getDemoData().skills.map((skill) => ({ id: skill.id, name: skill.name }));
}

/**
 * The result shape the log sheet and chat capture expect from a save. Unlike
 * the read paths, this one writes: the fixture history in memory gains the
 * experience, milestones and badges are recomputed exactly as
 * lib/progress/sync.ts would, and the reward moment returns the real
 * before/after pair. The demo therefore behaves like the product on a
 * deployment with no database; state lives until the process recycles or the
 * hourly fixture regeneration runs.
 */
export function demoCreateExperience(input: {
  title: string;
  notes?: string | null;
  occurredAt: string;
  minutes?: number | null;
  skillIds?: string[];
  skillNames?: string[];
  source?: "CHAT" | "FORM" | "CALENDAR";
}) {
  const data = getDemoData();

  const beforeIds = new Set(
    data.skills.flatMap((s) => s.milestones.filter((m) => m.achievedAt).map((m) => m.id)),
  );
  const beforeBadges = new Set(data.badges.map((b) => b.badgeKey));

  // Existing skill ids first, then names resolved or created, mirroring the
  // write path's rule that "japanese" attaches to the Japanese skill.
  const skillIds = new Set(
    (input.skillIds ?? []).filter((id) => data.skills.some((s) => s.id === id)),
  );
  for (const name of input.skillNames ?? []) {
    if (!name.trim()) continue;
    const existing = data.skills.find(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
    );
    skillIds.add(existing ? existing.id : demoCreateSkill(name).id);
  }

  const primary = [...skillIds][0] ?? null;
  const before = primary ? demoSkillMoment(primary) : null;

  const bareDate = /^\d{4}-\d{2}-\d{2}$/.test(input.occurredAt);
  const occurredAt = bareDate
    ? new Date(`${input.occurredAt}T12:00:00.000Z`)
    : new Date(input.occurredAt);

  const experience: DemoExperience = {
    id: `experience-${Date.now()}`,
    userId: DEMO_USER_ID,
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    occurredAt,
    minutes:
      input.minutes === null || input.minutes === undefined
        ? null
        : Math.max(0, Math.round(input.minutes)),
    source: input.source ?? "FORM",
    googleEventId: null,
    skills: [...skillIds].map((skillId) => ({ skillId })),
  };
  data.experiences.push(experience);

  recomputeProgress(data);

  const newMilestoneIds = data.skills
    .flatMap((s) => s.milestones)
    .filter((m) => m.achievedAt && !beforeIds.has(m.id))
    .map((m) => m.id);
  const newBadgeKeys = data.badges
    .filter((b) => !beforeBadges.has(b.badgeKey))
    .map((b) => b.badgeKey);

  const after = primary ? demoSkillMoment(primary) : null;

  return {
    experience: {
      id: experience.id,
      userId: experience.userId,
      occurredAt: experience.occurredAt,
      minutes: experience.minutes,
      googleEventId: null as string | null,
    },
    progress: { newMilestoneIds, newBadgeKeys },
    moment: before && after ? { before, after } : null,
  };
}

/** Creates the skill in the fixture set and returns it. */
export function demoCreateSkill(rawName: string): DemoSkill {
  const data = getDemoData();
  const name = rawName.trim();

  const base = slugify(name);
  let slug = base;
  let attempt = 2;
  while (data.skills.some((s) => s.slug === slug)) {
    slug = `${base}-${attempt++}`;
  }

  const template = pickTemplate(name);
  const skill: DemoSkill = {
    id: `skill-${slug}-${Math.random().toString(36).slice(2, 7)}`,
    userId: DEMO_USER_ID,
    name,
    slug,
    colorSeed: colorSeedFor(name),
    secondaryUnit: template?.secondaryUnit ?? null,
    templateKey: template?.key ?? null,
    createdAt: new Date(),
    archivedAt: null,
    milestones: ladderFor(name).map((step, index) => ({
      id: `milestone-${slug}-${index}-${Math.random().toString(36).slice(2, 5)}`,
      skillId: "",
      label: step.label,
      tier: step.tier,
      order: index,
      thresholdMinutes: step.hours ? step.hours * 60 : null,
      thresholdCount: step.sessions ?? null,
      achievedAt: null,
    })),
  };
  for (const milestone of skill.milestones) milestone.skillId = skill.id;

  data.skills.push(skill);
  return skill;
}

export function demoLogMaintenance(itemId: string) {
  const data = getDemoData();
  const item = data.maintenance.find((i) => i.id === itemId);
  item?.logs.push({
    id: `maintenance-log-${Date.now()}`,
    itemId,
    doneAt: new Date(),
  });
  recomputeProgress(data); // maintenance counts toward the Caretaker badge
}

export function demoUndoMaintenance(itemId: string) {
  const data = getDemoData();
  const item = data.maintenance.find((i) => i.id === itemId);
  if (!item || item.logs.length === 0) return;
  const latest = item.logs.reduce((a, b) => (b.doneAt > a.doneAt ? b : a));
  item.logs = item.logs.filter((log) => log.id !== latest.id);
}

/**
 * The progress sync, against fixtures. Milestones move from unachieved to
 * achieved only, dated at the experience that crossed them, and badge awards
 * are appended through the same award engine the write path uses. Awards are
 * never revoked, matching the product's rule that a medal once earned stays
 * earned.
 */
function recomputeProgress(data: DemoData) {
  const perSkill = new Map<string, { totalMinutes: number; experienceCount: number }>();
  const chronological = [...data.experiences].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );

  for (const experience of chronological) {
    for (const { skillId } of experience.skills) {
      const entry = perSkill.get(skillId) ?? { totalMinutes: 0, experienceCount: 0 };
      entry.totalMinutes += experience.minutes ?? 0;
      entry.experienceCount += 1;
      perSkill.set(skillId, entry);

      const skill = data.skills.find((s) => s.id === skillId);
      if (!skill) continue;
      for (const milestone of skill.milestones) {
        if (!milestone.achievedAt && isMilestoneMet(milestone, entry)) {
          milestone.achievedAt = experience.occurredAt;
        }
      }
    }
  }

  const achievedMilestoneCount = data.skills.reduce(
    (sum, skill) => sum + skill.milestones.filter((m) => m.achievedAt).length,
    0,
  );
  const maintenanceLogCount = data.maintenance.reduce(
    (sum, item) => sum + item.logs.length,
    0,
  );

  const pending = evaluateAwards(
    {
      now: new Date(),
      timezone: data.user.timezone,
      experiences: data.experiences.map((e) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        minutes: e.minutes,
        hasNotes: Boolean(e.notes && e.notes.trim().length > 0),
        skillIds: e.skills.map((s) => s.skillId),
      })),
      maintenanceLogCount,
      achievedMilestoneCount,
    },
    data.badges.map((b) => b.badgeKey),
  );

  for (const award of pending) {
    data.badges.push({
      id: `badge-${Math.random().toString(36).slice(2, 8)}`,
      userId: DEMO_USER_ID,
      badgeKey: award.badgeKey,
      awardedAt: new Date(),
      context: award.context,
    });
  }
}

/** URL-safe slug, mirrored from lib/growth/skills.ts. */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "skill"
  );
}
