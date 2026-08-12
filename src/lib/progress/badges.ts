/**
 * Global badge definitions.
 *
 * The philosophical centre of the app lives in this file. Every predicate here
 * rewards accumulation, breadth, or *returning* — never consecutive days. There
 * is deliberately no streak badge, and `quiet-month` exists specifically to
 * celebrate a month where almost nothing happened.
 *
 * Definitions live in code, not the database; only awards are persisted. That
 * means we can add a badge in a deploy and existing users earn it retroactively
 * the next time anything is written.
 *
 * Pure and Prisma-free so it can be unit-tested directly.
 */

export type BadgeKey =
  | "first-experience"
  | "the-return"
  | "polymath"
  | "deep-diver"
  | "hundred-hours"
  | "first-milestone"
  | "night-owl"
  | "early-bird"
  | "quiet-month"
  | "caretaker"
  | "storyteller"
  | "year-one";

export type SnapshotExperience = {
  id: string;
  occurredAt: Date;
  minutes: number | null;
  hasNotes: boolean;
  skillIds: string[];
};

export type AwardSnapshot = {
  now: Date;
  /** IANA zone, for hour-of-day and month-boundary questions. */
  timezone: string;
  experiences: SnapshotExperience[];
  maintenanceLogCount: number;
  achievedMilestoneCount: number;
};

export type BadgeDefinition = {
  key: BadgeKey;
  title: string;
  /** Shown once earned. Written to sound like an observation, not a score. */
  description: string;
  /** Shown while unearned, or null to keep it a surprise (renders as "? ? ?"). */
  hint: string | null;
  /** lucide-react icon name. */
  icon: string;
  /** Returns false, or a truthy context object recorded alongside the award. */
  earned: (s: AwardSnapshot) => false | Record<string, unknown>;
};

// --- helpers ---------------------------------------------------------------

const DAY_MS = 86_400_000;

/** Calendar fields of a date as they read in a given timezone. */
function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

function byOccurredAt(a: SnapshotExperience, b: SnapshotExperience) {
  return a.occurredAt.getTime() - b.occurredAt.getTime();
}

function totalMinutes(s: AwardSnapshot) {
  return s.experiences.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
}

/** Counts experiences whose local hour satisfies `test`. */
function countByHour(s: AwardSnapshot, test: (hour: number) => boolean) {
  return s.experiences.filter((e) => test(zonedParts(e.occurredAt, s.timezone).hour))
    .length;
}

// --- definitions -----------------------------------------------------------

