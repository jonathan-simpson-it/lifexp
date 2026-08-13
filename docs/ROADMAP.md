# LifeXP Roadmap

Where the build is against the PRD, what is deliberately missing, and what comes
next. PRD stages are from [`../../LifeXP-PRD.md`](../../LifeXP-PRD.md).

---

## Status at a glance

| PRD stage | Status |
|---|---|
| **Stage 0, Prototype** | ✅ Complete |
| **Stage 1, MVP** | ✅ Complete |
| **Redesign, gamified product** | ✅ Complete (design system, mobile shell, garden, calendar, celebrations, landing page) |
| Stage 2, Calendar, imports, AI suggestions | 🟡 Calendar write-back done; imports and suggestions not started |
| Stage 3, Health apps, third-party, subscriptions | ⬜ Not started |
| Stage 4, Life analytics, reviews | ⬜ Not started |

---

## Stage 0, Prototype ✅

Goal: validate whether people understand the idea.

| PRD item | Where |
|---|---|
| Chat input | `components/chat/chat-bar.tsx` → `/api/chat` |
| Structured input | `components/chat/structured-entry.tsx` |
| Experience timeline | `/timeline`, `components/timeline.tsx` |
| Skill summary | `/growth`, `/growth/[slug]` |

The PRD's Tech Partner prototypes A–E all landed:
A (NL parser) `lib/ai/`, B (experience CRUD) `app/actions/experiences.ts`,
C (skill aggregation) `lib/growth/`, D (fast mobile chat UI) the pinned capture
bar, E (input → LLM → JSON → DB) the extraction pipeline.

---

## Stage 1, MVP ✅

| PRD item | Where |
|---|---|
| Authentication | Auth.js v5, Google primary, dev sign-in fallback |
| Database | Postgres + Prisma 7 |
| Dashboard | `app/(app)/page.tsx` |
| Growth | skills, ladders, medals, heatmap |
| Maintenance | freshness gradient, no overdue state |
| Skill pages | `/growth/[slug]` |
| Basic AI classification | four adapters + rule-based default |

**Added beyond the PRD**, at the client's request this session: per-skill
milestone medals plus a global badge shelf, and Google Calendar write-back to a
separate LifeXP calendar.

---

## Deliberately not built yet

Listed so they are not mistaken for oversights.

| Item | Why deferred | Cost to add |
|---|---|---|
| **Free-tier limits** (3 skills, backdating) | Pricing is still an open PRD question; gates would touch every write path | ~half a day once decided |
| **Learning Mode** (coaching, book/course recommendations) | PRD Stage 2; needs curation or a second AI surface | multi-day |
| **Health / Duolingo / share-card imports** | PRD Stage 3 | per-integration |
| **Timezone editing in the UI** | Stored per user, defaults to UTC; only affects hour-of-day badges and event times | ~1 hour |
| **Editing/deleting an experience from the UI** | Server actions exist and are tested; no UI is wired to them yet | ~2 hours |
| **Custom milestones in the UI** | Schema supports them (`origin: CUSTOM`, no threshold); no form yet | ~2 hours |
| **Two-way calendar sync** | PRD Stage 2; needs dedupe, conflict rules, a suggestion inbox | multi-day |

---

## Next, in the order I would do it

### 1. Put it in front of people (no code)
The PRD asks for five user interviews before building further. Everything needed
is ready: it runs with no API key and no cloud account, and the seed gives a
believable two-year history to react to.

**The single most valuable thing to learn:** whether "medals" reads as
motivating or as gamified noise. That answer changes Stage 2's shape.

### 2. Close the small UI gaps (~1 day)
Edit/delete an experience, custom milestones, timezone picker. All have working
server-side support already; they are forms.

### 3. Answer the open product questions
The PRD lists these and they are still open. My recommendations, for the client
to accept or reject:

| Question | Recommendation |
|---|---|
| What exactly is an "experience"? | Something that *happened*, in the past, that the person did. Not a plan, not a feeling. This is already how the extractor behaves. |
| Can one experience belong to multiple skills? | Yes, implemented, with full duration to each. See ARCHITECTURE §4.1. |
| Should duration always matter? | No. `minutes` is nullable and an undated experience still counts as evidence. |
| Is "evidence" better than XP? | Yes as language; the UI never says XP. But medals need countable substrate, which is what hours and counts are. |
| Should every skill have measurable units? | Hours + count universally; `secondaryUnit` decorative. |
| How should users create skills? | Both, explicitly on `/growth`, or implicitly by mentioning one in chat. |
| When should AI ask follow-ups? | When it cannot attribute a skill, or confidence < 0.6. Implemented. |
| How confident before auto-categorising? | It never auto-categorises without confirmation. That is the point. |
| Is chat the default homepage? | No, dashboard with chat pinned. Decided this session. |
| Is structured input still necessary? | Yes. Typing "45" is faster than composing a sentence. |
| Is 3 skills the right free tier? | Unknown. Do not decide before the interviews. |

### 4. Then Stage 2
Calendar *read* (suggestions inbox), automatic imports, AI suggestions,
Learning Mode.

---

## Health of the codebase

| Signal | State |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | 80 passing |
| `npm run test:e2e` | 14 passing |
| `npm run build` | succeeds, 12 routes |

**Guard tests to keep green**, these encode the product, not just the code:
`e2e/philosophy.spec.ts` (no punitive language, no red anywhere) and the
"no streak mechanics" block in `award-engine.test.ts`.

---

## Known risks

| Risk | Mitigation |
|---|---|
| **Google OAuth verification.** Any calendar scope triggers a consent-screen review, which takes time. | Start it early if calendar sync is going to production. The narrow `calendar.app.created` scope should ease it. |
| **Scope string.** `calendar.app.created` is written from documentation, not verified against a live Google project. | Verify before production. |
| **AI cost at scale.** Every chat message is a model call. | The rule-based fallback is free; consider routing short/obvious messages to it even when a key is present. |
| **`prisma dev` port drift** in development. | Documented in README and `.env.example`. |
| **Aggregation in memory.** | Fine to ~10k experiences per user; revisit after that. |
