/**
 * The twelve badge symbols.
 *
 * Drawn here rather than imported, for the same reason the plants and the nav
 * icons are. These sit inside a struck medal, at about 24px, engraved in the
 * darker metal; a library glyph designed for a toolbar has the wrong weight
 * for that and, more importantly, brings a third drawing style into a product
 * that already has one.
 *
 * Rules of the set: a 24x24 grid, 2px rounded strokes in `currentColor`, and
 * no fills except where a shape genuinely reads better solid. Each symbol says
 * something about what the badge is *for* rather than decorating it, so
 * `the-return` is a path doubling back and `quiet-month` is a single feather.
 */

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

/** First experience: a sprout breaking ground. */
export function SymbolSprout() {
  return (
    <g {...stroke}>
      <path d="M12 20v-7" />
      <path d="M12 14c-3.2 0-5-2-5-4.8 2.9 0 5 1.8 5 4.8Z" />
      <path d="M12 13c3 0 4.8-1.9 4.8-4.6-2.7 0-4.8 1.7-4.8 4.6Z" />
    </g>
  );
}

/** The Return: a path that leaves and comes back. */
export function SymbolReturn() {
  return (
    <g {...stroke}>
      <path d="M5.5 15a7 7 0 1 0 2-7.6" />
      <path d="M4.5 4.5v4h4" />
    </g>
  );
}

/** Polymath: three pursuits, interlocking. */
export function SymbolRings() {
  return (
    <g {...stroke}>
      <circle cx="9" cy="10" r="4.6" />
      <circle cx="15" cy="10" r="4.6" />
      <circle cx="12" cy="15.4" r="4.6" />
    </g>
  );
}

/** Deep Diver: a plumb line, dropped and held. */
export function SymbolPlumb() {
  return (
    <g {...stroke}>
      <path d="M12 3v9" />
      <path d="M12 12l3.4 4.2L12 21l-3.4-4.8Z" />
      <path d="M7.5 3h9" />
    </g>
  );
}

/** Hundred Hours: a peak with the summit marked. */
export function SymbolPeak() {
  return (
    <g {...stroke}>
      <path d="M3 19l6.5-11 4 6 2.4-3.6L21 19Z" />
      <circle cx="9.5" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </g>
  );
}

/** Milestone: a flag planted on a post. */
export function SymbolFlag() {
  return (
    <g {...stroke}>
      <path d="M7 21V4" />
      <path d="M7 4.8h10.5l-2.6 4 2.6 4H7Z" />
    </g>
  );
}

/** Night Owl: a crescent, with the hours around it. */
export function SymbolCrescent() {
  return (
    <g {...stroke}>
      <path d="M18.4 14.6A7.2 7.2 0 0 1 9 5.4a7.6 7.6 0 1 0 9.4 9.2Z" />
      <path d="M18 4.5v2.4M16.8 5.7h2.4" />
    </g>
  );
}

/** Early Bird: a sun clearing the horizon. */
export function SymbolSunrise() {
  return (
    <g {...stroke}>
      <path d="M3.5 19h17" />
      <path d="M7.6 15a4.4 4.4 0 0 1 8.8 0" />
      <path d="M12 4.4v2.3M5.6 7.3l1.6 1.6M18.4 7.3l-1.6 1.6" />
    </g>
  );
}

/** Quiet Month: one feather, falling slowly. */
export function SymbolFeather() {
  return (
    <g {...stroke}>
      <path d="M18.5 5.5c2 2 2 5.4 0 7.4l-7 7-5.4.6.6-5.4 7-7c2-2 2.8-2.6 4.8-2.6Z" />
      <path d="M6.6 20.4L13 14" />
    </g>
  );
}

/** Caretaker: a house, kept up. */
export function SymbolHouse() {
  return (
    <g {...stroke}>
      <path d="M4 11l8-6.5 8 6.5" />
      <path d="M6 10.2V20h12v-9.8" />
      <path d="M10 20v-4.6h4V20" />
    </g>
  );
}

/** Storyteller: a nib, and the line it leaves. */
export function SymbolNib() {
  return (
    <g {...stroke}>
      <path d="M15.6 3.9l4.5 4.5-9.4 9.4-5.6 1.1 1.1-5.6Z" />
      <path d="M13.4 6.1l4.5 4.5" />
      <path d="M4 21h9" />
    </g>
  );
}

/** Year One: a tree with a full year's ring. */
export function SymbolTreeRing() {
  return (
    <g {...stroke}>
      <path d="M12 21v-5.6" />
      <path d="M12 15.4a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8Z" />
      <path d="M12 12.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
    </g>
  );
}
