import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getAchievedMilestones, getBadgeState } from "@/lib/progress/queries";
import { MedalShelf } from "@/components/medal-shelf";
import { formatDate } from "@/lib/ui/format";
import { MilestoneTile } from "@/components/medal-tile";
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
        <h1 className="display text-title">Medals</h1>
        <p className="mt-1 text-ink-soft">
          Two kinds: markers reached inside a single skill, and badges that cut
          across your whole life.
        </p>
      </header>

      <section aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="text-eyebrow text-muted uppercase">
          Skill milestones
        </h2>

        {milestones.length === 0 ? (
          <p className="voice mt-2">
            None yet. They arrive on their own as the hours accumulate. There is
            nothing to claim.
          </p>
        ) : (
          // The same grid and the same tile as the badges below, so the two
          // kinds of medal finally read as one collection.
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {milestones.map((milestone) => (
              <li key={milestone.id}>
                <Link
                  href={`/growth/${milestone.skill.slug}`}
                  className="tappable block h-full"
                >
                  <MilestoneTile
                    tier={milestone.tier as MilestoneTier}
                    label={milestone.label}
                    skillName={milestone.skill.name}
                    achievedAt={
                      milestone.achievedAt
                        ? formatDate(milestone.achievedAt)
                        : null
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MedalShelf badges={badges} />
    </div>
  );
}
