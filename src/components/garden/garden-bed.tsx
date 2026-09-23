import Link from "next/link";
import type { SkillCard } from "@/lib/growth/aggregate";
import { Plant, stageForTier, STAGE_LABEL } from "@/components/icons";
import { Fireflies } from "@/components/icons/season";
import {
  companionFor,
  REST_LABEL,
  soilFor,
  type GardenConditions,
} from "@/lib/garden/conditions";
import { formatDuration, skillColor } from "@/lib/ui/format";

/**
 * The garden.
 *
 * Every skill is a plant whose stage comes from the highest milestone it has
 * reached. It is the home screen's emotional centre and the thing that turns a
 * list of entries into a garden.
 *
 * The garden answers to time, but never to how often you show up. A skill left
 * alone **rests**: same stage, same size, cooler and still, and it wakes the
 * moment you record something. It is never smaller, never brown, and there is
 * no state in which it looks worse than the day you left it. Season, soil and
 * companions come from the calendar and from totals that only ever rise.
 *
 * The one rule that matters when changing any of this: rest may touch tint and
 * motion, nothing else.
 */
export function GardenBed({
  skills,
  conditions,
}: {
  skills: SkillCard[];
  conditions: GardenConditions;
}) {
  if (skills.length === 0) return <EmptyBed />;

  const { season, light } = conditions;

  return (
    <section
      aria-labelledby="garden-heading"
      className="card relative overflow-hidden p-4"
      data-light={light}
    >
      <h2 id="garden-heading" className="sr-only">
        Your garden
      </h2>

      {/* The light of the hour, laid over the bed rather than any one plant. */}
      <span aria-hidden className="garden-light pointer-events-none absolute inset-0" />

      {light === "night" && <Fireflies />}

      <ul className="relative flex items-end gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {skills.map((skill, index) => {
          const stage = stageForTier(skill.achievedTier);
          const color = skillColor(skill.colorSeed);
          const resting = REST_LABEL[skill.rest];

          return (
            <li key={skill.id} className="shrink-0">
              <Link
                href={`/growth/${skill.slug}`}
                // 80px wide so four skills fit across a phone without the
                // fourth being clipped at the edge.
                className="tappable flex w-20 flex-col items-center px-0.5 py-1 text-center"
                aria-label={`${skill.name}, ${STAGE_LABEL[stage]}${resting ? `, ${resting}` : ""}, ${formatDuration(skill.totalMinutes)} recorded`}
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
                  <Plant
                    stage={stage}
                    color={color}
                    size={72}
                    rest={skill.rest}
                    season={season}
                    soil={soilFor(skill.experienceCount)}
                    companion={companionFor(skill.achievedTier)}
                  />
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
