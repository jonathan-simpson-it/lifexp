"use client";

import { PlantGlyph, type PlantStage } from "@/components/icons";

/**
 * Watering the plant — what logging looks like.
 *
 * The design trap this component exists to avoid: in every farming game,
 * watering is an *obligation*. The plant gets thirsty, you owe it water, and
 * you feel bad when you don't. That is a streak wearing a costume, and it would
 * quietly undo the one thing this product is built on.
 *
 * So there is no thirsty state, no "needs water" prompt, and nothing anywhere
 * that asks to be watered. Watering only ever happens as a *consequence* of the
 * user recording something. It is a reward, never a chore.
 *
 * The sequence, ~1.5s end to end:
 *
 *   0.00s  can swings in from the upper right and tips
 *   0.25s  droplets begin falling, staggered
 *   0.60s  soil darkens where they land
 *   0.70s  plant squashes and stretches — and, if this log crossed a
 *          milestone, the next stage cross-fades in *during* the squash, so
 *          the water visibly caused the growth
 *   1.05s  can lifts away
 *
 * Reduced motion renders the end state immediately: the grown plant, no can,
 * no droplets. Nothing moves and nothing is lost.
 */

/** Where each droplet falls, and when. Irregular on purpose — evenly spaced
 *  drops read as a machine rather than a can. */
const DROPS = [
  { x: 26, delay: 0.25 },
  { x: 33, delay: 0.31 },
  { x: 29.5, delay: 0.38 },
  { x: 36, delay: 0.44 },
  { x: 31, delay: 0.52 },
  { x: 34.5, delay: 0.59 },
];

export function Watering({
  stageBefore,
  stageAfter,
  color,
  size = 64,
}: {
  stageBefore: PlantStage;
  stageAfter: PlantStage;
  color: string;
  size?: number;
}) {
  const grew = stageBefore !== stageAfter;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* The plant before. Only rendered when the stage actually changed —
          otherwise it would sit behind an identical copy of itself. */}
      {grew && (
        <g className="water-plant water-stage-out">
          <PlantGlyph stage={stageBefore} color={color} />
        </g>
      )}

      <g className={`water-plant${grew ? " water-stage-in" : ""}`}>
        <PlantGlyph stage={stageAfter} color={color} />
      </g>

      {/* Soil darkening where the water lands. A wet patch, not a shadow. */}
      <ellipse
        className="water-soil"
        cx="32"
        cy="56.6"
        rx="10"
        ry="2.6"
        fill="var(--accent-deep)"
      />

      {DROPS.map((drop, i) => (
        <circle
          key={i}
          className="water-drop"
          cx={drop.x}
          cy="20"
          r="1.5"
          fill="var(--accent)"
          style={{ animationDelay: `${drop.delay}s` }}
        />
      ))}

      {/* The can. Drawn rather than imported so it inherits the palette and
          matches the 2px rounded-stroke language of the rest of the icon set. */}
      <g className="water-can">
        <path
          d="M45 15h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
          fill="var(--accent-deep)"
        />
        <path
          d="M46.5 15v-1.5a3.5 3.5 0 0 1 7 0V15"
          stroke="var(--accent-deep)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Spout, pointing down-left toward the plant. */}
        <path
          d="M43 18.5 36 23"
          stroke="var(--accent-deep)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
