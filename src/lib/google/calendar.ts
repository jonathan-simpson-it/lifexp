import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { CALENDAR_SCOPE } from "@/lib/auth";

/**
 * Google Calendar write-back.
 *
 * Two rules shape everything here:
 *
 * 1. LifeXP writes to a calendar it created and to nothing else. The scope we
 *    request (`calendar.app.created`) makes that a guarantee enforced by
 *    Google, not a promise enforced by our own care.
 * 2. Calendar sync is never allowed to fail a user's action. Every function
 *    below is best-effort: a failure is recorded on the user row and surfaced
 *    as a quiet banner, and the experience is still saved.
 */

const CALENDAR_NAME = "LifeXP";

/** Default block for an experience with no stated duration. */
const DEFAULT_EVENT_MINUTES = 30;

export type CalendarStatus =
  | { state: "unavailable"; reason: string }
  | { state: "not-connected" }
  | { state: "connected"; calendarId: string | null; error: string | null };

async function getGoogleAccount(userId: string) {
  return db.account.findFirst({
    where: { userId, provider: "google" },
  });
}

export async function getCalendarStatus(userId: string): Promise<CalendarStatus> {
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    return {
      state: "unavailable",
      reason: "Google sign-in isn't configured for this deployment.",
    };
  }

  const account = await getGoogleAccount(userId);
  if (!account || !account.scope?.includes(CALENDAR_SCOPE)) {
    return { state: "not-connected" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lifexpCalendarId: true, calendarSyncError: true },
  });

  return {
    state: "connected",
    calendarId: user?.lifexpCalendarId ?? null,
    error: user?.calendarSyncError ?? null,
  };
}

/**
 * An OAuth client for this user, or null if they haven't granted calendar
 * access. Refreshed tokens are written back so the grant survives the hour-long
 * access token expiry without the user noticing.
 */
async function getClient(userId: string): Promise<OAuth2Client | null> {
  const account = await getGoogleAccount(userId);
  if (!account?.scope?.includes(CALENDAR_SCOPE)) return null;
  if (!account.access_token && !account.refresh_token) return null;

  const client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );

  client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  client.on("tokens", (tokens) => {
    void db.account
      .update({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          ...(tokens.access_token ? { access_token: tokens.access_token } : {}),
          // Google only re-issues a refresh token occasionally; never overwrite
          // a good one with undefined.
          ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
          ...(tokens.expiry_date
            ? { expires_at: Math.floor(tokens.expiry_date / 1000) }
            : {}),
        },
      })
      .catch((error) => {
        console.error("[lifexp] failed to persist refreshed Google tokens:", error);
      });
  });

  return client;
}

async function recordSyncError(userId: string, message: string | null) {
  await db.user
    .update({ where: { id: userId }, data: { calendarSyncError: message } })
    .catch(() => {
      /* the banner is a nicety; never let it break the caller */
    });
}

/**
 * The user's LifeXP calendar, creating it on first use.
 *
 * A separate calendar rather than their primary one: it keeps a log of what
 * they did out of the way of appointments, and it means turning the whole thing
 * off is one click in Google Calendar rather than a cleanup job.
 */
export async function ensureLifeXPCalendar(userId: string): Promise<string | null> {
  const client = await getClient(userId);
  if (!client) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lifexpCalendarId: true },
  });

  const calendar = google.calendar({ version: "v3", auth: client });

  if (user?.lifexpCalendarId) {
    // Confirm it still exists — the user may have deleted it on their end.
    try {
      await calendar.calendars.get({ calendarId: user.lifexpCalendarId });
      return user.lifexpCalendarId;
    } catch {
      await db.user.update({
        where: { id: userId },
        data: { lifexpCalendarId: null },
      });
    }
  }

  const created = await calendar.calendars.insert({
    requestBody: {
      summary: CALENDAR_NAME,
      description:
        "Experiences recorded in LifeXP. Safe to hide or delete — LifeXP keeps its own copy.",
    },
  });

  const calendarId = created.data.id ?? null;
  if (calendarId) {
    await db.user.update({
      where: { id: userId },
      data: { lifexpCalendarId: calendarId, calendarSyncError: null },
    });
  }

  return calendarId;
}

type SyncableExperience = {
  id: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  minutes: number | null;
  googleEventId: string | null;
};

/**
 * Exported so Settings can show exactly what LifeXP would write, using the same
 * builder that actually talks to Google rather than a mock-up that can drift
 * away from it. That preview is how the calendar feature stays inspectable on a
 * machine with no Google credentials.
 */
export function buildEventBody(experience: SyncableExperience) {
  return eventBody(experience);
}

function eventBody(experience: SyncableExperience) {
  const description = [
    experience.notes,
    experience.minutes === null ? null : `${experience.minutes} minutes`,
    "Recorded in LifeXP",
  ]
    .filter(Boolean)
    .join("\n\n");

  // No duration means we genuinely don't know when in the day it happened, so
  // an all-day entry is more honest than inventing a 30-minute block at a
  // timestamp the user never gave us.
  if (experience.minutes === null) {
    const date = experience.occurredAt.toISOString().slice(0, 10);
    const nextDay = new Date(experience.occurredAt.getTime() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    return {
      summary: experience.title,
      description,
      start: { date },
      end: { date: nextDay },
    };
  }

  const minutes = Math.max(experience.minutes, 1) || DEFAULT_EVENT_MINUTES;
  const end = new Date(experience.occurredAt.getTime() + minutes * 60_000);

  return {
    summary: experience.title,
    description,
    start: { dateTime: experience.occurredAt.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

/**
 * Mirror an experience into the user's LifeXP calendar.
 *
 * Returns the event id, or null if the user hasn't connected calendar access.
 * Never throws — callers treat calendar sync as a side effect of saving, not a
 * precondition for it.
 */
export async function upsertExperienceEvent(
  userId: string,
  experience: SyncableExperience,
): Promise<string | null> {
  try {
    const client = await getClient(userId);
    if (!client) return null;

    const calendarId = await ensureLifeXPCalendar(userId);
    if (!calendarId) return null;

    const calendar = google.calendar({ version: "v3", auth: client });
    const requestBody = eventBody(experience);

    if (experience.googleEventId) {
      try {
        const updated = await calendar.events.update({
          calendarId,
          eventId: experience.googleEventId,
          requestBody,
        });
        await recordSyncError(userId, null);
        return updated.data.id ?? experience.googleEventId;
      } catch {
        // The event was deleted in Google. Fall through and make a new one
        // rather than leaving the experience permanently unsynced.
      }
    }

    const created = await calendar.events.insert({ calendarId, requestBody });
    await recordSyncError(userId, null);
    return created.data.id ?? null;
  } catch (error) {
    console.error("[lifexp] calendar write failed:", error);
    await recordSyncError(
      userId,
      "Couldn't reach Google Calendar. Your experiences are saved — syncing will resume automatically.",
    );
    return null;
  }
}

export async function deleteExperienceEvent(
  userId: string,
  googleEventId: string | null,
): Promise<void> {
  if (!googleEventId) return;

  try {
    const client = await getClient(userId);
    if (!client) return;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { lifexpCalendarId: true },
    });
    if (!user?.lifexpCalendarId) return;

    const calendar = google.calendar({ version: "v3", auth: client });
    await calendar.events.delete({
      calendarId: user.lifexpCalendarId,
      eventId: googleEventId,
    });
  } catch (error) {
    // A stale event left behind is a much smaller problem than a delete that
    // fails loudly, so this is logged and swallowed.
    console.error("[lifexp] calendar delete failed:", error);
  }
}
