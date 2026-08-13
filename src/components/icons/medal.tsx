import type { ReactNode } from "react";
import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * Medals.
 *
 * One shape family for everything the app awards, so a shelf reads as a set.
 * Before this there were two: milestones were struck medals and the twelve
 * global badges were lucide line icons sitting in plain circles, which is why
 * the shelf looked like a bag of stickers rather than a collection.
 *
 * Rank is expressed through metal, ribbon and the number of points on the
 * star. Never through size: a Gold medal is not bigger than a Bronze, because
 * nobody's first should look small next to somebody's fifth.
 *
 * The medal takes either a tier, drawing its star, or a `symbol`, one of the
 * badge glyphs. Both sit in the same recessed field, so a badge and a
 * milestone are visibly the same kind of object.
 */

const TIER_METAL: Record<MilestoneTier, { face: string; edge: string }> = {
  FIRST_STEPS: { face: "#cfc4b2", edge: "#a89b86" },
  FOUNDATION: { face: "#a8b795", edge: "#7f9068" },
  BRONZE: { face: "#c58b57", edge: "#96683c" },
  SILVER: { face: "#c2c9d0", edge: "#8d97a1" },
  GOLD: { face: "#e0b23f", edge: "#b3861d" },
  MASTERY: { face: "#a495d8", edge: "#6f5eae" },
  CUSTOM: { face: "#dcc79a", edge: "#a8874a" },
};

const POINTS: Record<MilestoneTier, number> = {
  FIRST_STEPS: 0,
  FOUNDATION: 0,
  BRONZE: 4,
  SILVER: 5,
  GOLD: 6,
  MASTERY: 8,
  CUSTOM: 4,
};

const CX = 32;
const CY = 40;

export function Medal({
  tier,
  size = 48,
  earned = true,
  symbol,
  ribbon = true,
  /** Drives the strike sequence; see the medal keyframes in globals.css. */
  striking = false,
}: {
  tier: MilestoneTier;
  size?: number;
  earned?: boolean;
  /** A badge glyph, drawn on a 24x24 grid, in place of the tier star. */
  symbol?: ReactNode;
  ribbon?: boolean;
  striking?: boolean;
}) {
  const metal = TIER_METAL[tier];
  const points = POINTS[tier];

  // An unearned medal keeps its full silhouette and loses only its metal, so
  // the shelf shows the shape of what is still out there rather than a hole.
  const face = earned ? metal.face : "var(--line)";
  const edge = earned ? metal.edge : "var(--line-strong)";

  return (
    <svg
      width={size}
      height={size}
      // Without the ribbon the top third of the box is empty, which would
      // render the disc small and low. Crop to the disc instead.
      viewBox={ribbon ? "0 0 64 64" : "10 18 44 44"}
      fill="none"
      aria-hidden
      className={striking ? "medal-strike" : undefined}
    >
      {/* The strike ring. Inside the SVG so it is aligned with the rim by
          construction: as a DOM sibling it has to be positioned against a disc
          whose centre is not the centre of its own box. */}
      {striking && (
        <circle
          className="medal-ring"
          cx={CX}
          cy={CY}
          r="20"
          fill="none"
          stroke="var(--medal-bright)"
          strokeWidth="2"
        />
      )}

      {ribbon && (
        <g className={striking ? "medal-ribbon" : undefined}>
          {/* The far strap sits behind and a shade darker, which is the whole
              trick that stops the ribbon reading as a flat V. */}
          <path d="M46 4h-8l-7 22h9Z" fill={edge} opacity={earned ? 0.55 : 0.3} />
          <path d="M18 4h8l7 22h-9Z" fill={edge} opacity={earned ? 0.85 : 0.45} />
          {/* The fold where the straps meet the medal. */}
          <path d="M27 24h10l1.5 4h-13Z" fill={edge} opacity={earned ? 0.95 : 0.5} />
        </g>
      )}

      <g className={striking ? "medal-disc" : undefined}>
        <circle cx={CX} cy={CY} r="20" fill={edge} />

        {/* Knurling. A dashed stroke rather than 24 hand-placed ticks: the same
            milled edge out of one element. */}
        <circle
          cx={CX}
          cy={CY}
          r="18.6"
          stroke={face}
          strokeWidth="2.2"
          strokeDasharray="1.4 3.1"
          opacity="0.55"
        />

        <circle cx={CX} cy={CY} r="16" fill={face} />
        {/* Recess: one step darker, so the field reads as stamped into the
            metal rather than printed on it. */}
        <circle
          cx={CX}
          cy={CY}
          r="13"
          stroke={edge}
          strokeWidth="1.2"
          opacity="0.35"
        />

        {symbol ? (
          <g
            // Scaled up a little from the 24px grid: the field is 32 units
            // across, and a symbol drawn to fit a toolbar reads as timid
            // inside a medal.
            transform={`translate(${CX} ${CY}) scale(1.12) translate(-12 -12)`}
            color={edge}
            opacity={earned ? 0.9 : 0.6}
          >
            {symbol}
          </g>
        ) : points > 0 ? (
          <Star points={points} edge={edge} striking={striking} />
        ) : (
          <circle cx={CX} cy={CY} r="5.2" fill={edge} opacity="0.5" />
        )}

        {/* A soft highlight so the metal reads as metal rather than a disc. */}
        {earned && (
          <path
            d="M21 33a13 13 0 0 1 10.5-4.7"
            stroke="#fff"
            strokeOpacity="0.5"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}

        {/* One gleam crossing the face, clipped to it. A fixed clip id is safe
            because only one medal is ever striking at a time. */}
        {striking && (
          <>
            <defs>
              <clipPath id="medal-face-clip">
                <circle cx={CX} cy={CY} r="16" />
              </clipPath>
            </defs>
            <g clipPath="url(#medal-face-clip)">
              <rect
                className="medal-gleam"
                x={CX - 6}
                y={CY - 26}
                width="9"
                height="52"
                fill="#fff"
                opacity="0.55"
                transform={`rotate(18 ${CX} ${CY})`}
              />
            </g>
          </>
        )}
      </g>
    </svg>
  );
}

function Star({
  points,
  edge,
  striking,
}: {
  points: number;
  edge: string;
  striking: boolean;
}) {
  const outer = 8.2;
  const inner = 3.7;
  const path: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    path.push(
      `${i === 0 ? "M" : "L"}${(CX + radius * Math.cos(angle)).toFixed(2)} ${(
        CY +
        radius * Math.sin(angle)
      ).toFixed(2)}`,
    );
  }
  path.push("Z");

  return (
    <path
      d={path.join(" ")}
      fill={edge}
      opacity="0.62"
      className={striking ? "medal-star" : undefined}
    />
  );
}
