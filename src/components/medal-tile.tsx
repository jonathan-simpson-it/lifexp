import { Medal } from "@/components/icons";
import { badgeVisual } from "@/components/badge-icon";
import type { MilestoneTier } from "@/lib/progress/milestones";

/**
 * A medal hanging on a shelf.
 *
 * The rail is the point. A grid of bordered boxes is a list of records; medals
 * hooked over a rail is a thing you own, and the whole product is built on the
 * difference between those two feelings.
 *
 * The rail is drawn per tile and bleeds 6px past each edge, which is slightly
 * wider than the grid gap, so adjacent rails meet and read as one continuous
 * bar across the row. That survives wrapping and any column count, which a
 * single rail drawn behind the grid would not.
 *
 * Tiles have no box of their own any more. Height is still fixed by clamping
 * the title and description, so a row stays even.
 */
export function MedalTile({
  tier,
  title,
  subtitle,
  earned,
  symbol,
  footnote,
  /** Position in the row, used to stagger the idle sway. */
  index = 0,
  /** Plays the strike sequence once; the landing showcase uses it on entry. */
  striking = false,
}: {
  tier: MilestoneTier;
  title: string;
  subtitle?: string | null;
  earned: boolean;
  symbol?: React.ReactNode;
  /** Date, or the one-line context sentence. */
  footnote?: string | null;
  index?: number;
  striking?: boolean;
}) {
  return (
    <div
      className="group relative flex h-full flex-col items-center pt-3 text-center"
      title={subtitle ? `${title}: ${subtitle}` : title}
    >
      {/* The rail, and the shadow it casts on the wall behind. */}
      <span
        aria-hidden
        // Bleeds wider than the 12px grid gap so neighbouring rails overlap
        // rather than merely meet. Exact abutment leaves a hairline at most
        // fractional widths, and a broken rail reads as a rendering fault.
        className="absolute -inset-x-2.5 top-0 h-[3px] bg-line-strong"
      />
      {/* The shadow deliberately does NOT bleed like the rail above it. The
          rail is opaque, so overlapping neighbours join invisibly; this is
          semi-transparent, and overlapping it doubles the alpha into a visible
          dark band at every tile boundary. Not bleeding leaves a 12px gap in a
          6px-tall 6% shadow, which nobody can see. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-[3px] h-1.5 bg-gradient-to-b from-ink/6 to-transparent"
      />

      {/* Hangs from the rail, so it swings from the top rather than pivoting
          about its own middle. */}
      <span
        className="medal-hang block origin-top"
        style={{ ["--hang-delay" as string]: `${(index % 6) * 0.5}s` }}
      >
        <Medal tier={tier} size={58} earned={earned} symbol={symbol} striking={striking} />
      </span>

      <p
        className={[
          "mt-1 line-clamp-2 w-full text-caption leading-tight font-semibold",
          earned ? "text-ink" : "text-muted",
        ].join(" ")}
      >
        {title}
      </p>

      {subtitle && (
        // Exactly two lines, always. This is what keeps a row even.
        <p className="mt-0.5 line-clamp-2 text-eyebrow leading-snug tracking-normal text-muted normal-case">
          {subtitle}
        </p>
      )}

      {footnote && (
        <p className="mt-auto pt-1 text-eyebrow tracking-normal text-medal normal-case">
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
  index,
}: {
  tier: MilestoneTier;
  label: string;
  skillName: string;
  achievedAt?: string | null;
  index?: number;
}) {
  return (
    <MedalTile
      tier={tier}
      title={label}
      subtitle={skillName}
      footnote={achievedAt}
      index={index}
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
  index,
  striking = false,
}: {
  badgeKey: string;
  title: string;
  subtitle?: string | null;
  earned: boolean;
  footnote?: string | null;
  index?: number;
  striking?: boolean;
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
      index={index}
      striking={striking}
    />
  );
}
