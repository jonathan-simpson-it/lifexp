import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * The living garden.
 *
 * A skill's plant stage is derived from the highest milestone tier it has
 * reached. Growth is the only direction: there is no wilted, browned or dead
 * stage, and there is no code path that can move a plant backwards. A skill
 * untouched for a year renders exactly as it did the day it was last logged.
 *
 * That is the anti-streak rule made visual, and it is the reason this component
 * takes a tier rather than anything time-based.
 */

export type PlantStage =
  | "seed"
  | "sprout"
  | "sapling"
  | "young"
  | "flowering"
  | "fruiting"
  | "grand";

const STAGE_BY_TIER: Record<MilestoneTier, PlantStage> = {
  FIRST_STEPS: "sprout",
  FOUNDATION: "sapling",
  BRONZE: "young",
  SILVER: "flowering",
  GOLD: "fruiting",
  MASTERY: "grand",
  CUSTOM: "young",
};

export function stageForTier(tier: MilestoneTier | null): PlantStage {
  return tier ? STAGE_BY_TIER[tier] : "seed";
}

/** Human label, used for the accessible name. Never says "only" or "just". */
export const STAGE_LABEL: Record<PlantStage, string> = {
  seed: "a seed",
  sprout: "a sprout",
  sapling: "a sapling",
  young: "a young tree",
  flowering: "in flower",
  fruiting: "bearing fruit",
  grand: "a grand tree",
};

/**
 * Soil width tracks the stage. A seedling in a wide bed looks lost; a grand
 * tree in a narrow one looks potted. Scaling the ground with the plant is what
 * makes the set read as a progression rather than as sprites of one size.
 */
const SOIL_WIDTH: Record<PlantStage, number> = {
  seed: 9,
  sprout: 11,
  sapling: 13,
  young: 15,
  flowering: 16,
  fruiting: 17,
  grand: 19,
};

export function Plant({
  stage,
  color,
  size = 72,
  swaying = true,
}: {
  stage: PlantStage;
  /** The skill's colour, so the garden and its cards agree. */
  color: string;
  size?: number;
  swaying?: boolean;
}) {
  const soil = SOIL_WIDTH[stage];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={swaying ? "plant-sway" : undefined}
    >
      {/* Soil is always present — even a seed sits in ground that is tended. */}
      <ellipse cx="32" cy="57" rx={soil} ry={soil * 0.26} fill="var(--line)" />
      <ellipse
        cx="32"
        cy="56.2"
        rx={soil * 0.72}
        ry={soil * 0.17}
        fill="var(--line-strong)"
        opacity="0.65"
      />

      {stage === "seed" && <Seed color={color} />}
      {stage === "sprout" && <Sprout color={color} />}
      {stage === "sapling" && <Sapling color={color} />}
      {stage === "young" && <YoungTree color={color} />}
      {stage === "flowering" && <Flowering color={color} />}
      {stage === "fruiting" && <Fruiting color={color} />}
      {stage === "grand" && <GrandTree color={color} />}
    </svg>
  );
}

/* --- stages ------------------------------------------------------------- */

const stem = {
  stroke: "var(--growth)",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  fill: "none",
};

/*
  Each stage is drawn to a distinctly different height and silhouette. Adjacent
  stages have to be tellable apart at a glance in a 76px box — an earlier pass
  differed only in leaf count and a skill with ten times the evidence of its
  neighbour looked identical to it, which defeats the point of the garden.

  Heights, crown to soil:  seed 8 · sprout 20 · sapling 32 · young 40 ·
  flowering 44 · fruiting 48 · grand 54
*/

function Seed({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx="32" cy="49" rx="4.5" ry="5.5" fill={color} opacity="0.85" />
      <path d="M32 45.5c0-1.6.8-3 2-3.8" {...stem} strokeWidth={2} />
    </g>
  );
}

function Sprout({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 52V38" {...stem} />
      <path
        d="M32 42c-6 0-9-3.5-9-8 5 0 9 3 9 8Z"
        fill={color}
        opacity="0.9"
      />
      <path d="M32 40c5 0 8-3 8-7-4.5 0-8 2.6-8 7Z" fill={color} />
    </g>
  );
}

function Sapling({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 52V26" {...stem} />
      <path d="M32 38c-7 0-11-4-11-9.5 6 0 11 3.5 11 9.5Z" fill={color} opacity="0.85" />
      <path d="M32 32c6.5 0 10.5-3.8 10.5-9-5.6 0-10.5 3.3-10.5 9Z" fill={color} />
      <path d="M32 26c-4 0-6.5-2.5-6.5-6 3.6 0 6.5 2.2 6.5 6Z" fill={color} opacity="0.7" />
    </g>
  );
}

function YoungTree({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 52V30" {...stem} />
      <path d="M32 38l-7-6M32 34l7-6" {...stem} strokeWidth={2.5} />
      <circle cx="32" cy="22" r="11" fill={color} opacity="0.9" />
      <circle cx="22" cy="28" r="7" fill={color} opacity="0.75" />
      <circle cx="42" cy="28" r="7" fill={color} opacity="0.75" />
    </g>
  );
}

function Flowering({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 52V30" {...stem} />
      <path d="M32 38l-7-6M32 34l7-6" {...stem} strokeWidth={2.5} />
      <circle cx="32" cy="22" r="11.5" fill={color} opacity="0.9" />
      <circle cx="21" cy="28" r="7" fill={color} opacity="0.75" />
      <circle cx="43" cy="28" r="7" fill={color} opacity="0.75" />
      {/* Blossom — the first stage that reads as a reward rather than growth. */}
      <circle cx="26" cy="18" r="2.6" fill="var(--paper-raised)" />
      <circle cx="37" cy="24" r="2.6" fill="var(--paper-raised)" />
      <circle cx="34" cy="15" r="2.2" fill="var(--paper-raised)" />
    </g>
  );
}

function Fruiting({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 52V28" {...stem} strokeWidth={3.5} />
      <path d="M32 38l-8-7M32 34l8-7" {...stem} strokeWidth={2.5} />
      <circle cx="32" cy="21" r="12.5" fill={color} opacity="0.9" />
      <circle cx="20" cy="28" r="7.5" fill={color} opacity="0.75" />
      <circle cx="44" cy="28" r="7.5" fill={color} opacity="0.75" />
      <circle cx="26" cy="19" r="3" fill="var(--medal-bright)" />
      <circle cx="38" cy="23" r="3" fill="var(--medal-bright)" />
      <circle cx="34" cy="13" r="2.6" fill="var(--medal-bright)" />
    </g>
  );
}

function GrandTree({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 53V26" {...stem} strokeWidth={4.5} />
      <path d="M32 38l-9-8M32 33l9-8" {...stem} strokeWidth={3} />
      <circle cx="32" cy="19" r="14" fill={color} />
      <circle cx="18" cy="27" r="8.5" fill={color} opacity="0.8" />
      <circle cx="46" cy="27" r="8.5" fill={color} opacity="0.8" />
      <circle cx="32" cy="34" r="7" fill={color} opacity="0.7" />
      <circle cx="25" cy="16" r="3.2" fill="var(--medal-bright)" />
      <circle cx="39" cy="21" r="3.2" fill="var(--medal-bright)" />
      <circle cx="34" cy="11" r="2.8" fill="var(--medal-bright)" />
      <circle cx="20" cy="25" r="2.4" fill="var(--medal-bright)" />
    </g>
  );
}
