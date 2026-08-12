# LifeXP — Architecture

Full technical context for the app. Read this before changing anything
structural; `../README.md` is the short version for getting it running.

Source of truth for product intent: [`../../LifeXP-PRD.md`](../../LifeXP-PRD.md)
(lives beside the app directory, not inside it).

---

## 1. What this app is

Two independent systems under one shell.

| System | Question it answers | Core tables |
|---|---|---|
| **Growth** | "What kind of person am I gradually becoming?" | `Experience` → `ExperienceSkill` → `Skill` → `Milestone` |
| **Maintenance** | "When was the last time I did this?" | `MaintenanceItem` → `MaintenanceLog` |

They share a user and a dashboard and nothing else. A change to one should not
require touching the other — if it does, something has been coupled that
shouldn't be.

On top of both sits a **medal layer** (`BadgeAward`) that reads from everything
and writes only to itself.

---

## 2. Stack

| Concern | Choice | Note |
|---|---|---|
| Framework | Next.js 16.3, App Router, Turbopack | Turbopack is the default in 16 — no flag |
| React | 19.2 | |
| Language | TypeScript, strict | |
| Styling | Tailwind v4 (`@theme` tokens in `globals.css`) | no config file; tokens are CSS variables. The visual language they encode is written down in [`DESIGN.md`](../DESIGN.md) |
| Typefaces | Newsreader + Hanken Grotesk via `next/font` | self-hosted at build time; no CDN request, no layout shift |
| Database | Postgres via Prisma 7 | Prisma 7 requires a **driver adapter** (`@prisma/adapter-pg`) |
| Auth | Auth.js v5 (`next-auth@beta`) + `@auth/prisma-adapter` | JWT sessions — see §6 |
| Icons | `lucide-react` | explicit import map, no dynamic lookup |
| Unit tests | Vitest | `vitest.config.mts` |
| E2E | Playwright | mobile viewport by default |

### Next.js 16 specifics that will bite you

The bundled docs at `node_modules/next/dist/docs/` are version-matched and
authoritative — `AGENTS.md` points there deliberately. The changes that matter
here:

- `params`, `searchParams`, `cookies()`, `headers()` are **async only**. See
  `src/app/(app)/growth/[slug]/page.tsx` for the pattern.
- `middleware.ts` is renamed to `proxy.ts`. This app does auth in layouts
  instead, so there is no proxy file.
- `next lint` is removed; `npm run lint` calls ESLint directly.
- `revalidateTag` now needs a cache-profile argument. This app uses
  `revalidatePath("/", "layout")` and no tagged caches.
- Route groups and a bare `src/app/page.tsx` **both** resolve to `/`. Having
  both silently serves the wrong one. There is exactly one `/` page here:
  `src/app/(app)/page.tsx`.

---

## 3. Directory map

```
bd/
├── LifeXP-PRD.md                   product source of truth (outside the app)
└── lifexp/
    ├── README.md                  how to run it
    ├── docs/
    │   ├── ARCHITECTURE.md        this file
    │   ├── DECISIONS.md           why things are the way they are
    │   └── ROADMAP.md             what is built, what is next
    ├── prisma/
    │   ├── schema.prisma          data model, heavily commented
    │   ├── seed.ts                ~2 years of deterministic demo history
    │   └── migrations/
    ├── e2e/                       Playwright specs
    │   ├── helpers.ts             sign-in helper + forbidden-copy list
    │   ├── capture.spec.ts        chat → draft → confirm → saved
    │   └── philosophy.spec.ts     asserts the design principles hold
    └── src/
        ├── app/
        │   ├── page.tsx           public landing page  ← the "/" route
        │   ├── (app)/             everything behind auth
        │   │   ├── layout.tsx     session gate + AppShell
        │   │   ├── today/         dashboard: garden, recap, skills
        │   │   ├── calendar/      month grid + year view
        │   │   ├── growth/            skills list
        │   │   ├── growth/[slug]/     one skill: ladder, heatmap, entries
        │   │   ├── maintenance/
        │   │   ├── medals/
        │   │   ├── timeline/
        │   │   └── settings/
        │   ├── signin/            unauthenticated
        │   ├── actions/           ALL mutations (server actions)
        │   │   ├── experiences.ts
        │   │   ├── maintenance.ts
        │   │   └── calendar.ts
        │   └── api/
        │       ├── auth/[...nextauth]/
        │       ├── chat/          extraction — READ ONLY, never writes
        │       └── export/        full JSON export
        ├── components/            presentational + small client islands
        │   ├── icons/             custom SVG set: plants, medals, nav, logo
        │   ├── nav/               bottom bar + desktop sidebar
        │   ├── log/               quick-log sheet (the centre button)
        │   ├── garden/            the living garden
        │   ├── calendar/          month grid
        │   ├── celebrate/         toast, medal moment, confetti
        │   ├── recap/             weekly recap
        │   └── chat/              capture, draft card, structured form
        ├── lib/
        │   ├── auth.ts            Auth.js config, requireUserId()
        │   ├── db.ts              Prisma singleton (hot-reload safe)
        │   ├── progress/          milestones, badges, award engine   ← pure
        │   ├── growth/            skills, aggregation, summarise     ← summarise is pure
        │   ├── maintenance/       freshness                          ← pure
        │   ├── ai/                extraction contract + 4 adapters
        │   ├── google/            calendar write-back
        │   └── ui/format.ts       durations, dates, colours
        ├── types/next-auth.d.ts   adds `user.id` to the session type
        └── generated/prisma/      generated client (gitignored)
```

