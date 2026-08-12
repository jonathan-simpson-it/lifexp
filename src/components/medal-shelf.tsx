import Link from "next/link";
import type { BadgeState } from "@/lib/progress/queries";
import { BadgeIcon } from "./badge-icon";

/**
 * The shelf.
 *
 * Unearned badges are shown, not hidden — a locked slot with a hint, or "? ? ?"
 * for the ones meant to be a surprise. Seeing what is still out there is the
 * collection feeling; it is also the only place in the app that hints at what
 * to do next, and it does so without ever implying you are behind.
 */
export function MedalShelf({
  badges,
  compact = false,
}: {
  badges: BadgeState[];
  compact?: boolean;
}) {
  const shown = compact ? badges.slice(0, 8) : badges;
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section aria-labelledby="medals-heading" className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 id="medals-heading" className="text-sm font-medium tracking-wide text-muted uppercase">
          Medals
        </h2>
        <span className="text-sm text-muted">
          <span className="numeral text-ink">{earnedCount}</span> of {badges.length}
        </span>
      </div>

      <ul className={compact ? "mt-3 flex flex-wrap gap-2" : "mt-4 grid gap-3 sm:grid-cols-2"}>
        {shown.map((badge) => (
          <li key={badge.definition.key}>
            <BadgeChip badge={badge} compact={compact} />
          </li>
        ))}
      </ul>

      {compact && badges.length > shown.length && (
        <Link
          href="/medals"
          className="mt-3 inline-block text-sm text-growth underline underline-offset-4"
        >
          See the whole shelf
        </Link>
      )}
    </section>
  );
}

function BadgeChip({ badge, compact }: { badge: BadgeState; compact: boolean }) {
  const { definition, earned } = badge;

  // Unearned and no hint: keep it a genuine surprise.
  const isSecret = !earned && definition.hint === null;
  const title = earned ? definition.title : isSecret ? "? ? ?" : definition.title;
  const subtitle = earned
    ? definition.description
    : isSecret
      ? "Still out there"
      : definition.hint;

  if (compact) {
    return (
      <span
        title={`${title}${subtitle ? ` — ${subtitle}` : ""}`}
        className={[
          "flex size-10 items-center justify-center rounded-full border",
          earned
            ? "border-medal/40 bg-medal-soft text-medal"
            : "border-line border-dashed text-line-strong",
        ].join(" ")}
      >
        {earned ? (
          <BadgeIcon name={definition.icon} />
        ) : (
          <span aria-hidden className="text-xs">
            ?
          </span>
        )}
        <span className="sr-only">
          {title}
          {earned ? " (earned)" : " (not yet earned)"}
        </span>
      </span>
    );
  }

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border p-3",
        earned ? "border-medal/30 bg-medal-soft/50" : "border-line border-dashed",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          earned ? "bg-medal/15 text-medal" : "text-line-strong",
        ].join(" ")}
      >
        {earned ? <BadgeIcon name={definition.icon} /> : <span aria-hidden>?</span>}
      </span>
      <div className="min-w-0">
        <p className={earned ? "font-medium" : "font-medium text-muted"}>{title}</p>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        {earned && badge.context ? (
          <BadgeContext badgeKey={definition.key} context={badge.context} />
        ) : null}
      </div>
    </div>
  );
}

/** Turns the stored context into one plain sentence, where it adds anything. */
function BadgeContext({
  badgeKey,
  context,
}: {
  badgeKey: string;
  context: Record<string, unknown>;
}) {
  let detail: string | null = null;

  if (badgeKey === "the-return" && typeof context.quietDays === "number") {
    detail = `after ${context.quietDays} quiet days`;
  } else if (badgeKey === "deep-diver" && typeof context.minutes === "number") {
    detail = `${Number((context.minutes / 60).toFixed(1))} hours in one go`;
  } else if (badgeKey === "caretaker" && typeof context.logs === "number") {
    detail = `${context.logs} logged`;
  } else if (badgeKey === "year-one" && typeof context.days === "number") {
    detail = `${context.days} days of history`;
  }

  if (!detail) return null;
  return <p className="mt-1 text-xs text-medal">{detail}</p>;
}
