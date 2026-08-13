# LifeXP Decision log

Why things are the way they are. Each entry records the decision, what it rules
out, and what would justify revisiting it.

Read this before overturning something that looks arbitrary, most of these look
arbitrary until you hit the case they were made for.

---

## 1. Hours + experience count as the substrate; medals as the surface

**Decision.** Every skill accumulates two universal numbers, total minutes and
number of experiences. Milestone medals and global badges are computed from
those. An optional `secondaryUnit` ("books", "km") is decorative only and never
awards anything.

**Why.** The client asked for something closer to GitHub achievements than to a
points system. Medals need something countable underneath them, and per-skill
custom units (books for reading, km for running) would mean per-unit logic in
every ladder, dashboard, and cross-skill total, roughly double the surface area
for a gain that is mostly cosmetic.

**Rules out.** Cross-skill leaderboards in mixed units; "500 km" as a milestone.

**Revisit if.** Users consistently report that hours misrepresent a skill they
care about, reading is the likeliest candidate.

---

## 2. No streaks, enforced by tests

**Decision.** No consecutive-day counter exists in the schema, no badge rewards
consecutive days, and `award-engine.test.ts` asserts that every badge reachable
by daily practice is equally reachable by irregular practice.

**Why.** This is the product's entire differentiation from Duolingo. A streak is
a loss-aversion mechanic: it works by making a gap feel like damage. LifeXP's
premise is that a slow month is still progress, and those two ideas cannot
coexist in one app.

**Consequence.** `the-return` (come back after ≥21 quiet days) and `quiet-month`
(a completed month with one or two experiences) exist specifically to reward what
a streak would punish.

**Revisit if.** Never, without an explicit product decision to change what the
app is.

---

## 3. AI proposes, the user confirms, enforced at the boundary

**Decision.** `/api/chat` returns drafts and has no write path to the
`Experience` table. Saving is a separate server action triggered by the user.

**Why.** The PRD's "human first, AI assists" and "never invent experiences". The
product sells one thing: that the history is real evidence of what actually
happened. A model that silently pads a vague sentence into a confident record
destroys that, and no amount of later editing restores trust in it.

**Consequence.** Drafts below 0.6 confidence open pre-expanded for editing,
when the extractor is guessing, the honest thing is to show the guess.

---

## 4. Milestones are never revoked

**Decision.** `syncProgress` only considers milestones with `achievedAt: null`.
Deleting or shortening an experience can take a skill back below a threshold; the
medal stays.

**Why.** The person did reach it. Withdrawing a medal because they corrected a
typo in a duration is exactly the kind of punishment this product exists to
avoid, and it would make people afraid to fix their own data.

**Rules out.** Perfect consistency between current totals and awarded medals.
That is an acceptable price.

---

## 5. Full recompute after every write

**Decision.** `syncProgress` reloads a user's experiences and recomputes all
milestones and badges rather than updating incrementally.

**Why.** Incremental progress updates drift, and drift in a system whose entire
value is an accurate long-term record is expensive to debug and worse to
discover. A full recompute means creating, editing, and deleting all go through
one path.

**Cost.** Two or three extra queries per write, over a few hundred to a few
thousand rows. Irrelevant at personal scale.

**Revisit if.** A user passes ~10k experiences, or this ever becomes
multi-tenant reporting.

---

## 6. Aggregation in JavaScript, not SQL

**Decision.** Read models load a user's experiences into memory and aggregate
there.

**Why.** The multi-skill counting rule (ARCHITECTURE §4.1) is subtle and easy to
get wrong. Expressed once in readable TypeScript with tests around it, it stays
correct; duplicated across raw SQL aggregates it will not.

**Scale check.** A heavy user logging twice a day for five years is under 4,000
rows of a handful of columns.

**Revisit if.** Per-user row counts reach five figures.

---

## 7. Provider-agnostic AI with a rule-based default

**Decision.** One `ExtractionProvider` interface; adapters for
OpenAI-compatible, Anthropic, Google, and a rule-based local extractor. Default
is rules. A hosted provider that fails falls back to rules.

**Why.** The client asked for "any API, not limited to Claude". Beyond that, the
rule-based path is what makes the app demoable with no key, no account, and no
network, which matters directly for the five user interviews the PRD asks for,
and for every future developer's first ten minutes.

**Consequence.** The rule-based extractor is maintained as a real feature (34
tests), not a stub.

**Note.** OpenAI-compatible uses raw `fetch` rather than a vendor SDK precisely
so it stays reachable by Groq, OpenRouter, DeepSeek, Together, and Ollama. The
Anthropic adapter uses the official SDK because that is the supported path for
its structured-output API.

---

## 8. A separate Google calendar, requested after sign-in

**Decision.** Sign-in requests only `openid email profile`. Calendar access is a
second, later consent from Settings, using `calendar.app.created`, a scope that
covers only calendars the app itself created. LifeXP creates one calendar named
"LifeXP" and writes only there.

**Why.** Two reasons. Asking for calendar permission at the door costs sign-ups
from people who will never want it. And writing into someone's primary calendar
mixes a record of their life with their appointments, which is both messy and
hard to undo, a separate calendar can be hidden or deleted in one click.

