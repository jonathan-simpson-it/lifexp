import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getGrowthOverview } from "@/lib/growth/aggregate";
import { getMaintenanceCards } from "@/lib/maintenance/queries";
import {
  getBadgeState,
  getRecapWindow,
  getRecentBadges,
} from "@/lib/progress/queries";
import { SkillCardList } from "@/components/skill-card";
import { MaintenanceList } from "@/components/maintenance-list";
import { MedalShelf } from "@/components/medal-shelf";
import { GardenBed } from "@/components/garden/garden-bed";
import { WeeklyRecap } from "@/components/recap/weekly-recap";
import { formatDuration } from "@/lib/ui/format";

export const metadata = { title: "Today · LifeXP" };

export default async function TodayPage() {
  const userId = await requireUserId();

  const [growth, maintenance, badges, recentBadges] = await Promise.all([
    getGrowthOverview(userId),
    getMaintenanceCards(userId),
    getBadgeState(userId),
    getRecentBadges(userId),
  ]);

  // Clock read lives in lib, not here: calling Date.now() while rendering is an
  // impure render, and the recap's client half should only have to answer
  // "has this week been dismissed?".
  const recap = getRecapWindow();

  const isEmpty = growth.skills.length === 0 && maintenance.length === 0;

  return (
    <div className="space-y-6">
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
          <GardenBed skills={growth.skills} />

          <WeeklyRecap
            week={growth.week}
            // Flattened to plain data: badge definitions carry a predicate
            // function, which cannot cross into a client component.
            skills={growth.skills.map((s) => ({
              name: s.name,
              totalMinutes: s.totalMinutes,
            }))}
            recentBadges={recentBadges}
            isRecapDay={recap.isRecapDay}
            weekStamp={recap.weekStamp}
          />

          <Section
            title="Growth"
            href="/growth"
            linkLabel="All skills"
            id="growth-heading"
          >
            {growth.skills.length > 0 ? (
              <SkillCardList skills={growth.skills.slice(0, 4)} />
            ) : (
              <p className="text-sm text-muted">
                No skills yet. Tap the + button and one will appear.
              </p>
            )}
          </Section>

          <Section
            title="Maintenance"
            href="/maintenance"
            linkLabel="All items"
            id="maintenance-heading"
          >
            <MaintenanceList items={maintenance} limit={4} />
          </Section>

          {badges.some((b) => b.earned) && <MedalShelf badges={badges} compact />}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  href,
  linkLabel,
  id,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-baseline justify-between">
        <h2 id={id} className="text-eyebrow text-muted uppercase">
          {title}
        </h2>
        <Link href={href} className="text-caption text-muted hover:text-ink">
          {linkLabel}
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Answers the one question the homepage exists to answer: how has my life
 * grown? Deliberately not "7 tasks completed".
 *
 * Hierarchy is the whole point of this block. One figure is the answer and gets
 * hero treatment; the label above and the breakdown below are support. Before
 * this, the same three numbers sat inline in a sentence at equal weight, which
 * meant the screen had to be *read* to be understood rather than glanced at.
 * This is a screen people open for four seconds.
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
      <h1 id="week-heading" className="text-eyebrow text-muted uppercase">
        This week
      </h1>

      {nothingThisWeek ? (
        // A quiet week is not a failure state, so it does not get an empty
        // shell of zeroes, it gets the long view, in the product's voice.
        <p className="voice mt-1.5">
          Nothing recorded yet this week. Your{" "}
          <span className="numeral">{formatDuration(totalMinutes)}</span> so far
          hasn&rsquo;t gone anywhere.
        </p>
      ) : (
        <>
          <p className="numeral rise-in mt-1 text-hero">
            {formatDuration(minutes)}
          </p>
          <p className="mt-0.5 text-caption text-muted">
            across <Stat>{skillCount}</Stat>{" "}
            {skillCount === 1 ? "skill" : "skills"} ·{" "}
            <Stat>{experienceCount}</Stat>{" "}
            {experienceCount === 1 ? "entry" : "entries"}
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ children }: { children: React.ReactNode }) {
  return <span className="numeral text-ink-soft">{children}</span>;
}

function FirstRun() {
  return (
    <section className="card p-5">
      <h2 className="display text-title">Start anywhere</h2>
      <p className="mt-2 text-ink-soft">
        Tap the <span className="font-semibold text-accent-deep">+</span> button
        and tell LifeXP something you did: today, last week, whenever. It
        doesn&rsquo;t need to be impressive, and there&rsquo;s nothing to set up
        first.
      </p>
      <ul className="mt-4 space-y-1.5 text-caption text-muted">
        <li>&ldquo;Went to Japanese class for 90 minutes today&rdquo;</li>
        <li>&ldquo;Practised piano for half an hour yesterday&rdquo;</li>
        <li>&ldquo;Read 40 pages before bed&rdquo;</li>
      </ul>
    </section>
  );
}
