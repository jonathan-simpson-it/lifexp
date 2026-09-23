"use client";

import { useEffect, useState } from "react";

/**
 * A progress bar that fills on arrival.
 *
 * The width starts at zero and settles at its fraction one frame after mount,
 * so the goal gradient is something you watch being laid rather than something
 * that was always there. One controlled repaint per mount; the reduced-motion
 * block collapses the transition, so it snaps for those visitors.
 *
 * The fraction can also change later (an optimistic maintenance refill), which
 * the same transition covers.
 */
export function Fill({
  fraction,
  color,
  className = "h-2",
  ariaLabel,
}: {
  /** 0–1. */
  fraction: number;
  color: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`${className} w-full overflow-hidden bg-line`}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <div
        className="h-full transition-[width] duration-700 ease-[var(--ease-out)]"
        style={{
          width: settled ? `${Math.max(Math.min(fraction, 1) * 100, 3)}%` : "0%",
          background: color,
        }}
      />
    </div>
  );
}
