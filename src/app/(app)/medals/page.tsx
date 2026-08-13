import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getAchievedMilestones, getBadgeState } from "@/lib/progress/queries";
import { MedalShelf } from "@/components/medal-shelf";
import { formatDate } from "@/lib/ui/format";
import { Medal } from "@/components/icons";
import type { MilestoneTier } from "@/lib/progress/milestones";

export const metadata = { title: "Medals · LifeXP" };

export default async function MedalsPage() {
  const userId = await requireUserId();
  const [badges, milestones] = await Promise.all([
    getBadgeState(userId),
    getAchievedMilestones(userId, 40),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-2xl font-semibold">Medals</h1>
        <p className="mt-1 text-ink-soft">
          Two kinds: markers reached inside a single skill, and badges that cut
          across your whole life.
        </p>
      </header>

      <section aria-labelledby="milestones-heading">
        <h2
          id="milestones-heading"
          className="text-sm font-medium tracking-wide text-muted uppercase"
        >
          Skill milestones
        </h2>

        {milestones.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            None yet. They arrive on their own as the hours accumulate. There is
            nothing to claim.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {milestones.map((milestone) => (
              <li key={milestone.id} className="card flex items-center gap-3 p-3">
                <span aria-hidden className="shrink-0">
                  <Medal tier={milestone.tier as MilestoneTier} size={40} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{milestone.label}</p>
                  <Link
                    href={`/growth/${milestone.skill.slug}`}
                    className="text-sm text-muted hover:text-ink"
                  >
                    {milestone.skill.name}
                  </Link>
                </div>
                {milestone.achievedAt && (
                  <span className="shrink-0 text-xs text-muted">
                    {formatDate(milestone.achievedAt)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <MedalShelf badges={badges} />
    </div>
  );
}
