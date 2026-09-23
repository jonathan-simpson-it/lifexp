import { buildEventBody } from "@/lib/google/calendar";
import { dayHeading } from "@/lib/ui/format";

type PreviewExperience = {
  id: string;
  title: string;
  notes: string | null;
  occurredAt: Date;
  minutes: number | null;
  googleEventId: string | null;
};

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

/**
 * Shows the actual Google Calendar payloads LifeXP would write, rendered as a
 * calendar.
 *
 * This exists so the calendar feature can be inspected and understood without
 * Google credentials, otherwise it is the one part of the product that is
 * invisible on a machine that hasn't been through an OAuth setup. It calls the
 * same `buildEventBody` the live sync uses, so what you see here is what would
 * be sent, not an illustration of it.
 */
export function CalendarPreview({
  experiences,
  connected,
}: {
  experiences: PreviewExperience[];
  connected: boolean;
}) {
  if (experiences.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted">
        Record an experience and its calendar entry will appear here.
      </p>
    );
  }

  const events = experiences.map((experience) => {
    const body = buildEventBody(experience);
    const allDay = "date" in body.start;

    return {
      id: experience.id,
      title: body.summary,
      description: body.description,
      allDay,
      occurredAt: experience.occurredAt,
      timeLabel: allDay
        ? "all day"
        : `${TIME.format(new Date(body.start.dateTime as string))}–${TIME.format(
            new Date(body.end.dateTime as string),
          )}`,
      synced: Boolean(experience.googleEventId),
    };
  });

  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const key = dayHeading(event.occurredAt);
    const list = groups.get(key);
    if (list) list.push(event);
    else groups.set(key, [event]);
  }

  return (
    <div className="mt-3 overflow-hidden border border-line">
      {/* A calendar-ish chrome, so it reads as "this is what your calendar
          would look like" rather than as a table of JSON. */}
      <div className="flex items-center gap-2 border-b border-line bg-paper px-3 py-2">
        <span
          aria-hidden
          className="size-2.5 rounded-full"
          style={{ background: "var(--growth)" }}
        />
        <span className="text-sm font-medium">LifeXP</span>
        <span className="ml-auto text-xs text-muted">
          {connected ? "your calendar" : "preview"}
        </span>
      </div>

      <div className="divide-y divide-line">
        {[...groups.entries()].map(([heading, items]) => (
          <div key={heading} className="px-3 py-2">
            <p className="text-xs tracking-wide text-muted uppercase">{heading}</p>
            <ul className="mt-1.5 space-y-1.5">
              {items.map((event) => (
                <li key={event.id} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1 w-1 self-stretch"
                    style={{ background: "var(--growth)", minHeight: "1.75rem" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted">
                      {event.timeLabel}
                      {connected && (event.synced ? " · synced" : " · not yet synced")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
