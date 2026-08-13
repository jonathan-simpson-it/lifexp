import type { MilestoneTier } from "@/lib/progress/milestones";
import {
  SymbolCrescent,
  SymbolFeather,
  SymbolFlag,
  SymbolHouse,
  SymbolNib,
  SymbolPeak,
  SymbolPlumb,
  SymbolRings,
  SymbolReturn,
  SymbolSprout,
  SymbolSunrise,
  SymbolTreeRing,
} from "@/components/icons/badges";

/**
 * What each badge is made of.
 *
 * Two things are looked up here, and they used to be neither: the symbol, which
 * was a lucide glyph in a circle, and the metal, which did not exist because
 * every badge was the same gold. Twelve identical gold discs is half of why the
 * shelf read as a set of stickers.
 *
 * The metal is assigned by how hard the badge is to get, reusing the milestone
 * tier palette rather than inventing a second one. It is a deliberate, readable
 * hierarchy: pale for the ones everybody gets on day one, gold for a hundred
 * hours and a year of history, and the violet reserved for the two that take
 * the longest to find.
 */

type BadgeVisual = { symbol: React.ReactNode; metal: MilestoneTier };

const BADGES: Record<string, BadgeVisual> = {
  // Arrive early, by design.
  "first-experience": { symbol: <SymbolSprout />, metal: "FIRST_STEPS" },
  caretaker: { symbol: <SymbolHouse />, metal: "FIRST_STEPS" },

  // Take a little doing.
  "first-milestone": { symbol: <SymbolFlag />, metal: "FOUNDATION" },
  storyteller: { symbol: <SymbolNib />, metal: "FOUNDATION" },

  // Take intent.
  polymath: { symbol: <SymbolRings />, metal: "BRONZE" },
  "early-bird": { symbol: <SymbolSunrise />, metal: "BRONZE" },
  "night-owl": { symbol: <SymbolCrescent />, metal: "BRONZE" },

  // Take real time.
  "deep-diver": { symbol: <SymbolPlumb />, metal: "SILVER" },
  "the-return": { symbol: <SymbolReturn />, metal: "SILVER" },

  // Take months.
  "hundred-hours": { symbol: <SymbolPeak />, metal: "GOLD" },
  "year-one": { symbol: <SymbolTreeRing />, metal: "GOLD" },

  // The one you cannot chase: it is awarded for a month where almost nothing
  // happened, which is the point of the whole product.
  "quiet-month": { symbol: <SymbolFeather />, metal: "MASTERY" },
};

const FALLBACK: BadgeVisual = { symbol: <SymbolSprout />, metal: "CUSTOM" };

/**
 * Explicit map rather than a dynamic lookup: it keeps tree-shaking honest and
 * makes an unknown key a visible fallback instead of a crash.
 */
export function badgeVisual(key: string): BadgeVisual {
  return BADGES[key] ?? FALLBACK;
}

/** The bare symbol, for the few places that want it without a medal around it. */
export function BadgeSymbol({ badgeKey }: { badgeKey: string }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      {badgeVisual(badgeKey).symbol}
    </svg>
  );
}
