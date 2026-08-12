"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSkillForUser, findOrCreateSkill } from "@/lib/growth/skills";
import { syncProgress } from "@/lib/progress/sync";
import {
  deleteExperienceEvent,
  upsertExperienceEvent,
} from "@/lib/google/calendar";

/**
 * Mirror an experience into the user's calendar without making the save depend
 * on it. Awaited (rather than fired and forgotten) so the event id is stored,
 * but every failure inside is already swallowed by the calendar module.
 */
async function syncCalendar(
  userId: string,
  experience: {
    id: string;
    title: string;
    notes: string | null;
    occurredAt: Date;
    minutes: number | null;
    googleEventId: string | null;
  },
) {
  const eventId = await upsertExperienceEvent(userId, experience);
  if (eventId && eventId !== experience.googleEventId) {
    await db.experience
      .update({ where: { id: experience.id }, data: { googleEventId: eventId } })
      .catch(() => {
        /* the event exists; losing the id only costs us a duplicate later */
      });
  }
}

export type ExperienceInput = {
  title: string;
  notes?: string | null;
  /** ISO date (YYYY-MM-DD) or full ISO timestamp. */
  occurredAt: string;
  minutes?: number | null;
  /** Existing skill ids. */
  skillIds?: string[];
  /** Skill names to attach, creating them if they don't exist yet. */
  skillNames?: string[];
  source?: "CHAT" | "FORM" | "CALENDAR";
  rawInput?: string | null;
  confidence?: number | null;
};

function parseOccurredAt(value: string): Date {
  // A bare date means "that day", and we anchor it at midday so that shifting
  // into any timezone keeps it on the same calendar date.
  const bareDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = bareDate ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Could not read the date "${value}"`);
  }
  return date;
}

/**
 * The single write path for experiences. Chat drafts and the structured form
 * both land here, so validation and progress recalculation cannot drift apart.
 */
export async function createExperience(input: ExperienceInput) {
  const userId = await requireUserId();

  const title = input.title.trim();
  if (!title) throw new Error("Give the experience a title");

  const minutes =
    input.minutes === null || input.minutes === undefined
      ? null
      : Math.max(0, Math.round(input.minutes));

  const skillIds = new Set(input.skillIds ?? []);

  // Names arrive from the extractor. Resolve against existing skills first so
  // "japanese" in a sentence attaches to the user's Japanese skill instead of
  // quietly creating a second one.
  for (const name of input.skillNames ?? []) {
    if (!name.trim()) continue;
    const skill = await findOrCreateSkill(userId, name);
    skillIds.add(skill.id);
  }

  // Only link skills that actually belong to this user — skillIds arrives from
  // the client, and a server action is reachable by direct POST.
  const owned = await db.skill.findMany({
    where: { userId, id: { in: [...skillIds] } },
    select: { id: true },
  });

  const experience = await db.experience.create({
    data: {
      userId,
      title,
      notes: input.notes?.trim() || null,
      occurredAt: parseOccurredAt(input.occurredAt),
      minutes,
      source: input.source ?? "FORM",
      rawInput: input.rawInput ?? null,
      confidence: input.confidence ?? null,
      skills: { create: owned.map((skill) => ({ skillId: skill.id })) },
    },
  });

  const progress = await syncProgress(userId);
  await syncCalendar(userId, experience);
  revalidatePath("/", "layout");

  return { experience, progress };
}

export async function createExperienceFromForm(formData: FormData) {
  const rawMinutes = String(formData.get("minutes") ?? "").trim();
  const skillIds = formData.getAll("skillIds").map(String).filter(Boolean);
  const newSkill = String(formData.get("newSkill") ?? "").trim();

  await createExperience({
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    minutes: rawMinutes ? Number(rawMinutes) : null,
    skillIds,
    skillNames: newSkill ? [newSkill] : [],
    source: "FORM",
  });
}

export async function updateExperience(input: {
  id: string;
  title?: string;
  notes?: string | null;
  occurredAt?: string;
  minutes?: number | null;
  skillIds?: string[];
}) {
  const userId = await requireUserId();

  const existing = await db.experience.findUnique({
    where: { id: input.id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== userId) {
    throw new Error("Experience not found");
  }

  if (input.skillIds) {
    const owned = await db.skill.findMany({
      where: { userId, id: { in: input.skillIds } },
      select: { id: true },
    });
    await db.experienceSkill.deleteMany({ where: { experienceId: input.id } });
    await db.experienceSkill.createMany({
      data: owned.map((skill) => ({ experienceId: input.id, skillId: skill.id })),
      skipDuplicates: true,
    });
  }

  const updated = await db.experience.update({
    where: { id: input.id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.occurredAt !== undefined
        ? { occurredAt: parseOccurredAt(input.occurredAt) }
        : {}),
      ...(input.minutes !== undefined
        ? { minutes: input.minutes === null ? null : Math.max(0, Math.round(input.minutes)) }
        : {}),
    },
  });

  // A full recompute, so lowering a duration below a threshold is handled by
  // the same path as raising it above one.
  await syncProgress(userId);
  await syncCalendar(userId, updated);
  revalidatePath("/", "layout");
}

export async function deleteExperience(id: string) {
  const userId = await requireUserId();

  const existing = await db.experience.findUnique({
    where: { id },
    select: { userId: true, googleEventId: true },
  });
  if (!existing || existing.userId !== userId) {
    throw new Error("Experience not found");
  }

  await db.experience.delete({ where: { id } });
  // Remove the mirror too — a deleted experience that lingers in the calendar
  // makes the record untrustworthy in exactly the way this product can't afford.
  await deleteExperienceEvent(userId, existing.googleEventId);
  await syncProgress(userId);
  revalidatePath("/", "layout");
}

export async function createSkill(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Give the skill a name");

  await createSkillForUser(userId, name);
  revalidatePath("/", "layout");
}