export const BADGES: BadgeDefinition[] = [
  {
    key: "first-experience",
    title: "First Experience",
    description: "You recorded something. That is the whole trick.",
    hint: "Record your first experience",
    icon: "Sprout",
    earned: (s) => s.experiences.length > 0 && { at: s.experiences[0].occurredAt },
  },
  {
    key: "the-return",
    title: "The Return",
    description: "You came back after a long gap. Nothing was lost.",
    hint: "Come back after time away",
    icon: "RotateCcw",
    // The anti-streak. Explicitly rewards the thing a streak counter punishes.
    earned: (s) => {
      const sorted = [...s.experiences].sort(byOccurredAt);
      let longest = 0;
      for (let i = 1; i < sorted.length; i++) {
        const gap = Math.floor(
          (sorted[i].occurredAt.getTime() - sorted[i - 1].occurredAt.getTime()) /
            DAY_MS,
        );
        if (gap > longest) longest = gap;
      }
      return longest >= 21 && { quietDays: longest };
    },
  },
  {
    key: "polymath",
    title: "Polymath",
    description: "Three different skills inside a single week.",
    hint: "Explore three skills in one week",
    icon: "Globe",
    earned: (s) => {
      const sorted = [...s.experiences].sort(byOccurredAt);
      for (let i = 0; i < sorted.length; i++) {
        const windowEnd = sorted[i].occurredAt.getTime() + 7 * DAY_MS;
        const skills = new Set<string>();
        for (let j = i; j < sorted.length; j++) {
          if (sorted[j].occurredAt.getTime() > windowEnd) break;
          sorted[j].skillIds.forEach((id) => skills.add(id));
        }
        if (skills.size >= 3) return { skills: skills.size };
      }
      return false;
    },
  },
  {
    key: "deep-diver",
    title: "Deep Diver",
    description: "Four hours in one sitting.",
    hint: "Spend four hours on one thing at once",
    icon: "Anchor",
    earned: (s) => {
      const longest = Math.max(0, ...s.experiences.map((e) => e.minutes ?? 0));
      return longest >= 240 && { minutes: longest };
    },
  },
  {
    key: "hundred-hours",
    title: "Hundred Hours",
    description: "A hundred hours of your life, made visible.",
    hint: null,
    icon: "Mountain",
    earned: (s) => {
      const minutes = totalMinutes(s);
      return minutes >= 6000 && { minutes };
    },
  },
  {
    key: "first-milestone",
    title: "Milestone",
    description: "A skill reached its first marker.",
    hint: "Reach a milestone in any skill",
    icon: "Flag",
    earned: (s) =>
      s.achievedMilestoneCount > 0 && { milestones: s.achievedMilestoneCount },
  },
  {
    key: "night-owl",
    title: "Night Owl",
    description: "Ten experiences recorded after dark.",
    hint: null,
    icon: "Moon",
    earned: (s) => {
      const n = countByHour(s, (h) => h >= 22 || h < 4);
      return n >= 10 && { count: n };
    },
  },
  {
    key: "early-bird",
    title: "Early Bird",
    description: "Ten experiences before the day properly started.",
    hint: null,
    icon: "Sunrise",
    earned: (s) => {
      const n = countByHour(s, (h) => h >= 4 && h < 7);
      return n >= 10 && { count: n };
    },
  },
  {
    key: "quiet-month",
    title: "Quiet Month",
    description: "A slow month, and you still showed up. That counts.",
    hint: null,
    icon: "Feather",
    // Only looks at *completed* months, so it can never fire on the 1st and
    // imply that the month now underway is already a write-off.
    earned: (s) => {
      const nowParts = zonedParts(s.now, s.timezone);
      const currentKey = nowParts.year * 100 + nowParts.month;

      const perMonth = new Map<number, number>();
      for (const e of s.experiences) {
        const p = zonedParts(e.occurredAt, s.timezone);
        const key = p.year * 100 + p.month;
        if (key >= currentKey) continue;
        perMonth.set(key, (perMonth.get(key) ?? 0) + 1);
      }

      for (const [key, count] of perMonth) {
        if (count >= 1 && count < 3) return { month: key, count };
      }
      return false;
    },
  },
  {
    key: "caretaker",
    title: "Caretaker",
    description: "Twenty-five acts of looking after your life.",
    hint: "Keep up with maintenance",
    icon: "Home",
    earned: (s) =>
      s.maintenanceLogCount >= 25 && { logs: s.maintenanceLogCount },
  },
  {
    key: "storyteller",
    title: "Storyteller",
    description: "Twenty experiences you bothered to write about.",
    hint: null,
    icon: "PenLine",
    earned: (s) => {
      const n = s.experiences.filter((e) => e.hasNotes).length;
      return n >= 20 && { count: n };
    },
  },
  {
    key: "year-one",
    title: "Year One",
    description: "A year of evidence. Look how far back it goes.",
    hint: null,
    icon: "TreePine",
    earned: (s) => {
      const first = [...s.experiences].sort(byOccurredAt)[0];
      if (!first) return false;
      const days = Math.floor(
        (s.now.getTime() - first.occurredAt.getTime()) / DAY_MS,
      );
      return days >= 365 && { days };
    },
  },
];

export const BADGES_BY_KEY = new Map(BADGES.map((b) => [b.key, b]));
