"use client";

import { useState, useTransition } from "react";
import { Check, Undo2 } from "lucide-react";
import type { MaintenanceCard } from "@/lib/maintenance/freshness";
import { freshnessFor, type Freshness } from "@/lib/maintenance/freshness";
import { logMaintenance, undoLastMaintenance } from "@/app/actions/maintenance";

/**
 * The freshness gradient.
 *
 * The bar fills from green toward muted grey as time passes the user's own
 * rhythm, and then stops. It never turns red, never overfills, and no copy in
 * this component says late, overdue, missed, or due. "Been a while" is as
 * pointed as the app gets, and that describes the interval, not the person.
 */
/*
  Freshness, in the light register.

  These used to mix --growth (a *text* token) with --muted, which produced a
  near-black bar. Since the bar fills as time passes, the least-recently-done
  item ended up with the darkest, widest, heaviest element on the whole screen,
  on maintenance, the least important section. That is a hierarchy inversion,
  and on something a user has "not done for a while" it reads as an alarm in a
  product that refuses to nag.

  --accent is the correct token: these are fills with no text on them, which is
  exactly what the light green is for. Fading toward --line-strong rather than
  --muted means a long-untouched item settles quietly into its own track.
*/
const TONE_COLOR: Record<string, string> = {
  fresh: "var(--accent)",
  settling: "color-mix(in oklab, var(--accent) 72%, var(--line-strong))",
  aging: "color-mix(in oklab, var(--accent) 40%, var(--line-strong))",
  distant: "var(--line-strong)",
};

const TONE_WORD: Record<string, string> = {
  fresh: "fresh",
  settling: "settling",
  aging: "getting on",
  distant: "been a while",
};

export function MaintenanceList({
  items,
  limit,
}: {
  items: MaintenanceCard[];
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;

  if (shown.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nothing here yet. Maintenance is for the recurring things you&rsquo;d
        rather not hold in your head: bedsheets, plants, the gym.
      </p>
    );
  }

  return (
    <ul className="grid gap-2.5">
      {shown.map((item, index) => (
        <MaintenanceRow
          key={item.id}
          item={item}
          index={index}
        />
      ))}
    </ul>
  );
}

function MaintenanceRow({
  item,
  index,
}: {
  item: MaintenanceCard;
  index: number;
}) {
  const [pending, startTransition] = useTransition();
  const { freshness } = item;

  /*
    Optimistic logging. A tap should read as instant even on a slow round
    trip: the row shows "today" and the bar refills immediately, then the
    server's revalidation arrives with the same truth and the override drops.
    If the action failed, the override also drops and the row returns to what
    the server last said, which is the honest state.
  */
  const [override, setOverride] = useState<Freshness | null>(null);

  const effective = override ?? freshness;
  const color = TONE_COLOR[effective.tone] ?? "var(--muted)";
  const justDone = effective.daysSince === 0;

  function markDone() {
    setOverride(freshnessFor(new Date(), item.intervalDays));
    startTransition(async () => {
      await logMaintenance(item.id);
      setOverride(null);
    });
  }

  function undoDone() {
    setOverride(null);
    startTransition(async () => {
      await undoLastMaintenance(item.id);
    });
  }

  return (
    <li
      className="rise-in card flex items-center gap-3 p-3"
      style={{ ["--rise-delay" as string]: `${Math.min(index * 0.04, 0.16)}s` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{item.name}</span>
          <span className="shrink-0 text-sm text-muted">{effective.label}</span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden bg-line">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${Math.max(effective.fraction * 100, 3)}%`,
              background: color,
            }}
          />
        </div>

        <p className="mt-1.5 text-xs text-muted">
          {TONE_WORD[effective.tone]} · usually every {item.intervalDays}{" "}
          {item.intervalDays === 1 ? "day" : "days"}
        </p>
      </div>

      {justDone ? (
        <button
          type="button"
          disabled={pending}
          onClick={undoDone}
          aria-label={`Undo logging ${item.name}`}
          className="shrink-0 border border-line px-3 py-2 text-sm text-muted transition-colors hover:bg-line/50 disabled:opacity-50"
        >
          <Undo2 size={16} aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={markDone}
          aria-label={`Log ${item.name} as done`}
          className="shrink-0 border border-growth/40 bg-growth-soft px-3 py-2 text-sm text-growth transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Check size={16} aria-hidden />
        </button>
      )}
    </li>
  );
}
