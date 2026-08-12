"use client";

import { useEffect, useState } from "react";
import { BADGES_BY_KEY } from "@/lib/progress/badges";
import { BadgeIcon } from "@/components/badge-icon";
import type { LogResult } from "@/components/log/log-sheet";
import { Confetti } from "./confetti";
import { Toast } from "./toast";

/**
 * Rewards, scaled to what actually happened.
 *
 * Logging something gets a toast and gets out of the way — someone recording
 * their fourth thing of the day should not be interrupted four times. Earning a
 * medal gets the full moment, because that is genuinely rare.
 *
 * Multiple medals queue and play in sequence rather than stacking, so each one
 * is actually read.
 */
export function CelebrationHost({
  result,
  onDone,
}: {
  result: LogResult | null;
  onDone: () => void;
}) {
  const [queue, setQueue] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;

    const what = result.minutes
      ? `${result.minutes < 60 ? `${result.minutes}m` : `${Number((result.minutes / 60).toFixed(1))}h`} of ${result.skillName}`
      : result.skillName;

    setToast(`Recorded — ${what}`);
    setQueue(result.newBadgeKeys);
    onDone();
  }, [result, onDone]);

  const current = queue[0];

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {current && (
        <MedalMoment
          badgeKey={current}
          onDismiss={() => setQueue((q) => q.slice(1))}
        />
      )}
    </>
  );
}

function MedalMoment({
  badgeKey,
  onDismiss,
}: {
  badgeKey: string;
  onDismiss: () => void;
}) {
  const badge = BADGES_BY_KEY.get(badgeKey as never);

  useEffect(() => {
    // A short, single vibration. Not available everywhere and not important
    // enough to warrant a fallback.
    navigator.vibrate?.(18);
  }, []);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
      />
      <Confetti />

      <div
        role="dialog"
        aria-modal="true"
        className="pop-in relative w-full max-w-xs rounded-[var(--radius-sheet)] border border-line bg-paper-raised p-6 text-center shadow-raised"
      >
        <p className="text-xs font-semibold tracking-widest text-medal uppercase">
          Medal earned
        </p>

        <span className="mx-auto mt-4 flex size-20 items-center justify-center rounded-full bg-medal-soft text-medal">
          <BadgeIcon name={badge.icon} size={40} />
        </span>

        <h2 className="display mt-4 text-2xl font-semibold">{badge.title}</h2>
        {/* States what happened. Never praises the person for being good — the
            medal is evidence, not a compliment. */}
        <p className="mt-2 text-ink-soft">{badge.description}</p>

        <button
          type="button"
          onClick={onDismiss}
          className="tappable mt-6 w-full rounded-full bg-action-deep py-3 font-semibold text-white"
        >
          Nice
        </button>
      </div>
    </div>
  );
}
