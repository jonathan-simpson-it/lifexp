/**
 * What the garden puts on top of a plant.
 *
 * Three layers, and none of them can ever respond to how often the user logs:
 *
 *   season      the calendar, and nothing else
 *   soil        the number of experiences, which only ever goes up
 *   companion   the highest tier reached, which is never revoked
 *
 * All are drawn in the plant's 64-unit viewBox so they share its coordinates.
 * Nothing here removes anything from the plant: winter tints and frosts, it
 * does not strip the canopy, because a bare silhouette on a cream ground reads
 * as death rather than as January.
 */

/* --- season -------------------------------------------------------------- */

/** Spring: blossom caught in the canopy. */
export function Blossom({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // Fixed offsets rather than random, so a plant does not reshuffle its own
  // blossom on every render.
  const specks: [number, number, number][] = [
    [-0.55, -0.35, 1.5],
    [0.4, -0.6, 1.25],
    [0.15, 0.35, 1.35],
    [-0.3, 0.55, 1.1],
    [0.65, 0.1, 1.2],
  ];

  return (
    <g>
      {specks.map(([dx, dy, size], i) => (
        <circle
          key={i}
          cx={cx + dx * r}
          cy={cy + dy * r}
          r={size}
          fill="var(--paper-raised)"
          opacity="0.92"
        />
      ))}
    </g>
  );
}

/** Autumn: two leaves already on their way down. */
export function FallingLeaves({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g fill="var(--medal-bright)" opacity="0.75">
      <ellipse
        className="leaf-fall"
        cx={cx + 11}
        cy={cy + 14}
        rx="2.1"
        ry="1.2"
        transform={`rotate(28 ${cx + 11} ${cy + 14})`}
      />
      <ellipse
        className="leaf-fall leaf-fall-late"
        cx={cx - 12}
        cy={cy + 20}
        rx="1.9"
        ry="1.1"
        transform={`rotate(-18 ${cx - 12} ${cy + 20})`}
      />
    </g>
  );
}

/** Winter: frost along the soil line. */
export function Frost({ soil }: { soil: number }) {
  return (
    <g stroke="#cfe0e6" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
      <path d={`M${32 - soil * 0.8} 54.2h${soil * 0.5}`} />
      <path d={`M${32 + soil * 0.15} 53.4h${soil * 0.5}`} />
    </g>
  );
}

/* --- soil ---------------------------------------------------------------- */

/** Moss creeping in at the base. Arrives at 25 experiences and never leaves. */
export function Moss({ soil }: { soil: number }) {
  return (
    <g fill="var(--accent)" opacity="0.5">
      <ellipse cx={32 - soil * 0.62} cy="55.6" rx={soil * 0.22} ry="1.5" />
      <ellipse cx={32 + soil * 0.5} cy="56" rx={soil * 0.26} ry="1.6" />
    </g>
  );
}

/** Leaf litter on rich ground. Arrives at 100 and never leaves. */
export function LeafLitter({ soil }: { soil: number }) {
  return (
    <g fill="var(--medal)" opacity="0.32">
      <ellipse
        cx={32 - soil * 0.36}
        cy="57.6"
        rx="2.3"
        ry="1"
        transform={`rotate(-16 ${32 - soil * 0.36} 57.6)`}
      />
      <ellipse
        cx={32 + soil * 0.42}
        cy="58"
        rx="2.1"
        ry="0.95"
        transform={`rotate(22 ${32 + soil * 0.42} 58)`}
      />
      <ellipse cx={32 + soil * 0.05} cy="58.4" rx="1.9" ry="0.9" />
    </g>
  );
}

/* --- companions ---------------------------------------------------------- */

/** Bronze. Hovers beside the canopy. */
export function Bee({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const x = cx + r * 0.95;
  const y = cy - r * 0.35;
  return (
    <g className="companion-hover">
      <ellipse cx={x} cy={y} rx="1.9" ry="1.4" fill="var(--medal-bright)" />
      <path
        d={`M${x - 1.9} ${y}h3.8`}
        stroke="var(--ink)"
        strokeWidth="0.7"
        opacity="0.55"
      />
      <ellipse cx={x - 0.3} cy={y - 1.5} rx="1.5" ry="0.85" fill="#fff" opacity="0.8" />
    </g>
  );
}

/** Silver. Perched, still. */
export function Bird({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const x = cx - r * 0.9;
  const y = cy - r * 0.15;
  return (
    <g fill="var(--ink-soft)" opacity="0.7">
      <path d={`M${x} ${y}c1.8-2.2 4.4-1.6 4.6.5.1 1.7-1.4 2.9-3 2.6-1.3-.2-2.2-1.6-1.6-3.1Z`} />
      <path d={`M${x + 4.4} ${y - .2}l2.4-1.1-1.9 2.2Z`} />
    </g>
  );
}

/** Gold. Drifts across the canopy. */
export function Butterfly({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const x = cx + r * 0.15;
  const y = cy - r * 1.05;
  return (
    <g className="companion-drift" fill="var(--tier-mastery)" opacity="0.72">
      <ellipse cx={x - 1.5} cy={y} rx="1.7" ry="2.1" transform={`rotate(-22 ${x - 1.5} ${y})`} />
      <ellipse cx={x + 1.5} cy={y} rx="1.7" ry="2.1" transform={`rotate(22 ${x + 1.5} ${y})`} />
    </g>
  );
}

/**
 * Night, on the bed rather than on any one plant.
 *
 * Positioned in CSS rather than drawn in the plant's viewBox. Stretching a
 * 64-unit square across a bed that is four times wider than it is tall turned
 * three 1.3-unit circles into large orange lozenges, which is what they looked
 * like the first time this shipped.
 */
export function Fireflies() {
  // Kept in the upper band, above the plants and clear of the labels. A
  // firefly landing on the word "Reading" looks like a rendering fault.
  const points: [string, string, number][] = [
    ["21%", "18%", 0],
    ["58%", "34%", 1.6],
    ["86%", "22%", 3.1],
  ];

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {points.map(([left, top, delay], i) => (
        <span
          key={i}
          className="firefly absolute size-[3px] rounded-full bg-medal-bright"
          style={{ left, top, animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}