### The purity rule

**Anything with interesting logic must not import Prisma.** That is why
`growth/summarise.ts` exists separately from `growth/aggregate.ts`: the
aggregation maths is unit-tested without a database, while the queries that feed
it live next door.

Modules held to this: `progress/milestones.ts`, `progress/badges.ts`,
`progress/award-engine.ts`, `maintenance/freshness.ts`, `growth/summarise.ts`,
`ai/adapters/rules.ts`.

If you add logic worth testing, put it in one of those, not in a query module.

---

## 4. Data model

See `prisma/schema.prisma` — it is commented at the points that matter. The
non-obvious parts:

### 4.1 Multi-skill duration (the subtle rule)

An experience's **full duration counts toward each of its skills**. 90 minutes of
Japanese conversation is genuinely 90 minutes of both Japanese *and* Speaking; it
is not divided between them.

The consequence, which is easy to get wrong:

> Cross-skill totals ("18h this week") must sum over **distinct `Experience`
> rows**, never over `ExperienceSkill` rows.

Summing the join table double-counts every multi-skill evening. `summarise.ts`
does this correctly and `summarise.test.ts` pins it down. Do not "optimise" it
into a join-table aggregate without re-reading that test.

### 4.2 Nullable duration

`Experience.minutes` is nullable and that is load-bearing. "Ordered lunch
entirely in Japanese" has no duration and is still evidence — it contributes +1
to the skill's experience count. Never default it to a guess.

### 4.3 No streak field

There is no consecutive-day counter, no `lastBrokenAt`, nothing from which a
streak could be derived cheaply. That absence is a product requirement.

### 4.4 Milestones are rows, not references

A skill's ladder is **copied** from a template at creation time into
`Milestone` rows. Editing a template later therefore cannot move the goalposts
under someone already climbing toward them.

`thresholdMinutes` XOR `thresholdCount` is set for automatic milestones. A
milestone with neither is a custom goal ("ski intermediate slopes confidently")
that only the user can mark done.

### 4.5 Badges are code, awards are data

Badge *definitions* live in `lib/progress/badges.ts`. Only `BadgeAward` rows are
persisted. Adding a badge in a deploy means existing users can earn it
retroactively on their next write. The `@@unique([userId, badgeKey])` constraint
is what makes the award engine safe to re-run.

---

## 5. Key flows

### 5.1 Recording via chat

```
user types
  → POST /api/chat
      → resolveProvider()            reads AI_PROVIDER, falls back to rules
      → provider.extract()           returns drafts + optional clarification
      → Zod parse                    final arbiter of shape
  → drafts render as confirm cards   NOTHING WRITTEN YET
  → user presses Save
      → createExperience()  (server action)
          → resolve/create skills
          → verify skill ownership   ← actions are reachable by direct POST
          → insert Experience + links
          → syncProgress()           milestones + badges
          → syncCalendar()           best-effort, never blocks
          → revalidatePath("/", "layout")
```

The write path is **one function** — `createExperience` — shared by chat and the
structured form, so validation cannot drift between them.

### 5.2 syncProgress (`lib/progress/sync.ts`)

Runs after every experience and maintenance write. It is a **full recompute**,
not an incremental update: two extra queries in exchange for no drift to debug.
Editing a duration downward is handled by the same code path as creating one.

```
load experiences, maintenance count, held badges
  → per-skill totals (full minutes per linked skill)
  → mark newly-met milestones as achieved
  → count achieved milestones  ← after the update, so first-milestone fires same pass
  → build AwardSnapshot
  → evaluateAwards(snapshot, held)   pure
  → createMany(skipDuplicates)
```

**Milestones are never revoked.** The query only looks at `achievedAt: null`, so
dropping back below a threshold leaves the medal in place. See DECISIONS §4.

### 5.3 Freshness (`lib/maintenance/freshness.ts`)

`fraction = clamp(daysSince / intervalDays, 0, 1)`. It **saturates** rather than
overflowing — there is no "days late" quantity anywhere in the system. The tone
ladder is `fresh → settling → aging → distant`, and "been a while" is as pointed
as the copy ever gets.

---

## 6. Auth

