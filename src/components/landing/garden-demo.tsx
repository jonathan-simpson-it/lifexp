"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Logo, Medal, Plant, stageForTier, type PlantStage } from "@/components/icons";
import { Watering } from "@/components/garden/watering";
import { CountingFigure } from "@/components/celebrate/counting-figure";
import type { Season, Soil } from "@/lib/garden/conditions";
import { formatDuration, skillColor } from "@/lib/ui/format";
import { formatHours, type MilestoneTier } from "@/lib/progress/milestones";
import { prefersReducedMotion } from "@/lib/ui/motion";

/**
 * The hero's working miniature.
 *
 * Not a video and not a screenshot: the same Plant, Watering and CountingFigure
 * pieces the app renders, wired to local demo state. A visitor who taps a plant
 * records 30 minutes, watches the water land and the remaining distance fall,
 * and on the Japanese skill, two taps cross the Elementary milestone so the
 * plant grows a stage and the medal moment plays.
 *
 * One scripted watering runs when the card first scrolls into view, so the
 * page demonstrates itself. After that it only ever moves when tapped.
 *
 * The clock is read on the server: season and light arrive as props, the same
 * way they reach the real garden, so no render reads the time.
 */

type Step = { label: string; at: number; floor: number };

type DemoSkill = {
  key: string;
  name: string;
  hue: number;
  minutes: number;
  sessions: number;
  /** What one tap adds to this skill's counter. */
  unit: "minutes" | "sessions";
  tier: MilestoneTier | null;
  stage: PlantStage;
  soil: Soil;
  /** The milestone being climbed toward, null once every one is reached. */
  next: Step | null;
  /** The milestone after that, which becomes `next` when one is crossed. */
  after: { label: string; at: number } | null;
  /** The tier the plant grows into when `next` is crossed. */
  tierOnCross: MilestoneTier;
};

const TAP_MINUTES = 30;

/**
 * The loop's running order. Japanese crosses its milestone on the second
 * record, so a visitor who stands still for five seconds still sees the
 * product's best moment: the plant grows a stage and the medal lands.
 */
const AUTO_ORDER = [
  "japanese",
  "japanese",
  "piano",
  "running",
  "japanese",
  "piano",
  "running",
] as const;

function initialSkills(): DemoSkill[] {
  return [
    {
      key: "japanese",
      name: "Japanese",
      hue: 24,
      minutes: 23_940, // 398.5h: one hour below Elementary ≈ N5 (400h)
      sessions: 248,
      unit: "minutes",
      tier: "FOUNDATION",
      stage: "sapling",
      soil: "rich",
      next: { label: "Elementary ≈ N5", at: 24_000, floor: 9_000 },
      after: { label: "Intermediate ≈ N4", at: 48_000 },
      tierOnCross: "BRONZE",
    },
    {
      key: "piano",
      name: "Piano",
      hue: 190,
      minutes: 2_070,
      sessions: 69,
      unit: "sessions",
      tier: "FOUNDATION",
      stage: "sapling",
      soil: "mossy",
      next: { label: "Bronze", at: 150, floor: 50 },
      after: { label: "Silver", at: 400 },
      tierOnCross: "BRONZE",
    },
    {
      key: "running",
      name: "Running",
      hue: 96,
      minutes: 936,
      sessions: 31,
      unit: "minutes",
      tier: "FIRST_STEPS",
      stage: "sprout",
      soil: "bare",
      next: { label: "Foundation", at: 3_000, floor: 600 },
      after: { label: "Bronze", at: 9_000 },
      tierOnCross: "FOUNDATION",
    },
  ];
}

type WateringState = {
  key: string;
  stageBefore: PlantStage;
  stageAfter: PlantStage;
} | null;

type MedalMoment = { tier: MilestoneTier; label: string } | null;

/** The remaining distance animating from old to new, set on the tap that moved it. */
type Countdown = { key: string; from: number; to: number } | null;

