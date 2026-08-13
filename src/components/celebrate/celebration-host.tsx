"use client";

import { useEffect, useState } from "react";
import { BADGES_BY_KEY } from "@/lib/progress/badges";
import { badgeVisual } from "@/components/badge-icon";
import { Medal } from "@/components/icons";
import type { LogResult } from "@/components/log/log-sheet";
import { Confetti } from "./confetti";
import { Toast } from "./toast";
import { WateredToast } from "./watered-toast";

/**
 * Rewards, scaled to what actually happened.
 *
 * Logging something gets a toast and gets out of the way, someone recording
 * their fourth thing of the day should not be interrupted four times. Earning a
 * medal gets the full moment, because that is genuinely rare.
 *
 * Everything here is derived from the `result` prop rather than copied into
 * state by an effect. The parent remounts this with a fresh `key` per save, so
 * "reset for the new result" is free and there is no cascading second render.
 */
export function CelebrationHost({ result }: { result: LogResult }) {
  // How many medals in this batch the user has acknowledged. Multiple medals
  // play in sequence rather than stacking, so each one is actually read.
  const [acknowledged, setAcknowledged] = useState(0);
  const [toastDone, setToastDone] = useState(false);

  const current = result.newBadgeKeys[acknowledged];

  const what = result.minutes
    ? `${result.minutes < 60 ? `${result.minutes}m` : `${Number((result.minutes / 60).toFixed(1))}h`} of ${result.skillName}`
    : result.skillName;

  return (
    <>
      {/* With a skill attached, the confirmation *is* the reward: that skill's
          plant gets watered and its remaining distance falls. Without one (an
          entry logged against no skill) there is no plant to water, so it
          falls back to the plain line. */}
      {!toastDone &&
        (result.moment ? (
          <WateredToast
            moment={result.moment}
            what={what}
            onDone={() => setToastDone(true)}
          />
        ) : (
          <Toast
            message={`Recorded: ${what}`}
            onDone={() => setToastDone(true)}
          />
        ))}

      {current && (
        <MedalMoment
          badgeKey={current}
          onDismiss={() => setAcknowledged((n) => n + 1)}
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

  const { symbol, metal } = badgeVisual(badgeKey);

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
        <p className="text-eyebrow text-medal uppercase">Medal earned</p>

        {/* The medal is struck rather than faded in: it arrives oversized and
            slams to rest, a ring expands off the rim, the ribbon unfurls, and
            one gleam crosses the face. See the medal-* keyframes. */}
        <span className="mx-auto mt-3 block w-fit">
          <Medal tier={metal} size={112} symbol={symbol} striking />
        </span>

        <h2 className="display mt-3 text-title">{badge.title}</h2>
        {/* States what happened. Never praises the person for being good, the
            medal is evidence, not a compliment. */}
        <p className="mt-2 text-ink-soft">{badge.description}</p>

        <button
          type="button"
          onClick={onDismiss}
          className="tappable mt-6 w-full rounded-full bg-accent-deep py-3 font-semibold text-white"
        >
          Nice
        </button>
      </div>
    </div>
  );
}
