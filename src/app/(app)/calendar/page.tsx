import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getMonth, getTimeline } from "@/lib/growth/aggregate";
import { MonthGrid } from "@/components/calendar/month-grid";
import { ActivityHeatmap } from "@/components/activity-heatmap";

export const metadata = { title: "Calendar · LifeXP" };

// Next 16: searchParams is a Promise.
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}) {
  const params = await searchParams;
  const userId = await requireUserId();

  const now = new Date();
  const year = Number(params.y) || now.getUTCFullYear();
  const month = Number(params.m) || now.getUTCMonth() + 1;
  const view = params.view === "year" ? "year" : "month";

  const [data, entries] = await Promise.all([
    getMonth(userId, year, month),
    view === "year" ? getTimeline(userId, { take: 1000 }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="display text-2xl font-semibold">Calendar</h1>

        <div
          role="group"
          aria-label="View"
          className="flex rounded-full border border-line p-0.5 text-sm"
        >
          <Link
            href={`/calendar?y=${year}&m=${month}`}
            aria-current={view === "month" ? "true" : undefined}
            className={[
              "tappable rounded-full px-3 py-1",
              view === "month" ? "bg-ink text-paper" : "text-muted",
            ].join(" ")}
          >
            Month
          </Link>
          <Link
            href={`/calendar?y=${year}&m=${month}&view=year`}
            aria-current={view === "year" ? "true" : undefined}
            className={[
              "tappable rounded-full px-3 py-1",
              view === "year" ? "bg-ink text-paper" : "text-muted",
            ].join(" ")}
          >
            Year
          </Link>
        </div>
      </header>

      {view === "month" ? (
        <div className="card p-4">
          <MonthGrid data={data} />
        </div>
      ) : (
        <div className="card p-4">
          <ActivityHeatmap
            dates={entries.map((e) => e.occurredAt)}
            weeks={52}
          />
          <p className="mt-3 text-sm text-muted">
            A year of evidence. Gaps are just time. There is nothing here to
            break.
          </p>
        </div>
      )}
    </div>
  );
}
