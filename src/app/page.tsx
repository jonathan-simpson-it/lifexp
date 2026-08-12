import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { Logo, Plant, Medal } from "@/components/icons";
import { formatDuration } from "@/lib/ui/format";

export const metadata: Metadata = {
  title: "LifeXP — you've done more than you remember",
  description:
    "LifeXP keeps the evidence of everything you're slowly getting better at, so the progress is visible while you're still in the middle of it. No streaks, ever.",
  openGraph: {
    title: "LifeXP — you've done more than you remember",
    description:
      "Track the things with feedback cycles measured in years. No streaks, no guilt, a slow month still counts.",
    type: "website",
  },
};

export default async function LandingPage() {
  // Signed-in visitors have no use for the pitch. Verified rather than trusted
  // from the token, so a stale session shows the landing page instead of
  // bouncing into an app that will redirect straight back.
  const userId = await currentUserId();
  if (userId) redirect("/today");

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="tappable text-sm text-muted hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/signin"
            className="tappable rounded-full bg-accent-deep px-4 py-2 text-sm font-semibold text-white shadow-accent"
          >
            Start free
          </Link>
        </div>
      </header>

      <Hero />
      <HowItWorks />
      <ThePromise />
      <MedalPreview />
      <FinalCta />

      <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">
        <Logo size={22} />
        <p className="mt-3">
          Life is not a checklist. It is an accumulation of experiences.
        </p>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-6 pb-14 md:grid md:grid-cols-2 md:items-center md:gap-10 md:pt-16">
      <div>
        <h1 className="display text-4xl leading-[1.08] font-semibold md:text-6xl">
          You&rsquo;ve done more
          <br />
          than you remember.
        </h1>

        <p className="mt-5 text-lg text-ink-soft">
          The things most worth doing pay off over months or years — a language,
          an instrument, a body, a mind. Progress that slow is invisible, so it
          feels like nothing is happening. LifeXP keeps the evidence.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href="/signin"
            className="tappable rounded-full bg-accent-deep px-7 py-3.5 text-base font-semibold text-white shadow-accent"
          >
            Start free
          </Link>
          {/* The differentiator, second thing read on the page. */}
          <span className="text-sm font-semibold text-growth">
            No streaks. Ever.
          </span>
        </div>
      </div>

      {/* Built from the real components with sample data, so the shot can never
          drift out of date with the product. */}
      <div className="mt-12 md:mt-0">
        <HeroArt />
      </div>
    </section>
  );
}

const SAMPLE = [
  { name: "Japanese", minutes: 19_800, stage: "grand" as const, hue: 24 },
  { name: "Piano", minutes: 2_070, stage: "sapling" as const, hue: 190 },
  { name: "Running", minutes: 936, stage: "sprout" as const, hue: 96 },
];

function HeroArt() {
  return (
    <div className="card mx-auto max-w-sm p-4">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">
        This week
      </p>
      <p className="display mt-1 text-xl font-semibold">
        3 skills · <span className="numeral">18h</span> · 5 experiences
      </p>

      <ul className="mt-4 flex items-end justify-around">
        {SAMPLE.map((skill, i) => (
          <li key={skill.name} className="flex w-24 flex-col items-center text-center">
            <span style={{ ["--sway-delay" as string]: `${i * 0.4}s` }}>
              <Plant
                stage={skill.stage}
                color={`oklch(0.58 0.09 ${skill.hue})`}
                size={76}
              />
            </span>
            <span className="mt-0.5 truncate text-xs font-medium">{skill.name}</span>
            <span className="numeral text-xs text-muted">
              {formatDuration(skill.minutes)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl border border-line bg-paper p-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Japanese</span>
          <span className="numeral">330h</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full w-[82%] rounded-full bg-growth" />
        </div>
        <p className="mt-1.5 text-xs text-muted">70h to Elementary</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Say what you did",
      body: "“Went to Japanese class for 90 minutes.” No forms, no timers, no starting a session before you begin.",
    },
    {
      title: "Confirm it",
      body: "LifeXP proposes the skill, the duration and the date. You check it and save. Nothing is ever recorded on your behalf.",
    },
    {
      title: "Watch it accumulate",
      body: "Hours add up, plants grow, medals arrive unannounced. The proof builds itself while you get on with it.",
    },
  ];

  return (
    <section className="border-y border-line bg-paper-raised">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="display text-2xl font-semibold md:text-3xl">
          Three seconds a day
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-deep">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ThePromise() {
  const promises = [
    {
      title: "No streaks",
      body: "There is no counter to break, because there is no counter. Miss three weeks and nothing is lost — one badge exists purely to welcome you back.",
    },
    {
      title: "No guilt",
      body: "Nothing is ever overdue, late or failed. Maintenance items fade gently; they never turn red and never accuse you of anything.",
    },
    {
      title: "A slow month still counts",
      body: "There is a medal for a month where you managed almost nothing — because showing up at all in a hard month is the part that matters.",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <h2 className="display text-2xl font-semibold md:text-3xl">
        Built to be kind to you
      </h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Most trackers motivate with loss — a streak you mustn&rsquo;t break, a
        chain you mustn&rsquo;t drop. That works right up until life happens, and
        then it makes you feel like a failure and you quit. LifeXP has none of it.
      </p>

      <ul className="mt-8 grid gap-5 md:grid-cols-3">
        {promises.map((promise) => (
          <li key={promise.title} className="card p-5">
            <h3 className="font-semibold text-growth">{promise.title}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{promise.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MedalPreview() {
  return (
    <section className="border-y border-line bg-paper-raised">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="display text-2xl font-semibold md:text-3xl">
          Rewards you can&rsquo;t lose
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Milestones arrive as you accumulate real hours, and once earned they
          stay earned. Some are visible from the start; others you find by
          living.
        </p>

        <ul className="mt-8 flex flex-wrap items-center gap-5">
          {(["BRONZE", "SILVER", "GOLD", "MASTERY"] as const).map((tier) => (
            <li key={tier} className="text-center">
              <Medal tier={tier} size={56} />
              <p className="mt-1 text-xs text-muted capitalize">
                {tier.toLowerCase()}
              </p>
            </li>
          ))}
          {(["FIRST_STEPS", "FOUNDATION"] as const).map((tier) => (
            <li key={tier} className="text-center opacity-70">
              <Medal tier={tier} size={56} earned={false} />
              <p className="mt-1 text-xs text-muted">? ? ?</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 text-center">
      <h2 className="display text-3xl font-semibold md:text-4xl">
        Start with whatever you did today.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-ink-soft">
        Even if it was small. Especially if it was small.
      </p>
      <Link
        href="/signin"
        className="tappable mt-7 inline-block rounded-full bg-accent-deep px-8 py-4 text-base font-semibold text-white shadow-accent"
      >
        Start free
      </Link>
      <p className="mt-3 text-sm text-muted">Takes about a minute.</p>
    </section>
  );
}
