import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";
import { Logo, LogoCream, Plant } from "@/components/icons";
import { gardenConditionsFor } from "@/lib/garden/conditions";
import { skillColor } from "@/lib/ui/format";
import { SiteHeader } from "@/components/landing/site-header";
import { GardenDemo } from "@/components/landing/garden-demo";
import { PhoneDemo } from "@/components/landing/phone-demo";
import { MedalShowcase } from "@/components/landing/medal-showcase";
import { SkillLadders } from "@/components/landing/skill-ladders";
import { Reveal } from "@/components/landing/reveal";

export const metadata: Metadata = {
  title: "LifeXP: you've done more than you remember",
  description:
    "LifeXP keeps the evidence of everything you're slowly getting better at, so the progress is visible while you're still in the middle of it. No streaks, ever.",
  openGraph: {
    title: "LifeXP, you've done more than you remember",
    description:
      "Track the things that pay off over months or years. No streaks, no guilt, and a slow month still counts.",
    type: "website",
  },
};

export default async function LandingPage() {
  // Signed-in visitors have no use for the pitch. Verified rather than trusted
  // from the token, so a stale session shows the landing page instead of
  // bouncing into an app that will redirect straight back. The demo deployment
  // keeps the landing as its front door; the app is one click away.
  const userId = await currentUserId();
  if (userId && !isDemoMode()) redirect("/today");

  // One clock read, on the server: the garden on this page matches the app's.
  const { season, light } = gardenConditionsFor();

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <Hero season={season} light={light} />
      <Problem />
      <Features />
      <HowItWorks season={season} />
      <ForYou />
      <GardenStrip season={season} />
      <MedalSection />
      <Faq />
      <FinalCta />

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo size={26} />
            <p className="mt-3 max-w-xs text-sm text-muted">
              A record of what you have done, not a list of what you
              haven&rsquo;t.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <a href="#problem" className="text-muted hover:text-ink">The problem</a>
            <a href="#how" className="text-muted hover:text-ink">How it works</a>
            <a href="#foryou" className="text-muted hover:text-ink">For you</a>
            <a href="#medals" className="text-muted hover:text-ink">Medals</a>
            <a href="#faq" className="text-muted hover:text-ink">FAQ</a>
            <Link href="/signin" className="text-muted hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Hero({
  season,
  light,
}: {
  season: "spring" | "summer" | "autumn" | "winter";
  light: "dawn" | "day" | "dusk" | "night";
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-28 pb-20 md:grid md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-16 md:pt-36">
      <div className="rise-in">
        <p className="inline-flex items-center gap-2 bg-accent-soft px-3 py-1 text-caption font-medium text-accent-deep">
          Free during early access
        </p>

        <h1 className="display mt-4 text-5xl leading-[1.04] font-semibold text-balance sm:text-6xl lg:text-7xl">
          You&rsquo;ve done more than you remember.
        </h1>

        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          The things most worth doing pay off over months or years: a language,
          an instrument, a sport, a craft. Progress that slow is easy to miss,
          so it can feel like nothing is happening. LifeXP keeps the evidence.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/signin"
            className="tappable bg-accent-deep px-7 py-3.5 text-base font-semibold text-white shadow-accent"
          >
            Open the demo
          </Link>
          <a
            href="#problem"
            className="tappable text-sm font-semibold text-growth hover:text-accent-deep"
          >
            Why it exists &darr;
          </a>
          <span className="text-sm font-semibold text-growth">No streaks. Ever.</span>
        </div>
      </div>

      {/* The product itself, small enough to hold. Rise arrives after the
          headline so the eye lands on the words first. */}
      <div
        className="rise-in mt-12 md:mt-0"
        style={{ ["--rise-delay" as string]: "0.25s" }}
      >
        <GardenDemo season={season} light={light} />
      </div>
    </section>
  );
}

