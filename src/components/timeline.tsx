import Link from "next/link";
import type { TimelineEntry } from "@/lib/growth/aggregate";
import { dayHeading, formatDuration, skillColor } from "@/lib/ui/format";

/** Reverse-chronological story. Grouped by day, newest first. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nothing recorded yet. Whatever you did today counts, however small.
      </p>
    );
  }

  const groups = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const key = dayHeading(entry.occurredAt);
    const list = groups.get(key);
    if (list) list.push(entry);
    else groups.set(key, [entry]);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([heading, items]) => (
        <section key={heading}>
          <h3 className="text-sm font-medium tracking-wide text-muted uppercase">
            {heading}
          </h3>
          <ul className="mt-2 space-y-2">
            {items.map((entry) => (
              <li key={entry.id} className="card p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 font-medium">{entry.title}</span>
                  <span className="numeral shrink-0 text-sm text-muted">
                    {formatDuration(entry.minutes)}
                  </span>
                </div>

                {entry.skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {entry.skills.map((skill) => (
                      <Link
                        key={skill.id}
                        href={`/growth/${skill.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:text-ink"
                      >
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full"
                          style={{ background: skillColor(skill.colorSeed) }}
                        />
                        {skill.name}
                      </Link>
                    ))}
                  </div>
                )}

                {entry.notes && (
                  <p className="mt-2 text-sm text-ink-soft italic">{entry.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
