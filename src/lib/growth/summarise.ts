/**
 * Pure aggregation helpers.
 *
 * Split out from `aggregate.ts` specifically so they carry no Prisma import and
 * can be unit-tested without a database — the same rule the progress and
 * maintenance modules follow.
 */

const DAY = 86_400_000;

export type CountableExperience = {
  id: string;
  occurredAt: Date;
  minutes: number | null;
  skills: { skillId: string }[];
};

export type WeekSummary = {
  skillCount: number;
  minutes: number;
  experienceCount: number;
};

/**
 * "3 skills · 18h · 5 new experiences".
 *
 * Minutes are summed over DISTINCT experiences. An evening that counted toward
 * both Japanese and Reading is 75 minutes of the user's life, not 150 — even
 * though it is legitimately 75 minutes against each skill's own total.
 */
export function summariseWeek(
  experiences: CountableExperience[],
  now = new Date(),
): WeekSummary {
  const cutoff = now.getTime() - 7 * DAY;
  const recent = experiences.filter((e) => e.occurredAt.getTime() >= cutoff);

  const skills = new Set<string>();
  let minutes = 0;
  for (const experience of recent) {
    minutes += experience.minutes ?? 0; // once per experience, not per skill
    experience.skills.forEach((s) => skills.add(s.skillId));
  }

  return {
    skillCount: skills.size,
    minutes,
    experienceCount: recent.length,
  };
}

/**
 * Day-bucketed activity counts for the contribution heatmap, oldest first.
 * Buckets are UTC days; at personal scale the off-by-a-few-hours at timezone
 * edges is not worth per-user day boundaries here.
 */
export function bucketByDay(
  dates: Date[],
  days: number,
  now = new Date(),
): { date: Date; count: number }[] {
  const buckets = new Map<string, number>();
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const out: { date: Date; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * DAY);
    const key = day.toISOString().slice(0, 10);
    out.push({ date: day, count: buckets.get(key) ?? 0 });
  }
  return out;
}
