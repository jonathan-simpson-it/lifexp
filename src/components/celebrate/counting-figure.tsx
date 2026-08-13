"use client";

import { useEffect, useState } from "react";
import { easeOut, prefersReducedMotion } from "@/lib/ui/motion";
import { formatHours } from "@/lib/progress/milestones";

/**
 * A distance counting down to its new value.
 *
 * This is the app's one counting number, and it is here rather than on a page
 * total for two reasons. It is *earned*, it moves because the user just did
 * something, which is the goal-gradient reward landing at the instant of
 * effort. And it is honest about direction: the figure only ever falls, which
 * is the only way a number in this product is allowed to move on its own.
 *
 * It deliberately does not run on page load. A total that counts up every time
 * you open a screen is a performance; this responds to an action.
 */
export function CountingFigure({
  from,
  to,
  unit,
  durationMs = 900,
}: {
  from: number;
  to: number;
  unit: "minutes" | "sessions";
  durationMs?: number;
}) {
  // Starts at the *old* value so the first painted frame is the number the
  // user was looking at a moment ago, and the drop is visible.
  const [value, setValue] = useState(from);

  useEffect(() => {
    // Reduced motion and "nothing changed" are handled as a zero-length
    // animation rather than an early setState. Every path then settles inside
    // the frame callback, which keeps the state update out of the effect body,
    // a synchronous one there costs a second render pass on every save.
    const duration = prefersReducedMotion() || from === to ? 0 : durationMs;

    let raf = 0;
    let start: number | null = null;

    const step = (now: number) => {
      start ??= now;
      const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      setValue(from + (to - from) * easeOut(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, durationMs]);

  const rounded = unit === "minutes" ? value : Math.round(value);

  return (
    <span className="numeral font-semibold">
      {unit === "minutes"
        ? formatHours(rounded)
        : `${rounded} ${rounded === 1 ? "session" : "sessions"}`}
    </span>
  );
}
