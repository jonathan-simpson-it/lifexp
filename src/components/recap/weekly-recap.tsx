"use client";

import { useCallback, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { WeekSummary } from "@/lib/growth/summarise";
import type { RecapBadge } from "@/lib/progress/queries";
import { formatDuration } from "@/lib/ui/format";
import { BadgeIcon } from "@/components/badge-icon";

/**
 * The weekly ritual.
 *
 * Appears Sunday and Monday, dismissible for that week. The design constraint
 * that matters: **it has to read well on a bad week.** Most recap features are
 * written for the good ones and quietly shame you the rest of the time, which
 * would undo the entire product.
 *
 * Whether it is a recap day is decided on the server (`getRecapWindow`) so no
 * component reads the clock during render. All this component decides is
 * whether the user has already dismissed this particular week.
 */

export type RecapSkill = { name: string; totalMinutes: number };

const DISMISS_KEY = "lifexp:recap-dismissed-week";

/**
 * localStorage is an external store, so it is read through the API React
 * provides for exactly that. The alternative — setState inside an effect —
 * triggers a second render pass on every mount.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("lifexp:recap-dismissed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("lifexp:recap-dismissed", onChange);
  };
}

function useDismissedWeek(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(DISMISS_KEY),
    // Server render: nothing is dismissed yet. The card appears after
    // hydration if this week's stamp does not match.
    () => null,
  );
}

export function WeeklyRecap({
  week,
  skills,
  recentBadges,
  isRecapDay,
  weekStamp,
}: {
  week: WeekSummary;
  skills: RecapSkill[];
  recentBadges: RecapBadge[];
  isRecapDay: boolean;
  weekStamp: string;
}) {
  const dismissedWeek = useDismissedWeek();

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, weekStamp);
    window.dispatchEvent(new Event("lifexp:recap-dismissed"));
  }, [weekStamp]);

  if (!isRecapDay || dismissedWeek === weekStamp) return null;

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
