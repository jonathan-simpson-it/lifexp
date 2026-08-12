import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getSkillDetail, getTimeline } from "@/lib/growth/aggregate";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { Timeline } from "@/components/timeline";
import { formatDuration, skillColor, TIER_COLOR } from "@/lib/ui/format";
import { formatHours } from "@/lib/progress/milestones";

// Next 16: params is a Promise and must be awaited.
export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userId = await requireUserId();

  const detail = await getSkillDetail(userId, slug);
  if (!detail) notFound();

  const { skill, milestones, progress, next, fraction, remainingLabel } = detail;
  const color = skillColor(skill.colorSeed);
  const entries = await getTimeline(userId, { skillId: skill.id, take: 60 });

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ background: color }}
          />
          <h1 className="display text-2xl font-semibold">{skill.name}</h1>
        </div>

        {/* Evidence, stated plainly. Not points, not a level. */}
        <p className="mt-2 text-lg text-ink-soft">
          <span className="numeral text-ink">
            {formatDuration(progress.totalMinutes)}
          </span>{" "}
          ·{" "}
          <span className="numeral text-ink">{progress.experienceCount}</span>{" "}
          {progress.experienceCount === 1 ? "experience" : "experiences"}
          {skill.secondaryUnit ? (
            <span className="text-muted"> · counted in {skill.secondaryUnit} too</span>
          ) : null}
        </p>

        {next && (
          <p className="mt-1 text-sm text-muted">
            {remainingLabel} to {next.label}
          </p>
        )}
      </header>

      <div className="card p-4">
        <ActivityHeatmap dates={detail.activity} weeks={26} color={color} />
      </div>

      <section aria-labelledby="ladder-heading">
        <h2
          id="ladder-heading"
          className="text-sm font-medium tracking-wide text-muted uppercase"
        >
          Milestones
        </h2>

        <ol className="mt-3 space-y-1.5">
          {milestones.map((milestone) => {
            const achieved = Boolean(milestone.achievedAt);
            const isNext = next?.id === milestone.id;

            const target =
              milestone.thresholdMinutes !== null
                ? formatHours(milestone.thresholdMinutes)
                : milestone.thresholdCount !== null
                  ? `${milestone.thresholdCount} sessions`
                  : "your call";

            return (
              <li
                key={milestone.id}
                className={[
                  "card flex items-center gap-3 p-3",
                  achieved ? "" : "opacity-70",
                  isNext ? "border-line-strong" : "",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: achieved
                      ? TIER_COLOR[milestone.tier]
                      : "var(--line-strong)",
                  }}
                />
                <span className="min-w-0 flex-1 truncate">{milestone.label}</span>
                <span className="numeral shrink-0 text-sm text-muted">{target}</span>
              </li>
            );
          })}
        </ol>

        {next && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(fraction * 100, 2)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="entries-heading">
        <h2
          id="entries-heading"
          className="text-sm font-medium tracking-wide text-muted uppercase"
        >
          Experiences
        </h2>
        <div className="mt-3">
          <Timeline entries={entries} />
        </div>
      </section>
    </div>
  );
}
