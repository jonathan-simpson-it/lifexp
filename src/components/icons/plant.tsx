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

/**
 * Amplitude of the idle sway, per stage.
 *
 * A seedling whips about in a breeze and a grand tree barely moves. Falling
 * amplitude is most of what stops a row of plants reading as one sprite
 * repeated, the other half is the per-index delay the garden sets.
 */
export const SWAY_AMPLITUDE: Record<PlantStage, string> = {
  seed: "0.6deg",
  sprout: "1.5deg",
  sapling: "1.3deg",
  young: "1deg",
  flowering: "0.85deg",
  fruiting: "0.7deg",
  grand: "0.5deg",
};

/**
 * The plant itself, without an `<svg>` wrapper.
 *
 * Split out so the watering scene can compose a plant, a can and falling
 * droplets into a single coordinate space, droplets have to land on the soil,
 * which means they must share the plant's viewBox rather than be positioned
 * over a nested SVG.
 */
export function PlantGlyph({
  stage,
  color,
}: {
  stage: PlantStage;
  color: string;
}) {
  const soil = SOIL_WIDTH[stage];

  return (
    <>
      {/* Soil is always present, even a seed sits in ground that is tended. */}
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
    </>
  );
}

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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={swaying ? "plant-sway" : undefined}
      style={{ ["--sway-amp" as string]: SWAY_AMPLITUDE[stage] }}
    >
      <PlantGlyph stage={stage} color={color} />
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
  stages have to be tellable apart at a glance in a 76px box, an earlier pass
  differed only in leaf count and a skill with ten times the evidence of its
  neighbour looked identical to it, which defeats the point of the garden.

  Heights, crown to soil:  seed 8 · sprout 20 · sapling 32 · young 40 ·
  flowering 44 · fruiting 48 · grand 54
*/

function Seed({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx="32" cy="51" rx="4" ry="5" fill={color} opacity="0.9" />
      <path d="M32 47c0-1.8.9-3.2 2.4-4" {...stem} strokeWidth={2} />
    </g>
  );
}

function Sprout({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 54V37" {...stem} />
      <path d="M32 44c-5.5 0-8.4-3.2-8.4-7.4 4.6 0 8.4 2.8 8.4 7.4Z" fill={color} opacity="0.85" />
      <path d="M32 41c4.8 0 7.6-2.9 7.6-6.7-4.3 0-7.6 2.5-7.6 6.7Z" fill={color} />
    </g>
  );
}

/** Slender and clearly taller than a sprout, with a visible branching stem. */
function Sapling({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 54V25" {...stem} strokeWidth={3.2} />
      <path d="M32 40l-6.5 -5M32 34l6.5 -5" {...stem} strokeWidth={2.2} />
      <path d="M32 43c-7.5 0-11.5-4.3-11.5-10 6.4 0 11.5 3.8 11.5 10Z" fill={color} opacity="0.8" />
      <path d="M32 36c7 0 11-4.1 11-9.6-6 0-11 3.5-11 9.6Z" fill={color} opacity="0.9" />
      <path d="M32 27c-4.6 0-7.4-2.9-7.4-6.9 4.1 0 7.4 2.6 7.4 6.9Z" fill={color} />
    </g>
  );
}

/** First stage with a true canopy, the silhouette changes from leaves to tree. */
function YoungTree({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 55V32" {...stem} strokeWidth={3.6} />
      <path d="M32 40l-7-6.5M32 36l7-6.5" {...stem} strokeWidth={2.6} />
      <circle cx="32" cy="23" r="10" fill={color} opacity="0.92" />
      <circle cx="23.5" cy="29" r="6.2" fill={color} opacity="0.72" />
      <circle cx="40.5" cy="29" r="6.2" fill={color} opacity="0.72" />
    </g>
  );
}

function Flowering({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 55V30" {...stem} strokeWidth={4} />
      <path d="M32 40l-8-7M32 35l8-7" {...stem} strokeWidth={2.8} />
      <circle cx="32" cy="20" r="12" fill={color} opacity="0.92" />
      <circle cx="21" cy="27.5" r="7.2" fill={color} opacity="0.74" />
      <circle cx="43" cy="27.5" r="7.2" fill={color} opacity="0.74" />
      {/* Blossom, the first stage that reads as reward rather than growth. */}
      <circle cx="25.5" cy="17" r="2.8" fill="var(--paper-raised)" />
      <circle cx="37.5" cy="23" r="2.8" fill="var(--paper-raised)" />
      <circle cx="33" cy="13" r="2.4" fill="var(--paper-raised)" />
      <circle cx="24" cy="26" r="2.2" fill="var(--paper-raised)" />
    </g>
  );
}

function Fruiting({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 55V28" {...stem} strokeWidth={4.4} />
      <path d="M32 40l-9-7.5M32 34l9-7.5" {...stem} strokeWidth={3} />
      <circle cx="32" cy="18.5" r="13.2" fill={color} opacity="0.94" />
      <circle cx="19.5" cy="27" r="8" fill={color} opacity="0.76" />
      <circle cx="44.5" cy="27" r="8" fill={color} opacity="0.76" />
      <circle cx="25" cy="16" r="3.2" fill="var(--medal-bright)" />
      <circle cx="38.5" cy="21" r="3.2" fill="var(--medal-bright)" />
      <circle cx="33" cy="10.5" r="2.8" fill="var(--medal-bright)" />
      <circle cx="20" cy="26" r="2.6" fill="var(--medal-bright)" />
    </g>
  );
}

function GrandTree({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 56V26" {...stem} strokeWidth={5.2} />
      <path d="M32 42l-10-8.5M32 35l10-8.5" {...stem} strokeWidth={3.4} />
      <circle cx="32" cy="16" r="14.6" fill={color} />
      <circle cx="17" cy="25.5" r="9" fill={color} opacity="0.82" />
      <circle cx="47" cy="25.5" r="9" fill={color} opacity="0.82" />
      <circle cx="32" cy="31.5" r="7.6" fill={color} opacity="0.7" />
      <circle cx="24" cy="13" r="3.4" fill="var(--medal-bright)" />
      <circle cx="39.5" cy="18" r="3.4" fill="var(--medal-bright)" />
      <circle cx="33" cy="7.5" r="3" fill="var(--medal-bright)" />
      <circle cx="18" cy="24" r="2.6" fill="var(--medal-bright)" />
      <circle cx="46" cy="27" r="2.6" fill="var(--medal-bright)" />
    </g>
  );
}
