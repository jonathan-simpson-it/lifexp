"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { CalendarMonth } from "@/lib/growth/aggregate";
import { formatDuration, skillColor } from "@/lib/ui/format";

/**
 * Month grid.
 *
 * Days with activity carry one dot per skill in that skill's colour. Empty days
 * render a faint dot rather than a gap — the same rule the heatmap follows,
 * because a row of holes reads as a broken chain, and there is no chain here to
 * break.
 */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const MONTH_NAME = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const DAY_NAME = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function MonthGrid({ data }: { data: CalendarMonth }) {
  const { year, month, days, totals } = data;
  const byDate = new Map(days.map((d) => [d.date, d]));

  const todayKey = new Date().toISOString().slice(0, 10);
  const firstWithActivity = days.at(-1)?.date;
  const [selected, setSelected] = useState<string | null>(
    byDate.has(todayKey) ? todayKey : (firstWithActivity ?? null),
  );

  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Monday-first: JS gives 0 for Sunday.
  const leadingBlanks = (first.getUTCDay() + 6) % 7;

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const isCurrentMonth =
    year === new Date().getUTCFullYear() && month === new Date().getUTCMonth() + 1;

  const selectedDay = selected ? byDate.get(selected) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href={`/calendar?y=${prev.y}&m=${prev.m}`}
          aria-label="Previous month"
          className="tappable rounded-full p-2 text-muted hover:bg-line/50"
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>

        <h2 className="display text-title">{MONTH_NAME.format(first)}</h2>

        {isCurrentMonth ? (
          // No forward travel past today: an empty future month is not
          // information, it is just a wall of blanks.
          <span className="p-2 opacity-25">
            <ChevronRight size={20} aria-hidden />
          </span>
        ) : (
          <Link
            href={`/calendar?y=${next.y}&m=${next.m}`}
            aria-label="Next month"
            className="tappable rounded-full p-2 text-muted hover:bg-line/50"
          >
            <ChevronRight size={20} aria-hidden />
          </Link>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((day, i) => (
          <li key={i}>{day}</li>
        ))}
      </ul>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNumber = i + 1;
          const key = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
          const day = byDate.get(key);
          const isSelected = selected === key;
          const isToday = key === todayKey;
          // A day that hasn't happened is not an empty day. Marking it with the
          // same "nothing recorded" dot would imply a gap the user could have
          // filled, which is the one thing this product never does.
          const isFuture = key > todayKey;

          // Two dots per skill maximum, so a busy day stays legible.
          const dots = day
            ? [
                ...new Map(
                  day.experiences
                    .flatMap((e) => e.skills)
                    .map((s) => [s.id, s]),
                ).values(),
              ].slice(0, 4)
            : [];

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              aria-pressed={isSelected}
              aria-label={`${dayNumber}, ${
                day
                  ? `${day.experiences.length} recorded`
                  : isFuture
                    ? "yet to come"
                    : "nothing recorded"
              }`}
              className={[
                "tappable flex aspect-square flex-col items-center justify-center rounded-xl text-sm",
                isSelected
                  ? "bg-ink text-paper"
                  : isToday
                    ? "bg-accent-soft font-semibold text-accent-deep"
                    : "hover:bg-line/40",
                isFuture ? "text-muted/60" : "",
              ].join(" ")}
            >
              <span className="numeral leading-none">{dayNumber}</span>

              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {dots.length > 0 ? (
                  dots.map((skill) => (
                    <span
                      key={skill.id}
                      className="size-1.5 rounded-full"
                      style={{
                        background: isSelected
                          ? "var(--paper)"
                          : skillColor(skill.colorSeed),
                      }}
                    />
                  ))
                ) : day?.maintenance.length ? (
                  <Check
                    size={10}
                    aria-hidden
                    className={isSelected ? "text-paper" : "text-growth"}
                  />
                ) : isFuture ? null : (
                  <span className="size-1 rounded-full bg-line-strong opacity-50" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hours is the answer; the other three are context. They used to be four
          equal numbers, which made the strip something to read rather than
          something to glance at. */}
      <dl className="mt-5 flex items-center gap-4 rounded-xl border border-line bg-paper px-4 py-3">
        <div>
          <dt className="sr-only">hours</dt>
          <dd className="numeral text-figure">{formatDuration(totals.minutes)}</dd>
          <p className="text-eyebrow text-muted uppercase">this month</p>
        </div>

        <div className="ml-auto flex gap-4 text-right">
          <Total label="entries" value={String(totals.experiences)} />
          <Total label="skills" value={String(totals.skills)} />
          <Total label="medals" value={String(totals.medals)} />
        </div>
      </dl>

      <section className="mt-5">
        {selectedDay ? (
          <>
            <h3 className="text-eyebrow text-muted uppercase">
              {DAY_NAME.format(new Date(`${selectedDay.date}T12:00:00Z`))}
            </h3>
            <ul className="mt-2 space-y-2">
              {selectedDay.experiences.map((experience) => (
                <li key={experience.id} className="card flex items-center gap-3 p-3">
                  <span className="flex gap-1">
                    {experience.skills.map((skill) => (
                      <span
                        key={skill.id}
                        aria-hidden
                        className="size-2.5 rounded-full"
                        style={{ background: skillColor(skill.colorSeed) }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{experience.title}</span>
                  <span className="numeral shrink-0 text-sm text-muted">
                    {formatDuration(experience.minutes)}
                  </span>
                </li>
              ))}

              {selectedDay.maintenance.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 px-3 text-sm text-muted"
                >
                  <Check size={14} aria-hidden className="text-growth" />
                  {item.name}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="voice">
            Pick a day to see what you did. Nothing recorded is just a day that
            went unrecorded.
          </p>
        )}
      </section>
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="numeral text-body">{value}</dd>
      <p className="text-caption text-muted">{label}</p>
    </div>
  );
}
