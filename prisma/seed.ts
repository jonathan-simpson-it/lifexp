/**
 * Demo data.
 *
 * Six months of plausible history for one user, shaped so that every surface in
 * the app has something real to show on first load: a skill deep into its
 * ladder, one just started, a deliberate 34-day gap that earns "The Return", a
 * near-empty month that earns "Quiet Month", and maintenance items at a spread
 * of freshness.
 *
 * Deterministic — a seeded PRNG, and dates measured back from a fixed anchor —
 * so screenshots and tests do not drift between runs.
 *
 * Run with: npm run seed
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { createSkillForUser } from "../src/lib/growth/skills";
import { syncProgress } from "../src/lib/progress/sync";

const DEMO_EMAIL = "demo@lifexp.local";
const DAY = 86_400_000;

// Mulberry32 — small, fast, and reproducible.
function makeRandom(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20260812);

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

/**
 * `daysAgo` days before now, at a given hour.
 *
 * Built in UTC rather than with `setHours`, which would use whatever timezone
 * the seeding machine happens to be in and produce different badges on a
 * developer's laptop than in CI. The demo user's timezone is UTC to match, so
 * "recorded at 06:00" means exactly that on every machine.
 */
function at(daysAgo: number, hour: number, minute = 0): Date {
  const d = new Date(Date.now() - daysAgo * DAY);
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      hour,
      minute,
      0,
      0,
    ),
  );
}

/**
 * A genuine period away from LifeXP — no skill logged anything. This is what
 * "The Return" is meant to notice, so it has to be a gap in the whole record,
 * not just in one skill.
 */
const QUIET_FROM_DAYS_AGO = 96;
const QUIET_TO_DAYS_AGO = 62;

function isQuietPeriod(daysAgo: number): boolean {
  return daysAgo <= QUIET_FROM_DAYS_AGO && daysAgo >= QUIET_TO_DAYS_AGO;
}

async function main() {
  console.log("Seeding LifeXP demo data…");

  // Start clean so re-running the seed is safe. Cascades handle the rest.
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await db.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo",
      // Matches the UTC dates built by `at()`, so hour-of-day badges behave
      // identically wherever the seed runs.
      timezone: "UTC",
    },
  });

  const japanese = await createSkillForUser(user.id, "Japanese");
  const piano = await createSkillForUser(user.id, "Piano");
  const running = await createSkillForUser(user.id, "Running");
  const reading = await createSkillForUser(user.id, "Reading");

  type Plan = {
    daysAgo: number;
    hour: number;
    title: string;
    minutes: number | null;
    skills: string[];
    notes?: string;
  };

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
  // Nearly two years of it, so the dashboard has one genuinely mature skill
  // sitting mid-ladder. A demo where everything is near zero cannot show what
  // the product is for.
  for (let daysAgo = 700; daysAgo >= 0; daysAgo -= 2) {
    if (isQuietPeriod(daysAgo)) continue;
    if (random() < 0.25) continue;

    const title = pick(japaneseTitles);
    plans.push({
      daysAgo,
      hour: random() < 0.3 ? 6 : 19,
      title,
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

  // Reading: the newest skill, only a few weeks old, so the dashboard shows
  // what a skill looks like near the bottom of its ladder.
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

  // A couple of genuinely cross-skill experiences. These are the ones that make
  // the "count minutes fully per skill, dedupe across skills" rule observable.
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

  // One experience with no duration at all — evidence without a number.
  plans.push({
    daysAgo: 2,
    hour: 13,
    title: "Ordered lunch entirely in Japanese",
    minutes: null,
    skills: [japanese.id],
    notes: "No idea how long it took. Felt enormous.",
  });

  for (const plan of plans) {
    await db.experience.create({
      data: {
        userId: user.id,
        title: plan.title,
        notes: plan.notes ?? null,
        occurredAt: at(plan.daysAgo, plan.hour, Math.floor(random() * 60)),
        minutes: plan.minutes,
        source: "FORM",
        skills: { create: plan.skills.map((skillId) => ({ skillId })) },
      },
    });
  }

  // Maintenance, spread across the freshness gradient: one just done, one
  // roughly due, one well past its usual rhythm. None of them are "late".
  const maintenance: Array<{ name: string; intervalDays: number; lastDoneDaysAgo: number[] }> =
    [
      { name: "Change bedsheets", intervalDays: 14, lastDoneDaysAgo: [12, 27, 40, 55] },
      { name: "Vacuum", intervalDays: 7, lastDoneDaysAgo: [9, 16, 22, 30, 38] },
      { name: "Water plants", intervalDays: 5, lastDoneDaysAgo: [4, 9, 15, 20] },
      { name: "Laundry", intervalDays: 7, lastDoneDaysAgo: [2, 9, 17, 24, 31] },
      { name: "Gym", intervalDays: 3, lastDoneDaysAgo: [1, 4, 8, 11, 14, 18] },
      { name: "Clean the fridge", intervalDays: 30, lastDoneDaysAgo: [26, 61] },
    ];

  for (const item of maintenance) {
    await db.maintenanceItem.create({
      data: {
        userId: user.id,
        name: item.name,
        intervalDays: item.intervalDays,
        logs: {
          create: item.lastDoneDaysAgo.map((daysAgo) => ({
            doneAt: at(daysAgo, 11),
          })),
        },
      },
    });
  }

  const result = await syncProgress(user.id);

  const experienceCount = await db.experience.count({ where: { userId: user.id } });
  console.log(`  user            ${DEMO_EMAIL}`);
  console.log(`  skills          4`);
  console.log(`  experiences     ${experienceCount}`);
  console.log(`  milestones hit  ${result.newMilestoneIds.length}`);
  console.log(`  badges earned   ${result.newBadgeKeys.join(", ") || "none"}`);
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
