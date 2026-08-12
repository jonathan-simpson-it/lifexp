"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

/**
 * The quiet half of the reward system.
 *
 * Sits above the bottom bar, confirms in one line, and leaves after two
 * seconds. No dismiss button: anything requiring a tap to clear is not quiet.
 */
export function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    navigator.vibrate?.(8);
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rise-in pointer-events-none fixed inset-x-0 bottom-24 z-[55] flex justify-center px-4 md:bottom-8 md:pl-60"
    >
      <div className="flex items-center gap-2 rounded-full border border-growth/30 bg-growth-soft px-4 py-2.5 text-sm font-medium text-growth shadow-card">
        <span className="flex size-5 items-center justify-center rounded-full bg-growth text-white">
          <Check size={13} strokeWidth={3} aria-hidden />
        </span>
        {message}
      </div>
    </div>
  );
}
