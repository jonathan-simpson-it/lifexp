import { db } from "@/lib/db";
import { ladderFor, pickTemplate } from "@/lib/progress/milestones";

/** URL-safe, collision-checked per user. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "skill"
  );
}

/** Stable per-name colour so a skill looks identical on every screen. */
export function colorSeedFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

/**
 * Create a skill and seed its milestone ladder from the best-matching template.
 *
 * Milestones are copied into rows rather than referenced from the template, so
 * that editing a template later never silently moves the goalposts under a user
 * who has already been climbing toward them.
 */
export async function createSkillForUser(userId: string, rawName: string) {
  const name = rawName.trim();
  if (!name) throw new Error("Skill name is required");

  const base = slugify(name);
  let slug = base;

  // Cheap uniqueness loop; skills per user are counted in tens, not thousands.
  for (let attempt = 2; ; attempt++) {
    const clash = await db.skill.findUnique({
      where: { userId_slug: { userId, slug } },
      select: { id: true },
    });
    if (!clash) break;
    slug = `${base}-${attempt}`;
  }

  const template = pickTemplate(name);
  const ladder = ladderFor(name);

  return db.skill.create({
    data: {
      userId,
      name,
      slug,
      colorSeed: colorSeedFor(name),
      templateKey: template?.key ?? null,
      secondaryUnit: template?.secondaryUnit ?? null,
      milestones: {
        create: ladder.map((step, index) => ({
          label: step.label,
          tier: step.tier,
          order: index,
          thresholdMinutes: step.hours ? step.hours * 60 : null,
          thresholdCount: step.sessions ?? null,
          origin: "TEMPLATE" as const,
        })),
      },
    },
    include: { milestones: true },
  });
}

/**
 * Find a skill by name for this user, or create it. Used by the chat extractor,
 * where "Japanese" in a sentence should attach to the existing Japanese skill
 * rather than quietly making a second one.
 */
export async function findOrCreateSkill(userId: string, rawName: string) {
  const name = rawName.trim();
  const existing = await db.skill.findFirst({
    where: {
      userId,
      archivedAt: null,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (existing) return existing;
  return createSkillForUser(userId, name);
}