export function GardenDemo({
  season,
  light,
}: {
  season: Season;
  light: "dawn" | "day" | "dusk" | "night";
}) {
  const [skills, setSkills] = useState(initialSkills);
  const [focused, setFocused] = useState("japanese");
  const [watering, setWatering] = useState<WateringState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [medal, setMedal] = useState<MedalMoment>(null);
  const [countdown, setCountdown] = useState<Countdown>(null);
  const [weekMinutes, setWeekMinutes] = useState(1_080);
  const [weekEntries, setWeekEntries] = useState(5);
  /** Bumped on every reset, remounting the row so the plants grow in again. */
  const [generation, setGeneration] = useState(0);
  /** True while the card is on screen and motion is welcome. */
  const [auto, setAuto] = useState(false);
  const [passDone, setPassDone] = useState(false);
  const autoIndex = useRef(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function tap(key: string) {
    if (watering) return; // one watering at a time; overlapping reads as a toy

    const before = skills.find((s) => s.key === key);
    if (!before) return;

    const step = before.unit === "minutes" ? TAP_MINUTES : 1;
    const current = before.unit === "minutes" ? before.minutes : before.sessions;
    const willCross = before.next !== null && current + step >= before.next.at;
    const grewStage = willCross && stageForTier(before.tierOnCross) !== before.stage;

    const updated: DemoSkill = {
      ...before,
      minutes: before.minutes + TAP_MINUTES,
      sessions: before.sessions + 1,
      tier: willCross ? before.tierOnCross : before.tier,
      stage: willCross ? stageForTier(before.tierOnCross) : before.stage,
      next: willCross
        ? before.after
          ? { label: before.after.label, at: before.after.at, floor: before.next!.at }
          : null
        : before.next,
    };

    setSkills((prev) => prev.map((s) => (s.key === key ? updated : s)));
    setFocused(key);
    setWeekMinutes((m) => m + TAP_MINUTES);
    setWeekEntries((n) => n + 1);
    setToast(`Recorded: ${TAP_MINUTES}m of ${before.name}`);
    later(() => setToast(null), 2_200);

    // Count the distance down only when it actually fell. Crossing a
    // milestone replaces the target and the number grows; that is the one
    // direction this figure never animates, the same rule the app's
    // WateredToast applies.
    const beforeRemaining = remainingFor(before);
    const afterRemaining = remainingFor(updated);
    setCountdown(
      beforeRemaining !== null && afterRemaining !== null && afterRemaining < beforeRemaining
        ? { key, from: beforeRemaining, to: afterRemaining }
        : null,
    );

    setWatering({
      key,
      stageBefore: before.stage,
      stageAfter: grewStage ? updated.stage : before.stage,
    });
    later(() => setWatering(null), 1_550);

    if (willCross) {
      // The medal lands after the plant has visibly grown, so the water reads
      // as the cause and the medal as the consequence.
      later(
        () => setMedal({ tier: updated.tierOnCross, label: before.next!.label }),
        1_650,
      );
      later(() => setMedal(null), 5_400);
    }
  }

  // The loop taps through this ref so the effect below never closes over a
  // stale `tap` while still re-scheduling as the demo state changes.
  const tapRef = useRef(tap);
  useEffect(() => {
    tapRef.current = tap;
  });

  function reset() {
    setSkills(initialSkills());
    setFocused("japanese");
    setWeekMinutes(1_080);
    setWeekEntries(5);
    setToast(null);
    setMedal(null);
    setWatering(null);
    setCountdown(null);
    autoIndex.current = 0;
    setGeneration((g) => g + 1);
  }

  // Visibility drives the loop: it records while the card is on screen and
  // stops when it scrolls away. Reduced-motion visitors get the settled card.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setAuto(entries[0].isIntersecting && !prefersReducedMotion()),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The loop itself: one record every few seconds once nothing is mid-play,
  // then a reset after a full pass so the numbers stay in their starting range
  // and the grow-in replays. No tap required; taps still work alongside it.
  useEffect(() => {
    if (!auto || watering || medal || passDone) return;
    const id = setTimeout(() => {
      const key = AUTO_ORDER[autoIndex.current % AUTO_ORDER.length];
      autoIndex.current += 1;
      tapRef.current(key);
      if (autoIndex.current % AUTO_ORDER.length === 0) {
        setPassDone(true);
        // Long enough for the last toast to finish; the pass ends on Running,
        // which never crosses, so no medal is cut off.
        later(() => {
          reset();
          setPassDone(false);
        }, 4_600);
      }
    }, 2_200);
    return () => clearTimeout(id);
  }, [auto, watering, medal, passDone, generation]);

  const focusedSkill = skills.find((s) => s.key === focused) ?? skills[0];

  return (
    <div ref={cardRef} className="card relative overflow-hidden p-4" data-light={light}>
      {/* The hour's light, the same treatment the real garden gets. */}
      <span aria-hidden className="garden-light pointer-events-none absolute inset-0" />

      <div className="relative">
        {/* The app's chrome, so the card reads as a window into the product
            rather than a chart. */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <Logo size={15} />
          <span className="text-eyebrow text-muted uppercase">Today</span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-eyebrow text-muted uppercase">This week</p>
          <p className="text-caption text-muted">
            <span key={weekMinutes} className="rise-in numeral inline-block text-ink">
              {formatDuration(weekMinutes)}
            </span>{" "}
            ·{" "}
            <span key={weekEntries} className="rise-in numeral inline-block text-ink">
              {weekEntries}
            </span>{" "}
            entries
          </p>
        </div>

        <ul key={generation} className="mt-3 flex items-end justify-around">
          {skills.map((skill, i) => {
            const color = skillColor(skill.hue);
            const isWatering = watering?.key === skill.key;
            return (
              <li key={skill.key} className="flex w-24 flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => tap(skill.key)}
                  aria-label={`Record ${TAP_MINUTES} minutes of ${skill.name}`}
                  className="group flex cursor-pointer flex-col items-center"
                >
                  <span
                    className="grow-in block"
                    style={{
                      ["--sway-delay" as string]: `${i * 0.4}s`,
                      ["--rise-delay" as string]: `${i * 0.12}s`,
                    }}
                  >
                    {isWatering ? (
                      <Watering
                        stageBefore={watering.stageBefore}
                        stageAfter={watering.stageAfter}
                        color={color}
                        size={76}
                        season={season}
                        soil={skill.soil}
                      />
                    ) : (
                      <Plant
                        stage={skill.stage}
                        color={color}
                        size={76}
                        season={season}
                        soil={skill.soil}
                      />
                    )}
                  </span>
                  <span className="mt-0.5 truncate text-xs font-medium group-hover:text-accent-deep">
                    {skill.name}
                  </span>
                  <span className="numeral text-xs text-muted">
                    {formatDuration(skill.minutes)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-1 text-center text-caption text-muted">
          It records on its own. Tap a plant to join in.
        </p>

        {/* The focused skill's ladder card, mirroring the app's skill card. */}
        <div className="mt-3 border border-line bg-paper p-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{focusedSkill.name}</span>
            <span className="numeral">{formatDuration(focusedSkill.minutes)}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-line">
            <div
              className="h-full bg-accent transition-[width] duration-700 ease-[var(--ease-out)]"
              style={{ width: `${Math.max(fractionOf(focusedSkill) * 100, 2)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {focusedSkill.next ? (
              <>
                <RemainingFigure
                  key={focusedSkill.key}
                  skill={focusedSkill}
                  countdown={countdown?.key === focusedSkill.key ? countdown : null}
                />{" "}
                to {focusedSkill.next.label}
              </>
            ) : (
              "Every milestone reached"
            )}
          </p>
        </div>
      </div>

      {/* The confirmation, contained to the demo card rather than the viewport. */}
      {toast && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
          <p className="rise-in flex items-center gap-2 border border-growth/30 bg-growth-soft px-3.5 py-2 text-sm font-medium text-growth shadow-card">
            <span className="flex size-5 items-center justify-center rounded-full bg-growth text-white">
              <Check size={13} strokeWidth={3} aria-hidden />
            </span>
            {toast}
          </p>
        </div>
      )}

      {/* The medal moment, on the tap that crosses the milestone. */}
      {medal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setMedal(null)}
            className="absolute inset-0 cursor-default bg-ink/30"
          />
          <div
            role="status"
            className="pop-in relative w-full max-w-[220px] border border-line bg-paper-raised p-5 text-center shadow-raised"
          >
            <span className="mx-auto block w-fit">
              <Medal tier={medal.tier} size={72} striking />
            </span>
            <p className="mt-3 text-eyebrow text-medal uppercase">Milestone reached</p>
            <p className="display mt-1 text-title font-semibold">{medal.label}</p>
            <button
              type="button"
              onClick={() => setMedal(null)}
              className="tappable mt-4 w-full bg-accent-deep py-2 text-sm font-semibold text-white"
            >
              Nice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Progress through the current segment, the same rule the app's cards use. */
function fractionOf(skill: DemoSkill): number {
  const current = skill.unit === "minutes" ? skill.minutes : skill.sessions;
  if (!skill.next) return 1;
  const span = Math.max(skill.next.at - skill.next.floor, 1);
  return Math.min(Math.max((current - skill.next.floor) / span, 0), 1);
}

/** The distance still to go, in the unit the skill counts in. */
function remainingFor(skill: DemoSkill): number | null {
  if (!skill.next) return null;
  const current = skill.unit === "minutes" ? skill.minutes : skill.sessions;
  return Math.max(skill.next.at - current, 0);
}

/**
 * The remaining distance, counting down on the tap that changed it, and plain
 * text otherwise. The countdown lives in the parent's state because a render
 * may not read the previous frame from a ref.
 */
function RemainingFigure({
  skill,
  countdown,
}: {
  skill: DemoSkill;
  countdown: Countdown;
}) {
  if (countdown) {
    return (
      <CountingFigure
        key={`${skill.key}-${countdown.to}`}
        from={countdown.from}
        to={countdown.to}
        unit={skill.unit}
      />
    );
  }

  const remaining = remainingFor(skill) ?? 0;
  return (
    <span className="numeral font-semibold text-accent-deep">
      {skill.unit === "minutes"
        ? formatHours(remaining)
        : `${remaining} ${remaining === 1 ? "session" : "sessions"}`}
    </span>
  );
}