**Consequence.** Disconnecting stops syncing and does **not** delete the
calendar. It is the user's record.

---

## 9. Calendar writes are best-effort

**Decision.** Every function in `lib/google/calendar.ts` swallows its own errors,
records a banner, and returns. A calendar failure never fails a save.

**Why.** The experience is the product; the calendar is a mirror. Losing what
someone typed because Google was briefly unreachable would be an unforced error.

---

## 10. Local Postgres via `prisma dev`, not a cloud signup

**Decision.** Development uses `npx prisma dev`, which runs Postgres locally.
Production is any Postgres URL.

**Why.** It removes a cloud-account signup from the critical path of "clone the
repo and see it work". The Prisma schema is identical either way.

**Gotcha.** `prisma dev` picks a fresh port when it creates a new server; if
migrations stop connecting, re-run it and update `.env`.

---

## 11. Warm/paper visual language, and no red token

**Decision.** Cream grounds, a serif for anything stating a quantity, sage for
growth, warm metal for medals. The palette defines **no red**.

**Why.** The product is a record of a life, not a dashboard. And nothing in it is
an error state, not a maintenance item untouched for a month, not a skill
dormant since spring. Omitting the token means any red would have to be
deliberately hardcoded, and an e2e test scans for it.

---

## 12. Light only, no dark mode

**Decision.** `--paper` is cream (`#f7f1e1`) and there is **no**
`prefers-color-scheme: dark` block. `color-scheme: only light` is set on
`:root`, and `viewport.themeColor` is a single value.

**Why.** The client asked for a light app. A dark-mode block would have
overridden the cream on any device set to dark, which is most phones, and
therefore most of the devices the app will actually be demoed on. Honouring the
request means light for everyone, not light-unless-your-phone-disagrees.

`color-scheme: only light` additionally stops the browser darkening form
controls, scrollbars and autofill backgrounds underneath the palette.

**Cost.** People who prefer dark interfaces get a bright app.

**Revisit if.** The client wants a dark theme. It is one media block in
`globals.css`, nothing else assumes a light ground, because every colour is a
token. The `cream ground` tests in `philosophy.spec.ts` would need updating at
the same time; they currently assert cream under *both* colour schemes.

---

## 13. Gamification without streaks or leaderboards

**Decision.** Four loops: goal gradient (distance to the next milestone, set
larger than the running total and in the action colour), variable reward
(surprise medals with `? ? ?` slots), ritual (a Sunday/Monday recap), and a
living garden. No streak, no league, no ranking.

**Why.** Every mainstream engine is a streak or a leaderboard, and both work by
threatening loss. This product's premise is that a slow month still counts, so
those mechanics are unavailable by definition. The four chosen loops can only
ever deliver good news.

**The strongest of them is the goal gradient**, people accelerate as a goal
gets closer, and the reward lands at the instant of effort, when the remaining
distance visibly drops after logging.

---

## 14. Plant stage comes from milestone tier, nothing else

**Decision.** A skill's plant stage is derived solely from its highest achieved
milestone. The component takes no `lastActiveAt` and no date of any kind.

**Why.** There is then no code path that can wilt a plant. A skill untouched
since spring renders exactly as it did the day it was last logged, the
anti-streak rule expressed visually rather than merely promised.

**Known consequence.** Two skills at the same tier render identically even when
one has ten times the evidence: Japanese at 332h and Piano at 34.5h are both
"Foundation", so both are saplings. This is defensible, each plant shows
progress along *that skill's own ladder*, and the hours label underneath carries
the absolute figure, but it is a real trade-off.

**Revisit if.** Users read the garden as a comparison between skills rather than
as each skill's own journey. The fix would be to blend tier with absolute
evidence, at the cost of the mapping no longer being exactly the ladder.

---

## 15. Sage is the only colour, in three values