function Problem() {
  const problems = [
    {
      title: "Streak apps punish the gap",
      body: "They count consecutive days, so the counter decides when you failed. Miss a week and the number resets to zero, taking your history with it.",
    },
    {
      title: "To-do lists flatten life into tasks",
      body: "They tick off what is finishable today, which quietly deletes the things that take months or years to matter.",
    },
    {
      title: "Dashboards want weekly growth",
      body: "A slow month reads as a decline, so the honest record of a hard stretch looks like failure.",
    },
  ];

  return (
    <section id="problem" className="border-y border-line bg-paper-raised">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <p className="text-eyebrow text-muted uppercase">The problem</p>
          <h2 className="display mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">
            Everything else is built for a race.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {problems.map((problem, i) => (
            <Reveal key={problem.title} delay={i * 0.12}>
              <div className="border-t-2 border-line-strong pt-4">
                <h3 className="text-lg font-semibold">{problem.title}</h3>
                <p className="mt-2 text-ink-soft">{problem.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="display mt-14 text-2xl font-semibold sm:text-3xl">
            LifeXP is for everything that pays off over{" "}
            <em className="voice not-italic">months or years.</em>
          </p>
        </Reveal>

        {/* The quiet week, drawn rather than described: days that hold nothing
            are still days on the record. */}
        <Reveal delay={0.1}>
          <div className="card mt-10 max-w-md p-4">
            <p className="text-eyebrow text-muted uppercase">A quiet week</p>
            <ul className="mt-3 flex items-center gap-1.5">
              {[1, 1, 0, 0, 1, 0, 1].map((done, i) => (
                <li
                  key={i}
                  className="pop-in size-3 rounded-full"
                  style={{
                    background: done ? "var(--accent)" : "var(--line-strong)",
                    opacity: done ? 1 : 0.45,
                    ["--rise-delay" as string]: `${i * 0.05}s`,
                  }}
                />
              ))}
            </ul>
            <p className="voice mt-3">
              A quiet week. 2 hours, all Japanese. It still counts.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Say it in a sentence",
      body: "Type what you did; LifeXP proposes the skill, the duration and the date. You confirm it. Nothing is ever recorded on your behalf.",
    },
    {
      title: "A garden that only grows",
      body: "Every skill is a plant, and its stage comes from the milestones it has reached. Left alone it rests; it never wilts.",
    },
    {
      title: "Medals that stay earned",
      body: "Milestones and badges arrive as real hours accumulate, some announced, some found by accident. Once earned, they stay earned.",
    },
    {
      title: "Maintenance that never nags",
      body: "LifeXP remembers when you last did each recurring thing. Nothing is ever late or overdue; items just fade a little.",
    },
    {
      title: "A calendar you can see",
      body: "On request, LifeXP mirrors what you record into a calendar it created itself. It cannot read or touch your existing ones.",
    },
    {
      title: "Your data is yours",
      body: "Export everything as plain JSON whenever you like. No account required to read it back, nothing locked to LifeXP.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <p className="text-eyebrow text-muted uppercase">The response</p>
        <h2 className="display mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">
          Built to be kind to you
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Most trackers motivate with loss, and it works right up until life
          happens. LifeXP keeps the record without ever turning it into a debt.
        </p>
      </Reveal>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <li key={feature.title}>
            <Reveal delay={(i % 3) * 0.08} className="h-full">
              <div className="card lift h-full p-5">
                <h3 className="font-semibold text-growth">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{feature.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks({ season }: { season: "spring" | "summer" | "autumn" | "winter" }) {
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
    <section id="how" className="border-y border-line bg-paper-raised">
      <div className="mx-auto max-w-6xl px-5 py-20 md:grid md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <Reveal>
            <p className="text-eyebrow text-muted uppercase">How it works</p>
            <h2 className="display mt-2 text-3xl font-semibold sm:text-4xl">
              Three seconds a day
            </h2>
          </Reveal>

          <ol className="mt-10 space-y-8">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={0.1 + i * 0.12}>
                  <div className="flex items-start gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-deep">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-1.5 max-w-md text-ink-soft">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal delay={0.15} className="mt-12 md:mt-0">
          <PhoneDemo season={season} />
        </Reveal>
      </div>
    </section>
  );
}

function ForYou() {
  return (
    <section id="foryou" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <p className="text-eyebrow text-muted uppercase">For you</p>
        <h2 className="display mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">
          Made for the slow things
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Pick what you are learning. These are the real milestone ladders
          LifeXP fits to it, the same ones every skill starts with.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <SkillLadders />
      </Reveal>
    </section>
  );
}

/** The whole ladder in one line of ground: the seven stages, oldest to tallest. */
function GardenStrip({
  season,
}: {
  season: "spring" | "summer" | "autumn" | "winter";
}) {
  const stages = [
    "seed",
    "sprout",
    "sapling",
    "young",
    "flowering",
    "fruiting",
    "grand",
  ] as const;

  return (
    <section aria-hidden className="overflow-hidden border-y border-line bg-paper-raised">
      <div className="mx-auto max-w-6xl px-5">
        <p className="voice pt-8 text-center">
          Every skill is a plant, and a plant only ever grows.
        </p>
        <div className="mt-2 flex items-end justify-center gap-3 sm:gap-8">
          {stages.map((stage, i) => (
            <span
              key={stage}
              className="grow-in block shrink-0"
              style={{
                ["--sway-delay" as string]: `${i * 0.5}s`,
                ["--rise-delay" as string]: `${i * 0.08}s`,
              }}
            >
              <Plant
                stage={stage}
                color={skillColor(i * 41)}
                size={84}
                season={season}
                soil={i >= 5 ? "rich" : i >= 3 ? "mossy" : "bare"}
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MedalSection() {
  return (
    <section id="medals" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <p className="text-eyebrow text-muted uppercase">Medals</p>
        <h2 className="display mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">
          Rewards you can&rsquo;t lose
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Milestones arrive as you accumulate real hours, and once earned they
          stay earned. Some are visible from the start; the rest you discover as
          you go.
        </p>
      </Reveal>
      <MedalShowcase />
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "What counts as an experience?",
      a: "Anything that made you better at something and is worth keeping: a class, a practice session, a chapter, a long run. You confirm it; LifeXP records it.",
    },
    {
      q: "Do I have to keep a streak?",
      a: "There are no streaks. Nothing counts consecutive days, nothing can break, and one badge exists purely to welcome you back after time away.",
    },
    {
      q: "Does the AI need an API key?",
      a: "No. LifeXP ships with a built-in extractor that reads plain sentences without any network call. Add a key later if you want it to handle messier sentences.",
    },
    {
      q: "Where does my data live?",
      a: "In your account, and every bit of it can be exported as plain JSON from Settings. Nothing is locked to LifeXP.",
    },
    {
      q: "What does LifeXP do with my calendar?",
      a: "Only what you ask: it can mirror what you record into a calendar called LifeXP that it creates itself. It cannot read or change your existing calendars.",
    },
    {
      q: "What does it cost?",
      a: "Free during early access.",
    },
  ];

  return (
    <section id="faq" className="border-t border-line bg-paper-raised">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Reveal>
          <p className="text-eyebrow text-muted uppercase">FAQ</p>
          <h2 className="display mt-2 text-3xl font-semibold sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8">
            {items.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left">
                  <span className="font-medium">{item.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-xl leading-none text-muted transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="rise-in max-w-2xl pb-5 text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <div className="rise-in">
          <span className="inline-block">
            <LogoCream size={40} />
          </span>
          <h2 className="display mx-auto mt-6 max-w-2xl text-3xl font-semibold text-paper text-balance sm:text-4xl">
            Start with whatever you did today, however small.
          </h2>
          <Link
            href="/signin"
            className="tappable lift mt-8 inline-block bg-paper px-8 py-4 text-base font-semibold text-ink"
          >
            Start free
          </Link>
          <p className="mt-3 text-sm text-paper/60">Takes about a minute.</p>
        </div>
      </div>
    </section>
  );
}
