import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getGrowthOverview } from "@/lib/growth/aggregate";
import { getMaintenanceCards } from "@/lib/maintenance/queries";
import { getBadgeState } from "@/lib/progress/queries";
import { SkillCardList } from "@/components/skill-card";
import { MaintenanceList } from "@/components/maintenance-list";
import { MedalShelf } from "@/components/medal-shelf";
import { ChatBar } from "@/components/chat/chat-bar";
import { formatDuration } from "@/lib/ui/format";

export default async function DashboardPage() {
  const userId = await requireUserId();

  const [growth, maintenance, badges] = await Promise.all([
    getGrowthOverview(userId),
    getMaintenanceCards(userId),
    getBadgeState(userId),
  ]);

  const isEmpty = growth.skills.length === 0 && maintenance.length === 0;

  return (
    <>
      <div className="space-y-7">
        <WeekStrip
          skillCount={growth.week.skillCount}
          minutes={growth.week.minutes}
          experienceCount={growth.week.experienceCount}
          totalMinutes={growth.totalMinutes}
        />

        {isEmpty ? (
          <FirstRun />
        ) : (
          <>
            {badges.some((b) => b.earned) && (
              <MedalShelf badges={badges} compact />
            )}

            <section aria-labelledby="growth-heading">
              <div className="flex items-baseline justify-between">
                <h2
                  id="growth-heading"
                  className="text-sm font-medium tracking-wide text-muted uppercase"
                >
                  Growth
                </h2>
                <Link href="/growth" className="text-sm text-muted hover:text-ink">
                  All skills
                </Link>
              </div>
              <div className="mt-3">
                {growth.skills.length > 0 ? (
                  <SkillCardList skills={growth.skills.slice(0, 4)} />
                ) : (
                  <p className="text-sm text-muted">
                    No skills yet. Record something below and one will appear.
                  </p>
                )}
              </div>
            </section>

            <section aria-labelledby="maintenance-heading">
              <div className="flex items-baseline justify-between">
                <h2
                  id="maintenance-heading"
                  className="text-sm font-medium tracking-wide text-muted uppercase"
                >
                  Maintenance
                </h2>
                <Link
                  href="/maintenance"
                  className="text-sm text-muted hover:text-ink"
                >
                  All items
                </Link>
              </div>
              <div className="mt-3">
                <MaintenanceList items={maintenance} limit={4} />
              </div>
            </section>
          </>
        )}
      </div>

      <ChatBar
        skills={growth.skills.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}

/**
 * Answers the one question the homepage exists to answer: how has my life
 * grown? Deliberately not "7 tasks completed".
 */
function WeekStrip({
  skillCount,
  minutes,
  experienceCount,
  totalMinutes,
}: {
  skillCount: number;
  minutes: number;
  experienceCount: number;
  totalMinutes: number;
}) {
  const nothingThisWeek = experienceCount === 0;

  return (
    <section aria-labelledby="week-heading" className="pt-1">
      <h1 id="week-heading" className="display text-2xl font-semibold">
        This week
      </h1>

      {nothingThisWeek ? (
        // A quiet week is not a failure state, so it does not get an empty
        // shell with zeroes in it — it gets the long view instead.
        <p className="mt-2 text-ink-soft">
          Nothing recorded yet this week. Your{" "}
          <span className="numeral">{formatDuration(totalMinutes)}</span> so far
          hasn&rsquo;t gone anywhere.
        </p>
      ) : (
        <p className="mt-2 text-lg text-ink-soft">
          You explored <Stat>{skillCount}</Stat>{" "}
          {skillCount === 1 ? "skill" : "skills"}, spent{" "}
          <Stat>{formatDuration(minutes)}</Stat>, and recorded{" "}
          <Stat>{experienceCount}</Stat>{" "}
          {experienceCount === 1 ? "experience" : "experiences"}.
        </p>
      )}
    </section>
  );
}

function Stat({ children }: { children: React.ReactNode }) {
  return <span className="numeral text-ink">{children}</span>;
}

function FirstRun() {
  return (
    <section className="card p-5">
      <h2 className="display text-xl font-semibold">Start anywhere</h2>
      <p className="mt-2 text-ink-soft">
        Tell LifeXP something you did — today, last week, whenever. It doesn&rsquo;t
        need to be impressive, and you don&rsquo;t need to set up anything first.
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-muted">
        <li>&ldquo;Went to Japanese class for 90 minutes today&rdquo;</li>
        <li>&ldquo;Practised piano for half an hour yesterday&rdquo;</li>
        <li>&ldquo;Read 40 pages before bed&rdquo;</li>
      </ul>
      <p className="mt-4 text-sm text-muted">
        Or add a{" "}
        <Link href="/maintenance" className="text-growth underline underline-offset-4">
          maintenance item
        </Link>{" "}
        if you&rsquo;d rather start with the recurring things.
      </p>
    </section>
  );
}
