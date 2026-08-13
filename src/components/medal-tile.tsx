import { Medal } from "@/components/icons";
import { badgeVisual } from "@/components/badge-icon";
import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * One tile, used everywhere a medal appears.
 *
 * There used to be three layouts for the same thing: 40px circles on the home
 * shelf, two-column rows on the medals page, and a third arrangement for
 * milestones. The rows were the worst of it, because their height followed the
 * length of the description, so a shelf was a ragged column rather than a grid.
 *
 * Everything here is fixed: the medal size, the title line, and a description
 * clamped to two lines. Tiles are therefore the same height whatever is in
 * them, which is the only way a collection reads as a collection.
 */
export function MedalTile({
  tier,
  title,
  subtitle,
  earned,
  symbol,
  footnote,
}: {
  tier: MilestoneTier;
  title: string;
  subtitle?: string | null;
  earned: boolean;
  symbol?: React.ReactNode;
  /** Date, or the one-line context sentence. */
  footnote?: string | null;
}) {
  return (
    <div
      className={[
        "flex h-full flex-col items-center rounded-[var(--radius-lg)] border p-3 text-center",
        earned
          ? "border-medal/25 bg-medal-soft/45"
          : // Not dashed. A dashed box reads as a broken element; a solid one
            // at low contrast reads as a slot that is simply still empty.
            "border-line bg-paper/40",
      ].join(" ")}
    >
      <Medal tier={tier} size={56} earned={earned} symbol={symbol} />

      {/* Wraps to two lines rather than truncating. At three tiles across a
          phone, "First Experience" and "Hundred Hours" both lost their last
          word to an ellipsis, which is a poor way to name a thing someone
          just earned. */}
      <p
        className={[
          "mt-1.5 line-clamp-2 w-full text-caption leading-tight font-semibold",
          earned ? "text-ink" : "text-muted",
        ].join(" ")}
      >
        {title}
      </p>

      {subtitle && (
        // Exactly two lines, always. This is the fix for the ragged grid.
        <p className="mt-0.5 line-clamp-2 text-eyebrow leading-snug text-muted normal-case tracking-normal">
          {subtitle}
        </p>
      )}

      {footnote && (
        <p className="mt-auto pt-1.5 text-eyebrow text-medal normal-case tracking-normal">
          {footnote}
        </p>
      )}
    </div>
  );
}

/** A milestone rendered as a tile, so it matches the badges beside it. */
export function MilestoneTile({
  tier,
  label,
  skillName,
  achievedAt,
}: {
  tier: MilestoneTier;
  label: string;
  skillName: string;
  achievedAt?: string | null;
}) {
  return (
    <MedalTile
      tier={tier}
      title={label}
      subtitle={skillName}
      footnote={achievedAt}
      earned
    />
  );
}

/** A badge rendered as a tile, pulling its symbol and metal from one place. */
export function BadgeTile({
  badgeKey,
  title,
  subtitle,
  earned,
  footnote,
}: {
  badgeKey: string;
  title: string;
  subtitle?: string | null;
  earned: boolean;
  footnote?: string | null;
}) {
  const { symbol, metal } = badgeVisual(badgeKey);

  return (
    <MedalTile
      tier={metal}
      title={title}
      subtitle={subtitle}
      earned={earned}
      symbol={symbol}
      footnote={footnote}
    />
  );
}
