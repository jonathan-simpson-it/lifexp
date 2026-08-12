import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCalendarStatus } from "@/lib/google/calendar";
import { resolveProvider } from "@/lib/ai/provider";
import {
  backfillCalendar,
  connectCalendar,
  disconnectCalendar,
  signOutAction,
} from "@/app/actions/calendar";

export const metadata = { title: "Settings · LifeXP" };

export default async function SettingsPage() {
  const userId = await requireUserId();

  const [calendar, user, pendingSync] = await Promise.all([
    getCalendarStatus(userId),
    db.user.findUnique({
      where: { id: userId },
      select: { email: true, timezone: true },
    }),
    db.experience.count({ where: { userId, googleEventId: null } }),
  ]);

  // Reads env only; no key material reaches the page.
  const provider = resolveProvider();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-ink-soft">{user?.email}</p>
      </header>

      <section aria-labelledby="calendar-heading" className="card p-4">
        <h2 id="calendar-heading" className="font-medium">
          Google Calendar
        </h2>

        {calendar.state === "unavailable" && (
          <p className="mt-2 text-sm text-muted">{calendar.reason}</p>
        )}

        {calendar.state === "not-connected" && (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              LifeXP can mirror what you record into a calendar called{" "}
              <strong>LifeXP</strong>, created just for this. Your existing
              calendars stay untouched — the permission LifeXP asks for only
              covers calendars it made itself, so it cannot read them.
            </p>
            <form action={connectCalendar} className="mt-3">
              <button
                type="submit"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
              >
                Connect calendar
              </button>
            </form>
          </>
        )}

        {calendar.state === "connected" && (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Connected. New experiences appear in your <strong>LifeXP</strong>{" "}
              calendar automatically.
            </p>

            {calendar.error && (
              <p className="mt-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-muted">
                {calendar.error}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {pendingSync > 0 && (
                <form action={backfillCalendar}>
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2 text-sm hover:bg-line/50"
                  >
                    Add {pendingSync > 100 ? "the next 100" : `${pendingSync}`} older{" "}
                    {pendingSync === 1 ? "experience" : "experiences"}
                  </button>
                </form>
              )}
              <form action={disconnectCalendar}>
                <button
                  type="submit"
                  className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:bg-line/50"
                >
                  Stop syncing
                </button>
              </form>
            </div>

            <p className="mt-2 text-xs text-muted">
              Stopping keeps everything already in your calendar. It&rsquo;s your
              record — deleting it is your call, from Google Calendar.
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="ai-heading" className="card p-4">
        <h2 id="ai-heading" className="font-medium">
          Natural language
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Currently using <strong>{provider.name}</strong>.
        </p>
        {provider.isLocal ? (
          <p className="mt-2 text-sm text-muted">
            This runs on your own server with no API key and no network calls. It
            handles durations, dates and skills you already track. Set{" "}
            <code>AI_PROVIDER</code> and <code>AI_API_KEY</code> for a model that
            reads messier sentences.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            If this provider is ever unreachable, LifeXP falls back to its
            built-in extractor rather than losing the feature.
          </p>
        )}
      </section>

      <section aria-labelledby="data-heading" className="card p-4">
        <h2 id="data-heading" className="font-medium">
          Your data
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Everything you&rsquo;ve recorded, as JSON. No account required to read
          it, and nothing in it is locked to LifeXP.
        </p>
        <a
          href="/api/export"
          className="mt-3 inline-block rounded-full border border-line px-4 py-2 text-sm hover:bg-line/50"
        >
          Download export
        </a>
        <p className="mt-2 text-xs text-muted">Timezone: {user?.timezone}</p>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
