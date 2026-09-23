"use client";

import { useCallback, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { WeekSummary } from "@/lib/growth/summarise";
import type { RecapBadge } from "@/lib/progress/queries";
import { formatDuration } from "@/lib/ui/format";
import { Medal } from "@/components/icons";
import { badgeVisual } from "@/components/badge-icon";

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
 * provides for exactly that. The alternative, setState inside an effect,
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

      <p className="text-eyebrow text-accent-deep uppercase">Your week</p>

      {/* The reassurance lines get the voice italic; the factual one does not.
          That split is the point of the treatment, it marks which sentences
          are the product speaking rather than reporting. */}
      {quiet ? (
        <>
          <h2 className="display mt-2 text-title">A quiet one</h2>
          <p className="voice mt-1.5">
            Nothing recorded this week. Everything you built before is still
            there, and it will still be there whenever you come back.
          </p>
        </>
      ) : (
        <>
          <h2 className="display mt-2 text-title">
            <span className="numeral">{formatDuration(week.minutes)}</span> across{" "}
            <span className="numeral">{week.skillCount}</span>{" "}
            {week.skillCount === 1 ? "skill" : "skills"}
          </h2>
          {light ? (
            <p className="voice mt-1.5">
              A lighter week than usual. It still counts.
            </p>
          ) : (
            <p className="mt-1.5 text-ink-soft">
              {week.experienceCount} experiences recorded
              {busiest ? `, mostly ${busiest.name}` : ""}.
            </p>
          )}
        </>
      )}

      {recentBadges.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {recentBadges.map((badge) => (
            <li
              key={badge.key}
              className="flex items-center gap-1 bg-medal-soft py-1 pr-2.5 pl-1 text-caption font-medium text-medal"
            >
              {/* No ribbon at this size: below about 20px the straps turn into
                  two dark specks and the medal stops reading as a medal. */}
              <Medal
                tier={badgeVisual(badge.key).metal}
                symbol={badgeVisual(badge.key).symbol}
                size={22}
                ribbon={false}
              />
              {badge.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
