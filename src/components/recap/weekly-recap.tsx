"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { WeekSummary } from "@/lib/growth/summarise";
import { formatDuration } from "@/lib/ui/format";
import { BadgeIcon } from "@/components/badge-icon";

/**
 * Only serialisable data crosses this boundary.
 *
 * Badge *definitions* carry an `earned()` predicate, and handing one to a
 * client component is an immediate server error. The page flattens them to
 * these three fields first.
 */
export type RecapBadge = { key: string; title: string; icon: string };
export type RecapSkill = { name: string; totalMinutes: number };

/**
 * The weekly ritual.
 *
 * Appears Sunday and Monday, dismissible for the week. The design constraint
 * that matters: **it has to read well on a bad week.** Most recap features are
 * written for the good ones and quietly shame you the rest of the time, which
 * would undo the entire product.
 */
const DISMISS_KEY = "lifexp:recap-dismissed-week";

function weekStamp(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

export function WeeklyRecap({
  week,
  skills,
  recentBadges,
}: {
  week: WeekSummary;
  skills: RecapSkill[];
  recentBadges: RecapBadge[];
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const day = new Date().getDay(); // 0 Sun, 1 Mon
    if (day !== 0 && day !== 1) return;
    if (localStorage.getItem(DISMISS_KEY) === weekStamp()) return;
    setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, weekStamp());
    setShow(false);
  }

  const busiest = [...skills].sort((a, b) => b.totalMinutes - a.totalMinutes)[0];

  const quiet = week.experienceCount === 0;
  const light = !quiet && week.experienceCount <= 2;

  return (
    <section className="rise-in card relative overflow-hidden p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss this week's recap"
        className="tappable absolute top-3 right-3 rounded-full p-1.5 text-muted hover:bg-line/50"
      >
        <X size={16} aria-hidden />
      </button>

      <p className="text-xs font-semibold tracking-widest text-action-deep uppercase">
        Your week
      </p>

      {quiet ? (
        <>
          <h2 className="display mt-2 text-xl font-semibold">A quiet one</h2>
          <p className="mt-1.5 text-ink-soft">
            Nothing recorded this week. Everything you built before is still
            there, and it will still be there whenever you come back.
          </p>
        </>
      ) : (
        <>
          <h2 className="display mt-2 text-xl font-semibold">
            <span className="numeral">{formatDuration(week.minutes)}</span> across{" "}
            <span className="numeral">{week.skillCount}</span>{" "}
            {week.skillCount === 1 ? "skill" : "skills"}
          </h2>
          <p className="mt-1.5 text-ink-soft">
            {light
              ? "A lighter week than usual. It still counts — that is the whole point."
              : `${week.experienceCount} experiences recorded${busiest ? `, mostly ${busiest.name}` : ""}.`}
          </p>
        </>
      )}

      {recentBadges.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {recentBadges.map((badge) => (
            <li
              key={badge.key}
              className="flex items-center gap-1.5 rounded-full bg-medal-soft px-2.5 py-1 text-xs font-medium text-medal"
            >
              <BadgeIcon name={badge.icon} size={14} />
              {badge.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