**Decision.** `--accent` (#80988f), `--accent-deep` (#4f7266) and
`--accent-soft` (#e3e9e6), one hue (158) at three depths. `--growth` aliases
the accent rather than holding a second green, and per-skill colours are
generated inside the same hue band.

**Why the split.** #80988f is 2.74:1 on cream. That is fine for a decorative
fill but below the 3:1 a UI boundary needs and far below the 4.5:1 text needs,
and white on it is only 3.1:1. One token would have meant either unreadable
buttons or abandoning the chosen colour. The deep variant carries everything
with text; the light one stays decorative. The audit script encodes exactly that
rule, so using `--accent` for text fails the check.

**Per-skill colours are sage too.** Skills still need to be distinguishable,
the calendar draws a dot per skill, but arbitrary hues made those the loudest
thing on screen in a palette meant to be a single colour. `skillColor` now
varies **lightness** within hue 148–187, which separates cleanly inside one
family.

**Revisit if.** Users cannot tell skills apart in the calendar. The lever is
lightness spread, not hue.

### Contrast is checked, not eyeballed

Every foreground token clears WCAG AA against both grounds: body text ≥ 4.5:1
(worst is `--muted` at 5.34:1) and graphical tokens ≥ 3:1. `--medal` was
darkened specifically because it is used for small text on the medal shelf, not
just as a swatch. `no text is light-on-light` in `philosophy.spec.ts` walks the
rendered DOM and computes each element's contrast against its nearest opaque
ancestor background, so a half-applied theme fails the build.

---

## 16. Two chosen typefaces, and a scale of roles

**Decision.** Newsreader (display, numerals, voice) and Hanken Grotesk (UI,
body), self-hosted via `next/font`. Seven role-named type tokens,
`text-eyebrow` through `text-hero`, each carrying its own line height, tracking
and weight. The face changes at 20px: serif at or above `text-title`, sans below.

**Why.** The app previously had no chosen typeface at all: `--font-display` was
`Georgia` and `--font-sans` was the system stack, so the type was whatever the
device happened to have. It was the one part of the design never actually
designed, and with a palette this small, one colour, two grounds, type and
space are what have to carry the hierarchy.

Newsreader specifically for its optical-size axis. A 34px total and a 12px
caption are drawn differently rather than scaled from one master, which is what
makes a number read as recorded rather than computed. The `opsz` axis has to be
requested explicitly; `next/font` ships weight only by default.

**Roles rather than sizes** so "what size is this?" is never a judgement call at
the call site. `text-eyebrow` is a complete typographic decision, not a size that
still needs four more classes to look right.

**Consequence.** A webfont that fails to load looks *almost* right, because the
fallback stack is deliberately close, which makes it the one visual regression
nobody spots by eye. `typefaces › the chosen faces are actually applied` asserts
the computed family instead.

**Cost.** The first build needs network to fetch the faces. If that is ever a
problem, vendor the woff2 files and switch to `next/font/local`; the CSS
variables stay the same.

---

## 17. Motion only ever moves in the direction of growth

**Decision.** Nothing in the app animates downward, drains, wilts or empties,
except a UI element being dismissed, and the remaining-distance figure, which
counts down because a smaller distance is good news. `src/lib/ui/motion.ts`
deliberately contains no shrink, decay or fade-to-nothing preset.

**Why.** The same reason there are no streaks. A product whose premise is that a
slow month still counts must not own an animation capable of expressing loss,
because that animation will eventually get used.

**The watering rule follows from it.** Logging waters the skill's plant, and a
milestone crossing grows it a stage *while the water is on it*. In every farming
game watering is an obligation, the plant gets thirsty, you owe it water, you
feel bad when you don't, and that is a streak wearing a costume. So there is no
thirsty state, no "needs water" prompt, and nothing that ever asks to be
watered. Watering only ever happens as a consequence of the user recording
something.

**Two simplifications, both deliberate.** The watering renders inside the
confirmation rather than over the garden, because logging works from every
screen and the garden only exists on `/today`, one placement means the same
moment everywhere with no cross-tree coordination. And the garden's grow-in
replays on every visit rather than once per session: a once-per-session flag has
to survive SSR, and a wrong guess on the server means either a hydration
mismatch or a flash of the settled state.

**`motion` is used only where CSS cannot go**, shared-element transitions
(`layoutId`) and animating a number. Everything else is CSS keyframes. Without
that boundary the bundle grows a physics engine to fade a card in.

**Enforced by.** `motion › reduced motion silences the watering animation` and
`motion › no plant ever renders a wilted state`, plus the unit tests in
`src/lib/ui/growth-only.test.ts`.

---

## 18. Contrast is measured against every ground, not just the papers

**Decision.** A text token must clear 4.5:1 against **all four** grounds it can
sit on: `--paper`, `--paper-raised`, `--accent-soft` and `--medal-soft`.

**Why.** The original audit measured foregrounds against the two paper grounds
only. Half the text in the app sits on a tint instead, badge chips on
`--medal-soft`, the active sidebar item on `--accent-soft`, and four
combinations were below AA without anyone noticing:

| | |
|---|---|
| `--medal` on `--medal-soft` | 4.40:1 |
| `--medal` on `--accent-soft` | 4.47:1 |
| `--accent-deep` on `--accent-soft` | 4.34:1 |
| `--accent-deep` on `--medal-soft` | 4.27:1 |

`--accent-deep` moved from `#4f7266` to `#496a5f` and `--medal` from `#8a6124`
to `#805a21`, both with margin so adding a chip tint later does not silently
reintroduce the problem. `--accent` is untouched: it is the client's chosen sage
and it is a fill, never text.

**The deeper cause was the test.** `no text is light-on-light` used a 3:1
threshold, the bar for graphics, not for text, so everything above passed.
It now uses 4.5:1, which is what the palette always claimed. That change alone
also catches the milestone chip on skill cards, which was rendering its label in
the tier colour at 3.24:1.

**Rules out.** Eyeballing a new colour. Add it to the audit or do not add it.

---

## 12. Free-tier limits deferred

**Decision.** The PRD's 3-skill cap and backdating restriction are not enforced.

**Why.** They are gates on every write path, and the pricing model is still an
open question in the PRD itself. Adding them now would complicate code that is
likely to change for reasons unrelated to pricing.

**Revisit at.** Whenever monetisation is actually being tested.
