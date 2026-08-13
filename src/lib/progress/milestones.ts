/**
 * Milestone ladders.
 *
 * Deliberately dependency-free, no Prisma import, so this and the award
 * engine can be unit-tested without a generated client or a database. The tier
 * strings match the Prisma `MilestoneTier` enum by value, which is all Prisma
 * requires when writing.
 */

export type MilestoneTier =
  | "FIRST_STEPS"
  | "FOUNDATION"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "MASTERY"
  | "CUSTOM";

export type LadderStep = {
  label: string;
  tier: MilestoneTier;
  /** Hours of accumulated evidence. Mutually exclusive with `sessions`. */
  hours?: number;
  /** Number of recorded experiences. Mutually exclusive with `hours`. */
  sessions?: number;
};

export type SkillTemplate = {
  key: string;
  label: string;
  /** Decorative unit shown next to hours, never used to award anything. */
  secondaryUnit?: string;
  /** Substrings that make this template a reasonable guess for a skill name. */
  match: string[];
  ladder: LadderStep[];
};

/**
 * The default ladder, applied when no template matches. Spacing widens as it
 * climbs so that early progress is visible within days and later steps still
 * mean something after years.
 */
export const DEFAULT_LADDER: LadderStep[] = [
  { label: "First Steps", tier: "FIRST_STEPS", hours: 10 },
  { label: "Foundation", tier: "FOUNDATION", hours: 50 },
  { label: "Bronze", tier: "BRONZE", hours: 150 },
  { label: "Silver", tier: "SILVER", hours: 400 },
  { label: "Gold", tier: "GOLD", hours: 800 },
  { label: "Mastery", tier: "MASTERY", hours: 1300 },
];

export const TEMPLATES: SkillTemplate[] = [
  {
    key: "language",
    label: "Language",
    // Hour figures follow the ladder in the PRD (150 / 400 / 800 / 1300).
    // The "≈" is doing real work: hours are evidence of study, not a test
    // result, and the app should never imply the user has passed anything.
    match: [
      "japanese",
      "spanish",
      "french",
      "german",
      "korean",
      "mandarin",
      "chinese",
      "italian",
      "portuguese",
      "arabic",
      "language",
    ],
    ladder: [
      { label: "First Words", tier: "FIRST_STEPS", hours: 10 },
      { label: "Foundation", tier: "FOUNDATION", hours: 150 },
      { label: "Elementary ≈ N5", tier: "BRONZE", hours: 400 },
      { label: "Intermediate ≈ N4", tier: "SILVER", hours: 800 },
      { label: "Advanced ≈ N3", tier: "GOLD", hours: 1300 },
      { label: "Fluency", tier: "MASTERY", hours: 2200 },
    ],
  },
  {
    key: "music",
    label: "Music",
    // Practice is measured in sessions here: showing up at the piano for
    // twenty minutes daily builds more than one long weekend session, and the
    // PRD's own example counts Piano in sessions.
    match: ["piano", "guitar", "violin", "drums", "singing", "music", "cello", "bass"],
    ladder: [
      { label: "First Steps", tier: "FIRST_STEPS", sessions: 10 },
      { label: "Foundation", tier: "FOUNDATION", sessions: 50 },
      { label: "Bronze", tier: "BRONZE", sessions: 150 },
      { label: "Silver", tier: "SILVER", sessions: 400 },
      { label: "Gold", tier: "GOLD", sessions: 800 },
      { label: "Mastery", tier: "MASTERY", sessions: 1500 },
    ],
  },
  {
    key: "reading",
    label: "Reading",
    secondaryUnit: "books",
    match: ["reading", "read", "books", "literature"],
    ladder: DEFAULT_LADDER,
  },
  {
    key: "fitness",
    label: "Fitness",
    secondaryUnit: "km",
    match: [
      "gym",
      "running",
      "run",
      "cycling",
      "swimming",
      "fitness",
      "climbing",
      "yoga",
      "skiing",
      "ski",
    ],
    ladder: DEFAULT_LADDER,
  },
  {
    key: "mindfulness",
    label: "Mindfulness",
    match: ["meditation", "meditate", "mindfulness", "therapy", "journaling", "gratitude"],
    ladder: [
      { label: "First Steps", tier: "FIRST_STEPS", sessions: 10 },
      { label: "Foundation", tier: "FOUNDATION", sessions: 50 },
      { label: "Bronze", tier: "BRONZE", sessions: 150 },
      { label: "Silver", tier: "SILVER", sessions: 365 },
      { label: "Gold", tier: "GOLD", sessions: 750 },
      { label: "Mastery", tier: "MASTERY", sessions: 1500 },
    ],
  },
  {
    key: "craft",
    label: "Craft",
    match: [
      "drawing",
      "painting",
      "photography",
      "writing",
      "cooking",
      "woodworking",
      "pottery",
      "design",
      "coding",
      "programming",
      "public speaking",
      "speaking",
    ],
    ladder: DEFAULT_LADDER,
  },
];

