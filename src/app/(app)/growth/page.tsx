import { requireUserId } from "@/lib/auth";
import { getGrowthOverview } from "@/lib/growth/aggregate";
import { SkillCardList } from "@/components/skill-card";
import { createSkill } from "@/app/actions/experiences";
import { formatDuration } from "@/lib/ui/format";

export const metadata = { title: "Growth · LifeXP" };

export default async function GrowthPage() {
  const userId = await requireUserId();
  const growth = await getGrowthOverview(userId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-2xl font-semibold">Growth</h1>
        <p className="mt-1 text-ink-soft">
          <span className="numeral">{formatDuration(growth.totalMinutes)}</span>{" "}
          across{" "}
          <span className="numeral">{growth.totalExperiences}</span>{" "}
          {growth.totalExperiences === 1 ? "experience" : "experiences"}.
        </p>
      </header>

      {growth.skills.length > 0 ? (
        <SkillCardList skills={growth.skills} />
      ) : (
        <p className="text-sm text-muted">
          No skills yet. Add one below, or just describe something you did in the
          bar at the bottom and a skill will be created for you.
        </p>
      )}

      <section aria-labelledby="add-skill" className="card p-4">
        <h2 id="add-skill" className="font-medium">
          Add a skill
        </h2>
        <p className="mt-1 text-sm text-muted">
          LifeXP will fit a milestone ladder to it automatically — languages,
          music, fitness and reading each get their own.
        </p>
        <form action={createSkill} className="mt-3 flex gap-2">
          <label htmlFor="skill-name" className="sr-only">
            Skill name
          </label>
          <input
            id="skill-name"
            name="name"
            required
            placeholder="Japanese, Piano, Climbing…"
            className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
