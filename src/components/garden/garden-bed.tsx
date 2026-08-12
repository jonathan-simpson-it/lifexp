import Link from "next/link";
import type { SkillCard } from "@/lib/growth/aggregate";
import { Plant, stageForTier, STAGE_LABEL } from "@/components/icons";
import { formatDuration, skillColor } from "@/lib/ui/format";

/**
 * The garden.
 *
 * Every skill is a plant whose stage comes from the highest milestone it has
 * reached. It is the home screen's emotional centre and the thing that makes
 * "life is an accumulation of experiences" literal rather than a tagline.
 *
 * There is no wilted stage and no time input to this component — only
 * `achievedTier`. A skill you have not touched since spring looks exactly as
 * grown as the day you left it. That is the anti-streak rule made visual, and
 * it is why this cannot take a `lastActiveAt`.
 */
export function GardenBed({ skills }: { skills: SkillCard[] }) {
  if (skills.length === 0) return <EmptyBed />;

  return (
    <section aria-labelledby="garden-heading" className="card overflow-hidden p-4">
      <h2 id="garden-heading" className="sr-only">
        Your garden
      </h2>

      <ul className="flex items-end gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {skills.map((skill, index) => {
          const stage = stageForTier(skill.achievedTier);
          const color = skillColor(skill.colorSeed);

          return (
            <li key={skill.id} className="shrink-0">
              <Link
                href={`/growth/${skill.slug}`}
                // 80px wide so four skills fit across a phone without the
                // fourth being clipped at the edge.
                className="tappable flex w-20 flex-col items-center rounded-xl px-0.5 py-1 text-center"
                aria-label={`${skill.name}, ${STAGE_LABEL[stage]}, ${formatDuration(skill.totalMinutes)} recorded`}
              >
                <span
                  className="grow-in block"
                  style={{
                    // Staggered so a row sways like planting rather than like
                    // one sprite repeated...
                    ["--sway-delay" as string]: `${index * 0.4}s`,
                    // ...and rises in sequence, so the garden reads as growing
                    // rather than as a row appearing at once.
                    ["--rise-delay" as string]: `${index * 0.06}s`,
                  }}
                >
                  <Plant stage={stage} color={color} size={72} />
                </span>
                <span className="mt-0.5 w-full truncate text-caption font-medium">
                  {skill.name}
                </span>
                <span className="numeral text-caption text-muted">
                  {formatDuration(skill.totalMinutes)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyBed() {
  return (
    <section className="card p-5 text-center">
      <div className="mx-auto opacity-60">
        <Plant stage="seed" color="var(--growth)" size={72} swaying={false} />
      </div>
      <h2 className="display mt-2 text-title">Empty soil</h2>
      <p className="voice mt-1">
        Record anything you did and the first thing will start growing here.
      </p>
    </section>
  );
}
