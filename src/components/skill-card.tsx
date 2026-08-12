import Link from "next/link";
import type { SkillCard as SkillCardData } from "@/lib/growth/aggregate";
import { formatDuration, relativeDay, skillColor, TIER_COLOR } from "@/lib/ui/format";

export function SkillCardList({ skills }: { skills: SkillCardData[] }) {
  return (
    <ul className="grid gap-3">
      {skills.map((skill) => (
        <li key={skill.id}>
          <SkillCard skill={skill} />
        </li>
      ))}
    </ul>
  );
}

export function SkillCard({ skill }: { skill: SkillCardData }) {
  const color = skillColor(skill.colorSeed);

  return (
    <Link
      href={`/growth/${skill.slug}`}
      className="card block p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <span className="truncate font-medium">{skill.name}</span>
        </span>

        <span className="shrink-0 text-right">
          <span className="numeral text-lg">{formatDuration(skill.totalMinutes)}</span>
          <span className="ml-2 text-sm text-muted">
            {skill.experienceCount}{" "}
            {skill.experienceCount === 1 ? "experience" : "experiences"}
          </span>
        </span>
      </div>

      {/* Progress toward the NEXT milestone, measured from the previous one —
          so a skill deep into a long stretch still shows visible movement. */}
      <div className="mt-3">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-line"
          role="img"
          aria-label={
            skill.nextLabel
              ? `${Math.round(skill.fraction * 100)} percent toward ${skill.nextLabel}`
              : "All milestones reached"
          }
        >
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${Math.max(skill.fraction * 100, 2)}%`,
              background: color,
            }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
          {skill.achievedLabel ? (
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: TIER_COLOR[skill.achievedTier ?? "CUSTOM"] }}
            >
              <span aria-hidden>●</span>
              {skill.achievedLabel}
            </span>
          ) : (
            <span className="text-muted">Just getting started</span>
          )}

          <span className="text-muted">
            {skill.nextLabel ? (
              <>
                {skill.nextRemaining} to {skill.nextLabel}
              </>
            ) : (
              "Every milestone reached"
            )}
          </span>
        </div>
      </div>

      {skill.lastActiveAt && (
        <p className="mt-2 text-xs text-muted">
          last {relativeDay(skill.lastActiveAt)}
        </p>
      )}
    </Link>
  );
}
