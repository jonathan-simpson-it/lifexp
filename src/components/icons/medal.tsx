import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * Milestone medals.
 *
 * One shape family across all tiers so a shelf of them reads as a set, with
 * rank expressed through the ribbon, the number of points on the star, and the
 * metal — not through size. A Gold medal is not bigger than a Bronze; nobody's
 * first milestone should look small next to someone's fifth.
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

export function Medal({
  tier,
  size = 48,
  earned = true,
}: {
  tier: MilestoneTier;
  size?: number;
  earned?: boolean;
}) {
  const metal = TIER_METAL[tier];
  const points = POINTS[tier];

  // Unearned medals keep their silhouette but lose their metal, so the shelf
  // shows the shape of what is still out there rather than an empty hole.
  const face = earned ? metal.face : "var(--line)";
  const edge = earned ? metal.edge : "var(--line-strong)";

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {/* ribbon */}
      <path d="M16 4h6l-3.5 12H12L16 4Z" fill={edge} opacity={earned ? 0.9 : 0.5} />
      <path d="M32 4h-6l3.5 12H36L32 4Z" fill={edge} opacity={earned ? 0.7 : 0.4} />

      <circle cx="24" cy="29" r="14" fill={edge} />
      <circle cx="24" cy="29" r="11.5" fill={face} />

      {points > 0 && <Star cx={24} cy={29} points={points} edge={edge} />}
      {points === 0 && <circle cx="24" cy="29" r="4.6" fill={edge} opacity="0.55" />}

      {/* A soft highlight so the metal reads as metal rather than a flat disc. */}
      {earned && (
        <path
          d="M17 22.5a10 10 0 0 1 8-3.6"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function Star({
  cx,
  cy,
  points,
  edge,
}: {
  cx: number;
  cy: number;
  points: number;
  edge: string;
}) {
  const outer = 6.4;
  const inner = 2.9;
  const path: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    path.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  path.push("Z");

  return <path d={path.join(" ")} fill={edge} opacity="0.6" />;
}
