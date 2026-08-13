import Link from "next/link";
import type { BadgeState } from "@/lib/progress/queries";
import { BadgeTile } from "./medal-tile";

/**
 * The shelf.
 *
 * Unearned badges are shown, not hidden: a locked slot with a hint, or "? ? ?"
 * for the ones meant to be a surprise. Seeing what is still out there is the
 * collection feeling; it is also the only place in the app that hints at what
 * to do next, and it does so without ever implying you are behind.
 *
 * Every medal in the app now goes through the same tile, so the home shelf, the
 * full shelf and the milestone list are one grid of identical objects instead
 * of three different treatments of the same idea.
 */
export function MedalShelf({
  badges,
  compact = false,
}: {
  badges: BadgeState[];
  compact?: boolean;
}) {
  const shown = compact ? badges.slice(0, 6) : badges;
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section aria-labelledby="medals-heading" className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 id="medals-heading" className="text-eyebrow text-muted uppercase">
          Medals
        </h2>
        <span className="text-caption text-muted">
          <span className="numeral text-ink">{earnedCount}</span> of{" "}
          {badges.length}
        </span>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {shown.map((badge) => (
          <li key={badge.definition.key}>
            <Tile badge={badge} />
          </li>
        ))}
      </ul>

      {compact && badges.length > shown.length && (
        <Link
          href="/medals"
          className="tappable mt-3 inline-block text-caption text-accent-deep underline underline-offset-4"
        >
          See the whole shelf
        </Link>
      )}
    </section>
  );
}

function Tile({ badge }: { badge: BadgeState }) {
  const { definition, earned } = badge;

  // Unearned and no hint: keep it a genuine surprise.
  const isSecret = !earned && definition.hint === null;

  return (
    <BadgeTile
      badgeKey={definition.key}
      title={earned ? definition.title : isSecret ? "? ? ?" : definition.title}
      subtitle={
        earned
          ? definition.description
          : isSecret
            ? "Still out there"
            : definition.hint
      }
      earned={earned}
      footnote={earned ? contextLine(definition.key, badge.context) : null}
    />
  );
}

/** Turns the stored context into one short phrase, where it adds anything. */
function contextLine(
  badgeKey: string,
  context: Record<string, unknown> | null | undefined,
): string | null {
  if (!context) return null;

  if (badgeKey === "the-return" && typeof context.quietDays === "number") {
    return `after ${context.quietDays} quiet days`;
  }
  if (badgeKey === "deep-diver" && typeof context.minutes === "number") {
    return `${Number((context.minutes / 60).toFixed(1))}h in one go`;
  }
  if (badgeKey === "caretaker" && typeof context.logs === "number") {
    return `${context.logs} logged`;
  }
  if (badgeKey === "year-one" && typeof context.days === "number") {
    return `${context.days} days`;
  }
  return null;
}
