"use client";

import { useEffect } from "react";
import type { SkillMoment } from "@/lib/growth/moment";
import { Watering } from "@/components/garden/watering";
import { stageForTier } from "@/components/icons";
import { soilFor } from "@/lib/garden/conditions";
import { skillColor } from "@/lib/ui/format";
import { CountingFigure } from "./counting-figure";

/**
 * The reward for recording something.
 *
 * Replaces a plain text toast with the thing the text was describing: the
 * skill's plant being watered, growing a stage if this log crossed a
 * milestone, and the remaining distance falling.
 *
 * It renders here rather than over the garden itself because logging works
 * from every screen, /calendar, /medals, /settings, and the garden only
 * exists on /today. Watering the plant inside the confirmation means the
 * moment is the same everywhere, with no cross-tree coordination and nothing
 * to scroll into view.
 */
export function WateredToast({
  moment,
  what,
  onDone,
}: {
  moment: { before: SkillMoment | null; after: SkillMoment };
  /** e.g. "1h of Japanese" */
  what: string;
  onDone: () => void;
}) {
  const { before, after } = moment;

  useEffect(() => {
    navigator.vibrate?.(8);
    // Long enough for the 1.5s watering to finish and still be read.
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  const stageBefore = stageForTier(before?.tier ?? null);
  const stageAfter = stageForTier(after.tier);

  /*
    Only animate the distance when it refers to the same target at both ends.

    Crossing a milestone replaces the target: `before.remaining` was the
    distance to Elementary, `after.remaining` is the distance to the one after
    it: a larger number. Interpolating between them would show the figure
    counting *upward*, which is the one direction a number in this product is
    never allowed to move on its own.
  */
  const sameTarget =
    before != null &&
    before.nextLabel != null &&
    before.nextLabel === after.nextLabel &&
    before.remaining != null &&
    after.remaining != null &&
    before.remainingUnit === after.remainingUnit &&
    before.remaining >= after.remaining;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rise-in pointer-events-none fixed inset-x-0 bottom-24 z-[55] flex justify-center px-4 md:bottom-8 md:pl-60"
    >
      <div className="flex max-w-sm items-center gap-2 border border-line bg-paper-raised py-2 pr-4 pl-2 shadow-raised">
        <Watering
          stageBefore={stageBefore}
          stageAfter={stageAfter}
          color={skillColor(after.colorSeed)}
          size={56}
          season={after.season}
          soil={soilFor(after.experienceCount)}
          // Read from the *before* snapshot: what matters is that it had gone
          // quiet, not that it is awake again now.
          wasResting={before?.rest === "resting"}
        />

        <div className="min-w-0">
          <p className="truncate text-body font-medium">Recorded: {what}</p>

          {after.nextLabel && after.remaining != null && after.remainingUnit ? (
            <p className="truncate text-caption text-muted">
              <span className="text-accent-deep">
                {sameTarget ? (
                  <CountingFigure
                    from={before.remaining!}
                    to={after.remaining}
                    unit={after.remainingUnit}
                  />
                ) : (
                  <CountingFigure
                    from={after.remaining}
                    to={after.remaining}
                    unit={after.remainingUnit}
                  />
                )}
              </span>{" "}
              to {after.nextLabel}
            </p>
          ) : (
            <p className="truncate text-caption text-muted">
              Every milestone reached
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
