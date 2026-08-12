import Link from "next/link";
import type { SkillCard as SkillCardData } from "@/lib/growth/aggregate";
import { formatDuration, relativeDay, skillColor, TIER_COLOR } from "@/lib/ui/format";
import { SkillIcon } from "@/components/icons";

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

/**
 * The goal-gradient card.
 *
 * The distance to the next milestone is the single strongest habit mechanic in
 * the product — people accelerate as a goal gets closer — so it is set larger
 * than the running total and in the action colour. The total is evidence; the
 * remaining distance is the pull.
 */
export function SkillCard({ skill }: { skill: SkillCardData }) {
  const color = skillColor(skill.colorSeed);

  return (
    <Link
      href={`/growth/${skill.slug}`}
      className="tappable card block p-4 transition-shadow hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: skillColor(skill.colorSeed, { soft: true }), color }}
          >
            <SkillIcon templateKey={skill.templateKey} size={19} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{skill.name}</span>
            <span className="numeral block text-sm text-muted">
              {formatDuration(skill.totalMinutes)} ·{" "}
              {skill.experienceCount}{" "}
              {skill.experienceCount === 1 ? "entry" : "entries"}
            </span>
          </span>
        </span>

        {skill.achievedLabel && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              color: TIER_COLOR[skill.achievedTier ?? "CUSTOM"],
              background: "var(--paper)",
            }}
          >
            {skill.achievedLabel}
          </span>
        )}
      </div>

      <div className="mt-3.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-line"
          role="img"
          aria-label={
            skill.nextLabel
              ? `${Math.round(skill.fraction * 100)} percent toward ${skill.nextLabel}`
              : "All milestones reached"
          }
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-[var(--spring)]"
            style={{
              width: `${Math.max(skill.fraction * 100, 3)}%`,
              background: color,
            }}
          />
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-3">
          {skill.nextLabel ? (
            <p className="text-sm">
              <span className="numeral font-semibold text-accent-deep">
                {skill.nextRemaining}
              </span>{" "}
              <span className="text-muted">to {skill.nextLabel}</span>
            </p>
          ) : (
            <p className="text-sm text-muted">Every milestone reached</p>
          )}

          {skill.lastActiveAt && (
            <span className="shrink-0 text-xs text-muted">
              {relativeDay(skill.lastActiveAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