/** Best-guess template for a skill name. Falls back to the generic ladder. */
export function pickTemplate(skillName: string): SkillTemplate | null {
  const name = skillName.toLowerCase();
  return (
    TEMPLATES.find((template) =>
      template.match.some((needle) => name.includes(needle)),
    ) ?? null
  );
}

/** The ladder a newly created skill should start with. */
export function ladderFor(skillName: string): LadderStep[] {
  return pickTemplate(skillName)?.ladder ?? DEFAULT_LADDER;
}

export type MilestoneRow = {
  id: string;
  label: string;
  tier: MilestoneTier;
  order: number;
  thresholdMinutes: number | null;
  thresholdCount: number | null;
  achievedAt: Date | null;
};

export type SkillProgress = {
  totalMinutes: number;
  experienceCount: number;
};

/** True when the evidence so far satisfies this milestone's threshold. */
export function isMilestoneMet(
  milestone: Pick<MilestoneRow, "thresholdMinutes" | "thresholdCount">,
  progress: SkillProgress,
): boolean {
  if (milestone.thresholdMinutes !== null) {
    return progress.totalMinutes >= milestone.thresholdMinutes;
  }
  if (milestone.thresholdCount !== null) {
    return progress.experienceCount >= milestone.thresholdCount;
  }
  // A custom, unmeasurable goal ("ski intermediate slopes confidently").
  // Only the user can say when that is true.
  return false;
}

/**
 * How far along the current step we are, and what comes next.
 *
 * `fraction` is progress through the *current* step rather than from zero, so
 * a skill at 390 of 400 hours reads as nearly-there instead of a bar that
 * barely moves for months.
 */
export function nextMilestone(
  milestones: MilestoneRow[],
  progress: SkillProgress,
): {
  next: MilestoneRow | null;
  previous: MilestoneRow | null;
  fraction: number;
  remainingLabel: string | null;
  /**
   * The same distance as `remainingLabel`, unformatted.
   *
   * The reward moment animates this value downward as the log lands, which
   * needs a number, a formatted string cannot be interpolated. Null once
   * every milestone is reached.
   */
  remaining: number | null;
  /** What `remaining` counts, so the client can format it the same way. */
  remainingUnit: "minutes" | "sessions" | null;
} {
  const measurable = milestones
    .filter((m) => m.thresholdMinutes !== null || m.thresholdCount !== null)
    .sort((a, b) => a.order - b.order);

  const next = measurable.find((m) => !isMilestoneMet(m, progress)) ?? null;
  if (!next) {
    return {
      next: null,
      previous: measurable.at(-1) ?? null,
      fraction: 1,
      remainingLabel: null,
      remaining: null,
      remainingUnit: null,
    };
  }

  const previous = measurable[measurable.indexOf(next) - 1] ?? null;

  const usesMinutes = next.thresholdMinutes !== null;
  const current = usesMinutes ? progress.totalMinutes : progress.experienceCount;
  const target = usesMinutes ? next.thresholdMinutes! : next.thresholdCount!;
  const floor = usesMinutes
    ? (previous?.thresholdMinutes ?? 0)
    : (previous?.thresholdCount ?? 0);

  const span = Math.max(target - floor, 1);
  const fraction = Math.min(Math.max((current - floor) / span, 0), 1);

  const remaining = Math.max(target - current, 0);
  const remainingLabel = usesMinutes
    ? `${formatHours(remaining)} to go`
    : `${remaining} ${remaining === 1 ? "session" : "sessions"} to go`;

  return {
    next,
    previous,
    fraction,
    remainingLabel,
    remaining,
    remainingUnit: usesMinutes ? "minutes" : "sessions",
  };
}

/** "1.5h", "327h", "45m", compact and never zero-padded. */
export function formatHours(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  return hours >= 100
    ? `${Math.round(hours)}h`
    : `${Number(hours.toFixed(1))}h`;
}
