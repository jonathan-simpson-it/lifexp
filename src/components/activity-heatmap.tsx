import { bucketByDay } from "@/lib/growth/summarise";

/**
 * Contribution heatmap.
 *
 * The GitHub reference, with one deliberate difference: empty days are drawn in
 * the same neutral as the page, not as a gap in a chain. There is nothing here
 * to break, so a fortnight of blanks reads as a fortnight of life rather than
 * as a failure.
 */
export function ActivityHeatmap({
  dates,
  weeks = 26,
  color = "var(--growth)",
}: {
  dates: Date[];
  weeks?: number;
  color?: string;
}) {
  const days = weeks * 7;
  const buckets = bucketByDay(dates, days);
  const busiest = Math.max(1, ...buckets.map((b) => b.count));

  // Column-major so CSS grid lays it out in weeks like the original.
  const columns: { date: Date; count: number }[][] = [];
  for (let i = 0; i < buckets.length; i += 7) {
    columns.push(buckets.slice(i, i + 7));
  }

  const active = buckets.filter((b) => b.count > 0).length;

  return (
    <figure className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-[3px]">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const intensity = day.count === 0 ? 0 : 0.25 + (day.count / busiest) * 0.75;
              return (
                <span
                  key={day.date.toISOString()}
                  title={`${day.date.toISOString().slice(0, 10)}: ${
                    day.count === 0
                      ? "nothing recorded"
                      : `${day.count} ${day.count === 1 ? "experience" : "experiences"}`
                  }`}
                  className="size-[9px]"
                  style={{
                    background:
                      day.count === 0
                        ? "var(--line)"
                        : `color-mix(in oklab, ${color} ${Math.round(intensity * 100)}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        <span className="numeral">{active}</span> active{" "}
        {active === 1 ? "day" : "days"} in the last {weeks} weeks
      </figcaption>
    </figure>
  );
}
