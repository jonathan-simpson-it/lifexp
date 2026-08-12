# LifeXP

Makes invisible progress visible.

Many of the most valuable things in life have feedback cycles measured in months
or years. Because progress is hard to perceive, people lose motivation while
they are actually still getting somewhere. LifeXP keeps the evidence.

This is the Prototype + Stage 1 MVP from [`../LifeXP PRD.md`](../LifeXP%20PRD.md).

## Documentation

| | |
|---|---|
| **This file** | how to run it, and the short version of everything else |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | full technical context — directory map, data model, flows, invariants, where to change what |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | why things are the way they are, and what would justify changing them |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | what is built against the PRD, what is deliberately missing, what comes next |
| [`../LifeXP PRD.md`](../LifeXP%20PRD.md) | product source of truth |

---

## Running it

```bash
npm install
npx prisma dev --name lifexp     # local Postgres; prints two connection strings
cp .env.example .env             # paste those strings in
npx prisma migrate dev
npm run seed                     # ~2 years of demo history
npm run dev
```

Open http://localhost:3000. With no Google credentials configured the sign-in
page offers a local development sign-in — use `demo@lifexp.local` to land on the
seeded account.

**Nothing above needs an account, an API key, or a network connection.** That is
deliberate: the PRD asks for five user interviews, and a demo that depends on a
vendor console is a demo that fails at the wrong moment.

| Command | |
|---|---|
| `npm run dev` | dev server |
| `npm test` | unit tests (80) |
| `npm run test:e2e` | end-to-end tests (14) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | reset to demo data |
| `npm run db:studio` | browse the database |

---

## The philosophy is enforced, not just documented

The product's defining constraint is what it refuses to do. Those refusals are
asserted by tests, so they survive contact with future features:

- **No streaks anywhere.** There is no consecutive-day counter in the schema, and
  `award-engine.test.ts` asserts that every badge reachable by daily practice is
  equally reachable by irregular practice.
- **No punitive language.** `philosophy.spec.ts` walks every page and fails on
  "overdue", "streak", "you missed", "days late".
- **No alarm colours.** The palette contains no red token, and an end-to-end test
  scans computed styles for red pixels on the maintenance page.
- **A slow month is celebrated.** The `quiet-month` badge fires for a completed
  month with one or two experiences — and deliberately ignores the month
  currently underway, so it can never tell someone they have written off a month
  that is still happening.
- **AI never writes.** `/api/chat` returns drafts and has no write path to the
  `Experience` table. Confirmation happens in the UI, enforced at the boundary.

---

## How it fits together

```
src/lib/progress/     milestones, badge definitions, award engine   (pure, no Prisma)
src/lib/growth/       skill creation, aggregation read models
src/lib/maintenance/  freshness gradient                            (pure, no Prisma)
src/lib/ai/           extraction contract + four provider adapters
src/lib/google/       calendar write-back
src/app/actions/      every mutation, each re-checking authorisation
```

Anything with interesting logic is kept free of Prisma imports so it can be unit
tested without a database. That is why `summarise.ts` exists separately from
`aggregate.ts`.

### The one subtle rule

An experience's **full duration counts toward each of its skills**. Ninety
minutes of Japanese conversation is genuinely ninety minutes of both Japanese
and Speaking, so it is not split between them.

The consequence: cross-skill totals ("18h this week") sum over **distinct
experiences**, never over skill links, or a two-skill evening is counted twice.
`summarise.test.ts` pins this down.

### Milestones are never revoked

Deleting an experience can take a skill back below a threshold. The medal stays.
It records that the person got there, and withdrawing it over a data correction
would be the exact kind of punishment this product exists to avoid.

---

## Natural language

Chat runs through one interface with four implementations behind it:

| `AI_PROVIDER` | Notes |
|---|---|
| unset / `rules` | **Default.** No key, no network. Handles durations, relative dates, and skills you already track. |
| `openai` | Any OpenAI-compatible `/v1` endpoint — OpenAI, Groq, OpenRouter, DeepSeek, Together, local Ollama. Set `AI_BASE_URL`. |
| `anthropic` | Official Anthropic SDK, structured outputs, `claude-opus-5` by default. |
| `google` | Gemini REST, `responseSchema`. |

A configured provider that is unreachable, rate-limited, or returns something
unparseable **falls back to the rule-based extractor** rather than removing the
feature. Whatever is actually running is shown in Settings.

The rule-based extractor is not a stub — see `rules.test.ts` for the 34 cases it
handles, including refusing to extract from "I should practise piano tomorrow".

---

## Google Calendar

Opt-in, from Settings, after sign-in — never as a condition of signing in.

LifeXP creates a secondary calendar called **LifeXP** and writes only there. The
scope requested (`calendar.app.created`) covers only calendars the app itself
created, so LifeXP *cannot* read the user's existing calendars even if it tried.

Writes are best-effort: a calendar failure records a quiet banner and never
prevents an experience from being saved. Disconnecting stops syncing and leaves
the calendar in place — it is the user's record, and deleting it is their call.

> The exact scope string should be re-verified against current Google Calendar
> API docs before going near production, along with the OAuth consent screen
> review that any calendar scope triggers.

---

## Known gaps

Deliberately out of scope for this stage, listed so they are not mistaken for
oversights:

- **Free-tier limits** (3 skills, backdating restrictions) are not enforced. The
  gates are cheap to add later; adding them now would complicate every write path
  before the pricing model is settled.
- **Learning Mode** coaching, health-app imports, and share-card imports are
  Stage 2/3 in the PRD.
- **Timezone** is stored per user but not yet editable in the UI; it defaults to
  UTC and only affects hour-of-day badges and calendar event times.
- **Aggregation loads a user's experiences into memory.** Correct and fast at
  personal scale (a heavy user over five years is under 4,000 small rows); it
  would need moving into SQL before any multi-tenant reporting.
- **The `prisma dev` port changes** when a new local server is created. If
  migrations suddenly cannot connect, re-run it and update `.env`.
