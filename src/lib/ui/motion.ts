import type { Transition } from "motion/react";

/**
 * Shared motion vocabulary.
 *
 * The rule this file exists to enforce is in DESIGN.md §7 and it is short:
 * **motion only ever moves in the direction of growth.** Nothing in LifeXP
 * animates downward, drains, wilts, or empties. There is deliberately no
 * "shrink", "fade-out-to-nothing" or "decay" preset here, because a product
 * whose whole premise is that a slow month still counts must not own an
 * animation that can express loss.
 *
 * Most motion in the app is plain CSS, see globals.css. `motion` is reached
 * for only where CSS genuinely cannot go:
 *
 *   - shared-element transitions (`layoutId`), which have no CSS equivalent
 *   - animating a *number*, which is text content rather than a style
 *   - exit animations (`AnimatePresence`), which must be awaited by the
 *     library to keep a removed element mounted while it leaves
 *
 * Keeping that boundary explicit is what stops the bundle growing a physics
 * engine to fade a card in.
 */

/** The house spring. Overshoots slightly, then settles, used for anything
 *  that should feel physical rather than merely animated. */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.9,
};

/** Heavier and calmer, for larger objects: the sheet, a sliding month. */
export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 1,
};

/**
 * Eases a 0→1 progress value the way `--ease-out` does in CSS, so a JS-driven
 * animation and a CSS one that run side by side actually agree.
 */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Reads the user's motion preference outside React.
 *
 * `useReducedMotion` from motion/react covers components; this covers the
 * imperative paths (the counting figure, the confetti burst) that decide
 * whether to start an animation at all rather than how to render one.
 *
 * Returns false during SSR, which is the safe answer: the server renders the
 * settled state either way, and only the client ever starts anything.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
