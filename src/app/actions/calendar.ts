"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { signIn, signOut, CALENDAR_SCOPE } from "@/lib/auth";
import { ensureLifeXPCalendar, upsertExperienceEvent } from "@/lib/google/calendar";

/**
 * Incremental consent.
 *
 * Sends the user back through Google asking for the calendar scope *in addition
 * to* what they already granted, so signing in never required this permission
 * in the first place.
 */
export async function connectCalendar() {
  await requireUserId();
  await signIn(
    "google",
    { redirectTo: "/settings?calendar=connected" },
    {
      scope: `openid email profile ${CALENDAR_SCOPE}`,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    },
  );
}

/**
 * Stop syncing, from LifeXP's side.
 *
 * Deliberately does NOT delete the calendar or its events: they are the user's
 * record of their own life, and silently destroying it because they turned off
 * a toggle would be the wrong default. The Settings copy says so.
 */
export async function disconnectCalendar() {
  const userId = await requireUserId();

  await db.account.updateMany({
    where: { userId, provider: "google" },
    data: { scope: "openid email profile" },
  });
  await db.user.update({
    where: { id: userId },
    data: { calendarSyncError: null },
  });

  revalidatePath("/settings");
}

/**
 * Mirrors everything not yet in the calendar. Used right after connecting.
 *
 * Returns void because it is bound directly to a `<form action>`; the page
 * recomputes the outstanding count after revalidation, so there is nothing the
 * caller needs back.
 */
export async function backfillCalendar(): Promise<void> {
  const userId = await requireUserId();

  const calendarId = await ensureLifeXPCalendar(userId);
  if (!calendarId) return;

  const pending = await db.experience.findMany({
    where: { userId, googleEventId: null },
    orderBy: { occurredAt: "desc" },
    // Bounded on purpose: a first backfill for a long-time user could be
    // thousands of events and trip Google's rate limits. The rest sync as they
    // are edited, and the button can be pressed again.
    take: 100,
  });

  for (const experience of pending) {
    const eventId = await upsertExperienceEvent(userId, experience);
    if (!eventId) break; // something is wrong; stop rather than hammer the API
    await db.experience.update({
      where: { id: experience.id },
      data: { googleEventId: eventId },
    });
  }

  revalidatePath("/settings");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}
