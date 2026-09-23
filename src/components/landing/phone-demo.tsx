"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Plant } from "@/components/icons";
import { Watering } from "@/components/garden/watering";
import type { Season } from "@/lib/garden/conditions";
import { skillColor } from "@/lib/ui/format";

/**
 * The quick-log flow, played on a loop inside a phone frame.
 *
 * Chip, duration, water, confirmation: the four screens a reviewer would have
 * to walk through by hand, sequenced so the section explains itself while they
 * read the steps beside it. Runs only while on screen, renders the final
 * frame (a grown plant and its confirmation) for reduced-motion visitors, and
 * uses the same components the app's log sheet renders.
 */

const STEPS = ["chips", "durations", "watering", "toast"] as const;
type Step = (typeof STEPS)[number];

const STEP_MS: Record<Step, number> = {
  chips: 1_600,
  durations: 1_300,
  watering: 1_800,
  toast: 2_400,
};

const SKILLS = [
  { name: "Japanese", hue: 24 },
  { name: "Piano", hue: 190 },
  { name: "Running", hue: 96 },
];

const PRESETS = ["15m", "30m", "45m", "1h", "1.5h", "2h"];

export function PhoneDemo({ season }: { season: Season }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("chips");
  const [running, setRunning] = useState(false);
  // motion's hook, not a raw matchMedia read: it is SSR-safe and updates when
  // the OS setting changes.
  const reduceMotion = useReducedMotion();
  // Reduced motion is only honoured after hydration: the first client render
  // must match the server's HTML or React tears the tree down (error #418).
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setRunning(entries[0].isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running || reduceMotion) return;

    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      const step = STEPS[index % STEPS.length];
      setStep(step);
      index += 1;
      timer = setTimeout(advance, STEP_MS[step]);
    };
    advance();
    return () => clearTimeout(timer);
  }, [running, reduceMotion]);

  // Reduced motion gets the end of the story, not a frozen first frame.
  const shown = !hydrated ? "chips" : reduceMotion ? "toast" : step;

  return (
    <div className="relative mx-auto w-[264px]">
      <div
        ref={ref}
        // Decorative: the caption below carries the meaning.
        aria-hidden
        className="border border-ink/80 bg-ink p-1.5 shadow-raised"
      >
        <div className="relative flex h-[500px] flex-col overflow-hidden bg-paper">
          {/* The notch, drawn rather than photographed. */}
          <span className="mx-auto mt-2 h-1.5 w-16 bg-ink/15" />

          {/* A quiet hour of app above the sheet. */}
          <div className="px-4 pt-3">
            <p className="text-eyebrow text-muted uppercase">This week</p>
            <p className="numeral text-hero text-ink">18h</p>
          </div>

          <div className="mt-auto border-t border-line bg-paper-raised px-3 pt-2 pb-5">
            <span className="mx-auto mb-3 block h-1 w-10 bg-line-strong" />
            {shown === "chips" && <Chips />}
            {shown === "durations" && <Durations />}
            {shown === "watering" && <WateringScene season={season} />}
            {shown === "toast" && <ToastScene season={season} />}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        Two taps to record. The water is what saving looks like.
      </p>
    </div>
  );
}

function Chips() {
  return (
    <div>
      <p className="display mb-2 text-base font-semibold">What did you do?</p>
      <ul className="flex flex-wrap gap-1.5">
        {SKILLS.map((skill, i) => {
          const picked = i === 0;
          const color = skillColor(skill.hue);
          return (
            <li
              key={skill.name}
              className="rise-in"
              style={{ ["--rise-delay" as string]: `${i * 0.08}s` }}
            >
              <span
                className="inline-flex items-center border px-3 py-1.5 text-sm"
                style={
                  picked
                    ? { background: skillColor(skill.hue, { solid: true }), color: "#fff" }
                    : { border: "1px solid var(--line)", color }
                }
              >
                {skill.name}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 text-xs text-muted">Picked Japanese</p>
    </div>
  );
}

function Durations() {
  return (
    <div>
      <p className="display mb-2 text-base font-semibold">How long on Japanese?</p>
      <ul className="grid grid-cols-3 gap-1.5">
        {PRESETS.map((preset, i) => {
          const picked = preset === "1h";
          return (
            <li
              key={preset}
              className="rise-in"
              style={{ ["--rise-delay" as string]: `${i * 0.05}s` }}
            >
              <span
                className={[
                  "block py-2.5 text-center text-sm font-medium",
                  picked ? "bg-ink text-paper" : "border border-line bg-paper",
                ].join(" ")}
              >
                {preset}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WateringScene({ season }: { season: Season }) {
  return (
    <div className="flex flex-col items-center py-1">
      <Watering
        stageBefore="sapling"
        stageAfter="young"
        color={skillColor(24)}
        size={72}
        season={season}
        soil="rich"
      />
      <p className="mt-1 text-xs text-muted">Saving…</p>
    </div>
  );
}

function ToastScene({ season }: { season: Season }) {
  return (
    <div className="flex flex-col items-center py-1">
      <Plant stage="young" color={skillColor(24)} size={64} season={season} soil="rich" />
      <p className="rise-in mt-2 flex items-center gap-1.5 border border-growth/30 bg-growth-soft px-3 py-1.5 text-xs font-medium text-growth">
        <Check size={12} strokeWidth={3} aria-hidden />
        Recorded: 1h of Japanese
      </p>
    </div>
  );
}
