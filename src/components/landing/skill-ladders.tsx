"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/progress/milestones";
import { TIER_COLOR } from "@/lib/ui/format";

/**
 * "For you": the real milestone ladders, one per kind of slow thing.
 *
 * Adapted from the structure of a landing we admired (LUME's role tabs): the
 * visitor picks what they are learning and sees the actual ladder LifeXP
 * would fit to it, from lib/progress/milestones. Not a mock-up, the same data
 * createSkillForUser copies into the database. The panel re-runs its rise
 * animation on every switch, keyed by template.
 */
export function SkillLadders() {
  const [active, setActive] = useState(0);
  const template = TEMPLATES[active];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Kinds of skill"
        className="flex flex-wrap gap-2"
      >
        {TEMPLATES.map((t, i) => {
          const selected = i === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={[
                "tappable border px-4 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-transparent bg-ink text-paper"
                  : "border-line text-muted hover:border-accent-deep hover:text-accent-deep",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        key={template.key}
        role="tabpanel"
        className="rise-in card mt-6 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="display text-title font-semibold">
            The {template.label.toLowerCase()} ladder
          </h3>
          {template.secondaryUnit && (
            <p className="text-caption text-muted">
              counted in {template.secondaryUnit} too
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-1.5">
          {template.ladder.map((step) => (
            <li
              key={step.label}
              className="flex items-center gap-3 bg-paper px-3 py-2.5"
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: TIER_COLOR[step.tier] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {step.label}
              </span>
              <span className="numeral shrink-0 text-sm text-muted">
                {step.hours ? `${step.hours}h` : `${step.sessions} sessions`}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-muted">
          Starts narrow and widens, so early progress is visible within days and
          later steps still mean something after years.
        </p>
      </div>
    </div>
  );
}
