import { requireUserId } from "@/lib/auth";
import { getTimeline } from "@/lib/growth/aggregate";
import { Timeline } from "@/components/timeline";
import { ActivityHeatmap } from "@/components/activity-heatmap";

export const metadata = { title: "Timeline · LifeXP" };

export default async function TimelinePage() {
  const userId = await requireUserId();
  const entries = await getTimeline(userId, { take: 150 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-2xl font-semibold">Timeline</h1>
        <p className="mt-1 text-ink-soft">
          Everything you&rsquo;ve recorded, newest first.
        </p>
      </header>

      {entries.length > 0 && (
        <div className="card p-4">
          <ActivityHeatmap dates={entries.map((e) => e.occurredAt)} weeks={26} />
        </div>
      )}

      <Timeline entries={entries} />
    </div>
  );
}
