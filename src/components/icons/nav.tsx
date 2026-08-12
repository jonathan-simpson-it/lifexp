/**
 * Bottom-bar and sidebar icons.
 *
 * Each takes an `active` flag and renders a filled variant rather than swapping
 * to a different glyph — the shape stays constant so the eye tracks it through
 * the transition, and only the weight changes.
 *
 * 24px grid, 2px rounded strokes, drawn to sit optically centred above a label.
 */

type IconProps = {
  active?: boolean;
  size?: number;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true,
});

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Today — a sun over the horizon. Warmer than a house, and about *now*. */
export function IconToday({ active, size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle
        cx="12"
        cy="11"
        r="4.2"
        {...stroke}
        fill={active ? "currentColor" : "none"}
      />
      <path d="M12 3v1.6M12 17.4V19M4.5 11H3M21 11h-1.5M6.7 5.7 5.6 4.6M18.4 4.6l-1.1 1.1" {...stroke} />
      <path d="M3.5 21h17" {...stroke} />
    </svg>
  );
}

/** Growth — a plant, echoing the garden. */
export function IconGrowth({ active, size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 21v-8.5" {...stroke} />
      <path
        d="M12 13.5c-3.4 0-5.5-2.1-5.5-5.2 3 0 5.5 1.9 5.5 5.2Z"
        {...stroke}
        fill={active ? "currentColor" : "none"}
      />
      <path
        d="M12 11.5c3.2 0 5.2-2 5.2-5-2.9 0-5.2 1.8-5.2 5Z"
        {...stroke}
        fill={active ? "currentColor" : "none"}
      />
      <path d="M8 21h8" {...stroke} />
    </svg>
  );
}

/** Calendar — a month grid, matching the page it opens. */
export function IconCalendar({ active, size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect
        x="3.2"
        y="5"
        width="17.6"
        height="15.5"
        rx="3.4"
        {...stroke}
        fill={active ? "currentColor" : "none"}
      />
      <path d="M3.2 9.6h17.6M8 3.2v3.4M16 3.2v3.4" {...stroke} />
      {!active && (
        <>
          <circle cx="8.2" cy="13.4" r="1.15" fill="currentColor" />
          <circle cx="12" cy="13.4" r="1.15" fill="currentColor" />
          <circle cx="15.8" cy="17" r="1.15" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

/** Medals — a rosette. */
export function IconMedals({ active, size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle
        cx="12"
        cy="9.3"
        r="6.1"
        {...stroke}
        fill={active ? "currentColor" : "none"}
      />
      <path d="m8.4 14.6-1.6 6 5.2-2.6 5.2 2.6-1.6-6" {...stroke} />
      {!active && <circle cx="12" cy="9.3" r="2.3" fill="currentColor" />}
    </svg>
  );
}

/**
 * The centre action. A plus, drawn heavier than the others because it is the
 * one control the whole product depends on being noticed.
 */
export function IconAdd({ size = 26 }: { size?: number }) {
  return (
    <svg {...base(size)}>
      <path
        d="M12 5.5v13M5.5 12h13"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