Auth.js v5 with the Prisma adapter, **JWT session strategy**.

JWT rather than database sessions because the Credentials provider (the
development sign-in) only works with JWT. The adapter still persists `User` and
`Account` rows on Google sign-in, which is where the calendar integration reads
its refresh token from.

- **Google** is the primary provider, requesting only `openid email profile`.
- **Development sign-in** is registered *only* when Google credentials are absent
  and `NODE_ENV !== "production"`. It exists so the app is runnable and demoable
  without a Google Cloud project.
- `requireUserId()` is called inside **every** server action. Server actions are
  reachable by direct POST, so the page that rendered the form is not trusted.

Route protection is in `src/app/(app)/layout.tsx`, not a proxy file.

---

## 7. AI extraction layer

One interface, four implementations, chosen at runtime from `AI_PROVIDER`.

```
lib/ai/types.ts       ExtractionProvider, Zod schema, JSON Schema mirror
lib/ai/prompt.ts      one shared system prompt
lib/ai/provider.ts    resolveProvider() + extractExperiences() with fallback
lib/ai/adapters/
  rules.ts              default — no key, no network, fully tested
  openai-compatible.ts  raw fetch: OpenAI, Groq, OpenRouter, DeepSeek, Ollama
  anthropic.ts          official SDK, structured outputs, effort: low
  google.ts             Gemini REST, restricted OpenAPI schema dialect
```

Three rules:

1. **The Zod parse is the last word.** Server-side schema constraints are a
   nicety; a provider can always return something unexpected.
2. **A hosted provider that fails falls back to `rules`** rather than removing
   the feature. Degraded chat beats no chat.
3. **The extractor never writes.** `/api/chat` has no write path to
   `Experience`. "Human first, AI assists" is enforced at the boundary.

To add a provider: implement `ExtractionProvider`, add a case to
`resolveProvider`, document it in `.env.example`. Nothing above the boundary
changes.

---

## 8. Google Calendar

Opt-in from Settings, never at sign-in.

- Scope: `calendar.app.created` — the narrowest one that exists. It grants access
  only to calendars this app created, so LifeXP *cannot* read existing calendars.
- LifeXP creates one secondary calendar named **LifeXP** and writes only there.
- `Experience.googleEventId` links the two. Edits update the event; deletes
  remove it.
- Every function in `lib/google/calendar.ts` swallows its own errors and records
  a banner on `User.calendarSyncError`. **A calendar failure must never fail a
  save.**
- Disconnecting stops syncing and leaves the calendar in place — it is the
  user's record.

> ⚠️ Re-verify the scope string against current Google Calendar API docs before
> production, and budget for the OAuth consent-screen review that any calendar
> scope triggers.

### 8.1 Making it inspectable without credentials

`buildEventBody` is exported and rendered by `components/calendar-preview.tsx`
in Settings. Without Google credentials this is the *only* way to see what the
feature does, and it uses the real builder rather than a mock so the preview
cannot drift from what is actually sent.

This matters beyond convenience: calendar is the one feature that would
otherwise be invisible on a machine that hasn't been through an OAuth setup,
which is every machine used for a user interview.

---

## 9. Testing

| Suite | Count | Runs |
|---|---|---|
| Vitest | 80 | `npm test` |
| Playwright | 14 | `npm run test:e2e` |

The e2e config sets `LIFEXP_E2E=1`, which turns off the Next dev-tools indicator
— its portal is pinned to the bottom of the viewport and swallows clicks on the
capture bar.

**`e2e/philosophy.spec.ts` is not a nice-to-have.** It walks every page and fails
on "overdue", "streak", "you missed", "days late", and scans computed styles for
red. `award-engine.test.ts` asserts that no badge rewards consecutive days. These
are the tests that keep the product honest as it grows.

---

## 10. Where to change what

| Task | File |
|---|---|
| Add a badge | `lib/progress/badges.ts` (+ icon in `components/badge-icon.tsx`) |
| Change a milestone ladder | `lib/progress/milestones.ts` — affects **new** skills only |
| Add an AI provider | `lib/ai/adapters/`, then `lib/ai/provider.ts` |
| Change what chat understands | `lib/ai/adapters/rules.ts` and/or `lib/ai/prompt.ts` |
| Add a mutation | `app/actions/` — must call `requireUserId()` |
| Change colours/typography | `app/globals.css` (`:root` + `@theme`) — then update [`DESIGN.md`](../DESIGN.md), and re-check contrast against **all four** grounds, not just the papers |
| Add or change an animation | `app/globals.css` keyframes; `lib/ui/motion.ts` only for shared-element transitions and animated numbers. Read [`DESIGN.md`](../DESIGN.md) §7 first — motion may only move in the direction of growth |
| Change dashboard composition | `app/(app)/page.tsx` |
| Change what export contains | `app/api/export/route.ts` |
