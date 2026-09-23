# LifeXP Design System

A portable description of LifeXP's visual language, in the format design agents
can act on. Attach this file to Claude Design, Cursor, v0 or Copilot and it
should be enough to produce a new LifeXP screen that looks like it belongs.

Every number here is measured against the shipped code. If this file and
`src/app/globals.css` ever disagree, **the CSS is right and this file is a
bug.**

---

## 1. Visual Theme & Atmosphere

**LifeXP is a record of a life, not a dashboard of a life.**

It holds evidence of what someone has slowly got better at: hours of Japanese,
a piano ladder climbed over two years, a month where almost nothing happened.
The visual language is printed matter: warm off-white grounds, a literary serif
for anything that states a quantity, generous space, and one quiet colour.

Three adjectives, in order: **warm, quiet, adult.**

The atmosphere supports one emotional claim, *you have done more than you
remember*, so the design is calm rather than energetic. Nothing shouts, because
the numbers are already impressive to the person reading them, and shouting
would make them feel sold to.

### The principle everything else derives from

> **Nothing in this product is an error, a warning, or a failure.**

Not a maintenance item untouched for a month. Not a skill dormant since spring.
Not a week with nothing in it. There is no failure state to design, which is
why there is no red in the palette, no wilted plant, no broken-chain graphic,
and no animation that can move downward.

If a design decision would let the interface express disappointment, it is the
wrong decision, however small it looks.

### What LifeXP is not

| Not this | Because |
|---|---|
| A productivity tool | It measures accumulation, not completion. There is no "done". |
| A game HUD | No XP bars stacked with badges stacked with counters. One figure per screen. |
| An analytics dashboard | No charts inviting comparison with last week. The comparison is with years ago. |
| A social feed | No ranks, no leaderboards, no public totals. |

---

## 2. Color Palette & Roles

One ground, one ink, one colour. The palette is deliberately small: with this
few values, hierarchy has to come from type and space, which is most of what
keeps it from looking templated.

### Grounds

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#f0f0e6` | The page |
| `--paper-raised` | `#f9f9f1` | Cards, sheets, anything lifted |
| `--accent-soft` | `#eae6d6` | Warm chip and badge grounds |
| `--medal-soft` | `#f1e5c9` | Medal chip grounds |

Both grounds come from the client's logo lockup: the green mark ships on a
`#f0f0e6` field, so the app's cream is the logo's cream, and everything else is
a lift or a shade of it.

### Text tokens

Contrast is measured against **all four grounds above**, and the worst case is
what is shown. This matters: an earlier audit checked only the two papers, and
four combinations were sitting below AA on the chip tints without anyone
noticing.

| Token | Hex | Role | Worst |
|---|---|---|---|
| `--ink` | `#211e16` | Primary text | 14.51 |
| `--ink-soft` | `#494332` | Secondary prose, the voice | 8.58 |
| `--muted` | `#6b6250` | Labels, captions, metadata | 5.25 |
| `--accent-deep` | `#426e4a` | Green text, primary buttons, focus | 4.71 |
| `--medal` | `#805a21` | Medal text and labels | 4.94 |

White on `--accent-deep` is **5.90:1**, which is why every primary button uses
the deep variant.

### Decorative tokens (fills and graphics only)

| Token | Hex | Role | On paper |
|---|---|---|---|
| `--accent` | `#6e9f70` | Progress fills, plant tints, calendar dots | 2.67 |
| `--line` | `#d0cbb4` | Card borders, dividers | 1.42 |
| `--line-strong` | `#b8b294` | Emphasised rules, the sheet grabber | 1.86 |
| `--medal-bright` | `#c9932b` | Medal mark fills | 2.38 |

### Green is the only colour, in three values

`--accent` is the client's logo green (`#6e9f70`). `--accent-deep` and
`--accent-soft` are that hue taken darker and lighter, not three colours.
`--growth` and `--growth-soft` are *aliases* of the accent, so there is
genuinely one colour in the product.

The split exists because of contrast, not decoration:

```
--accent       2.67:1 on cream  →  a FILL. Never text, never a border that has
                                   to be seen. Bars, plant tints, dots.
--accent-deep  4.71:1 worst     →  anything with text on or in it: buttons
                                   (white label, 5.90:1), green text, focus
                                   rings, hover borders.
--accent-soft  a tint           →  chip grounds only, with ink or accent-deep
                                   on top.
```

> **The rule that must never be broken:** if text sits on it or in it, use
> `--accent-deep`. Using `--accent` for text is the single easiest way to break
> this design system.

### Tier colours (graphics only)

| Tier | Hex | On paper |
|---|---|---|
| `--tier-first-steps` | `#8c8474` | 3.23 |
| `--tier-foundation` | `#6f7f5e` | 3.75 |
| `--tier-bronze` | `#96683c` | 4.21 |
| `--tier-silver` | `#7c848c` | 3.30 |
| `--tier-gold` | `#a5811a` | 3.18 |
| `--tier-mastery` | `#665a96` | 5.28 |

> These clear 3:1 as graphics and most do **not** clear 4.5:1 as text. A tier
> colour may fill a medal mark or draw a dot. It may never be the colour of a
> label, however small. Tier labels use `--ink-soft` beside a tier-coloured dot.
> See the milestone chip on the skill card.

### Per-skill colours

Skills must be tellable apart (the calendar draws a dot per skill) but a
rainbow would be the loudest thing in a single-colour palette. `skillColor()`
in `src/lib/ui/format.ts` generates inside the brand green band:

```
hue        128 + (seed % 35)            // a narrow drift, 128–162
lightness  0.44 + ((seed * 7) % 26)/100 // where the separation actually comes from
chroma     0.055                        // low, so the set reads as one family
```

If skills become hard to tell apart, widen the **lightness** spread. Never the
hue.

**A generated colour obeys the same law as `--accent`: light for fills, deep for
anything carrying text.** The band above runs to L0.69, which is right for a
calendar dot or a progress fill on cream and **cannot carry white text**. At
the top of the range white measures 2.70:1. For a solid fill with a label on it,
such as the selected skill chip in the log sheet:

```
skillColor(seed, { solid: true })

lightness  0.38 + ((seed * 7) % 11)/100  // a narrow dark band, 0.38–0.48
chroma     0.062                          // slightly higher, to keep skills
                                          // apart despite the compressed range
```

White clears 4.5:1 on that band for every seed and every hue in it, and 6.35:1
at the worst corner. This mattered: the chip previously used the default band, so
whether its label was readable depended on which seed a skill happened to be
given. `src/lib/ui/format.test.ts` walks 300 seeds and asserts both the contrast
and that the set stays distinguishable, because a runtime-generated colour is
invisible to the token audit that covers the hex values above.

### There is no red

The palette defines no red, no warning amber, no destructive colour. Any red on
screen therefore had to be hardcoded deliberately, and `philosophy.spec.ts`
walks the rendered DOM looking for it.

If a genuinely destructive action ever needs one (permanent account deletion)
add it then, consciously, and write down why.

### Light only

There is no `prefers-color-scheme: dark` block, and `:root` sets
`color-scheme: only light`. The client asked for a light app; a dark block would
have overridden the cream on most phones, which are the devices it is actually
demoed on. Two e2e tests assert the ground stays cream under **both** colour
schemes.

---

## 3. Typography Rules

Two faces, both self-hosted through `next/font`: no CDN request, no layout
shift, nothing to fetch at runtime.

### The faces

**Newsreader** carries titles, all numerals, and the voice.
A literary serif with a genuine optical-size axis (`opsz` 6–72, requested
explicitly in `layout.tsx` because `next/font` ships weight only by default).
A 34px total and a 12px caption are therefore *drawn* differently rather than
scaled from one master. It is what makes `330h` read like something recorded
rather than computed.

**Hanken Grotesk** carries UI and body.
A warm humanist sans with a large x-height, which is what keeps 11px nav labels
and 12.5px captions legible on a phone.

The fallback stacks after each face are genuine fallbacks, not the design. **If
Georgia appears on screen, the webfont failed to load**. It is a regression that
looks *almost* right, which is why `typefaces › the chosen faces are actually
applied` asserts the computed family rather than trusting the eye.

### The scale

Seven roles, not seven sizes. Each name states a job, so "what size is this" is
never a judgement call at the call site. Line height, tracking and weight travel
with the size, so `text-eyebrow` is a complete typographic decision, not a size
that still needs four more classes.

| Role | Size | Line | Tracking | Weight | Face | Used for |
|---|---|---|---|---|---|---|
| `text-eyebrow` | 11px | 1.2 | +0.08em | 600 | Hanken | Uppercase section labels |
| `text-caption` | 12.5px | 1.4 | - | 400 | Hanken | Metadata, hours under a plant |
| `text-body` | 15px | 1.55 | - | 400 | Hanken | Everything read |
| `text-lead` | 17px | 1.5 | - | 400 | Hanken | Sheet prompts, empty states |
| `text-title` | 20px | 1.25 | −0.01em | 600 | Newsreader | Card and section titles |
| `text-figure` | 26px | 1.1 | −0.015em | 500 | Newsreader | Totals, month figures |
| `text-hero` | 34px | 1.05 | −0.025em | 600 | Newsreader | The one figure per screen |

Body text is 15px rather than the browser's 16. Hanken's x-height is large
enough that 15 reads like 16 in a neutral face, and it buys back a line of room
on a phone.

### The rule that creates the hierarchy

> **At or above `text-title` (20px) it is the serif. Below it, it is the sans.**

That single boundary is why the hierarchy reads without much weight contrast.
Do not set a 15px paragraph in Newsreader, or a 34px figure in Hanken.

### Numerals

Numbers are this product's emotional payload, so they are always the serif:

```css
.numeral {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

`tabular-nums` is not cosmetic. The distance figure counts down while the plant
is being watered, and proportional digits would reflow the line on every frame.

### The italic is the product's voice

Newsreader's italic carries every line that reassures, and nothing else.

> *A quiet week. 2 hours, all Japanese. It still counts.*
>
> *Nothing recorded is just a day that went unrecorded.*

One class, `.voice`. Reserving one treatment for one job is what makes those
lines read as written by a person rather than emitted by an app, which is the
whole difference between this product and a tracker.

Note the split inside the weekly recap: the reassurance is italic, the factual
sentence beside it is not. That is the treatment doing its job: marking which
sentences are the product *speaking* rather than *reporting*.

**Never use `.voice` for UI copy**, button labels, or anything the user must act
on.

### Copy rules

- State what happened; never praise the person. "The Return: you came back
  after 34 days", not "Amazing work!"
- No guilt vocabulary, ever: *missed*, *broken*, *failed*, *behind*, *streak*,
  *don't lose*, *keep it up*. `philosophy.spec.ts` scans every page for these.
- Prefer specific to encouraging. "2 hours, all Japanese" beats "Great progress".
- A control says exactly what happens. "Record something" → "Recorded".
- Never diminish: no "only a sprout", no "just 2 hours". A unit test asserts the
  plant labels contain no *only* / *just* / *still*.

---

## 4. Component Stylings

### Card

The default container.

```css
background: var(--paper-raised);
border: 1px solid var(--line);
border-radius: 0;                  /* square, everywhere */
box-shadow: var(--shadow-1);
padding: 16px;                     /* 20px when the card is the page's subject */
```

Hover on pointer devices lifts it to `--shadow-2`. Never move it.

### Buttons

| Variant | Ground | Label | Radius |
|---|---|---|---|
| Primary | `--accent-deep` | white, 600 | 0 |
| Secondary | transparent, `1px --line` | `--ink` | 0 |
| Quiet | transparent | `--muted` → `--ink` on hover | 0 |

Every button carries `.tappable`: `scale(0.96)` on `:active` over 120ms. It is
the cheapest way to make a web app feel native and it costs one class.

### Chip

```css
border-radius: 0;
padding: 8px 12px;
font-size: var(--size-caption);
/* unselected */ background: var(--paper);   border: 1px solid var(--line);
/* selected   */ background: <skill colour>; color: #fff; border-color: transparent;
```

The milestone chip is the pattern to copy when a colour is not safe as text: a
`8px` dot in the tier colour, label in `--ink-soft`.

### Bottom sheet

```css
border-radius: 0;
background: var(--paper-raised);
border: 1px solid var(--line);
box-shadow: var(--shadow-2);
padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
```

Backdrop `--ink` at 25% with a 2px blur. A 40px grabber in `--line-strong` on
mobile only. On desktop it centres and rounds all four corners.

### Bottom navigation

Five items under 768px: Today, Growth, **+**, Calendar, Medals.

- The active marker is **one element that slides between tabs**
  (`layoutId="nav-pill-mobile"`), not one per tab that fades.
- Centre button: 56px, `--accent-deep`, white glyph, raised with
  `--shadow-accent-lift` and a 4px `--paper` ring. Its `+` rotates 45° into a
  close mark while the sheet is open, so the two states read as one object.
- Five is the ceiling before targets get too narrow to hit. Anything more goes
  inside a screen, not into the bar.

### Plant

Seven stages, mapped **solely** from the highest milestone tier reached:

```
none → seed          FIRST_STEPS → sprout     FOUNDATION → sapling
BRONZE → young tree  SILVER → flowering       GOLD → fruiting
MASTERY → grand tree
```

- Tinted with that skill's generated green.
- Soil width scales with the stage. A seedling in a wide bed looks lost; a
  grand tree in a narrow one looks potted.
- Idle sway: 7s, offset per index (`--sway-delay`), amplitude **falling** as the
  plant grows (`--sway-amp`: sprout 1.5°, grand tree 0.5°). That is how it works
  outside, and it is what stops a row reading as one sprite repeated.
### Rest, and the four ambient layers

The garden answers to time. It never answers to how often you show up.

| Layer | Driven by | What it does |
|---|---|---|
| **Rest** | Days since the skill was last logged | `active` under 14 days, `settling` to 20, `resting` at 21+. A resting plant is cooler, softer and almost still. |
| **Season** | The calendar month | Spring blossom, summer green, autumn ochre with falling leaves, winter frost. |
| **Soil** | Cumulative experience count | Bare, then moss at 25, then rich earth with leaf litter at 100. Only ever enriches. |
| **Companion** | Highest tier reached | Bee at Bronze, bird at Silver, butterfly at Gold. Arrive and never leave. |
| **Light** | The user's local hour | Dawn, day, dusk, night. Applied to the bed, with fireflies after dark. |

> **The rule that governs all of it: rest may change tint and motion, nothing
> else.** Never the stage, never the size, never the soil, never the vocabulary.
> There is no state in which a plant looks worse than the day you left it, only
> one in which it looks asleep.

Two specifics that were got wrong first and are worth not repeating:

- **Desaturate toward a cool grey, never a warm one.** Mixing green toward
  `--line` makes olive, and the plant reads as dried out rather than dormant.
  Warm desaturation reads as dying; cool reads as sleeping.
- **Rest is never thirst.** There is no prompt, no debt, and nothing that asks
  to be watered. Resting is a description of time, not a request. `resting`
  begins at exactly the `the-return` threshold, so a plant wakes in the same
  moment the badge for coming back is earned.

- **A plant's stage is its tier and nothing else**, so no code path can wilt
  one.

### Progress bar (the goal gradient)

The strongest habit mechanic in the product, so it is not decoration.

```
track: 8px, --line, fully rounded
fill:  the skill's colour, min-width 3% so a new skill still reads as started
```

Beneath it, the *remaining distance* (`67.5h to Elementary`) with the figure in
`--accent-deep`, label in `--muted`. It is the only coloured text on the card:
the total above is evidence, this is the pull.

### Medal

**One medal family for everything the app awards.** Skill milestones and the
twelve global badges are the same object, differing only in what sits in the
field. There must never be a second visual language for an award; there was
once, and the shelf read as a bag of stickers.

Anatomy, drawn at a 64-unit viewBox with the disc at (32, 40):

```
   ╱╲╱╲     ribbon: two straps, the far one a shade darker. That single
  ╱ ╱╲ ╲    difference is what stops it reading as a flat V.
  ┌────┐    rim: solid edge metal, with knurling drawn as a dashed stroke
 │┌────┐│   field: face metal, one step lighter than the rim
 ││ ◆  ││   slot: the tier star, or a badge symbol on a 24px grid
 │└────┘│   recess: a darker hairline, so the field reads as stamped in
  └────┘    gleam: a highlight arc, upper left
```

- **Rank is metal, ribbon and star points. Never size.** A Gold is exactly as
  big as a Bronze, because nobody's first should look small beside someone's
  fifth.
- **Badge metal encodes rarity**, reusing the tier palette rather than a second
  one: pale for the badges everyone gets on day one, gold for a hundred hours
  and a year of history, violet for the one you cannot chase.
- **Unearned keeps the full silhouette** in `--line` and loses only its metal,
  so the shelf shows the shape of what is still out there. Titles become
  `? ? ?` where the badge is meant to be a surprise. Never a dashed outline,
  which reads as a broken element rather than an empty slot.
- Below about 20px, pass `ribbon={false}`: the straps turn into two dark specks
  and the medal stops reading as a medal.

### The shelf

Medals **hang from a rail**, they do not sit in boxes. A grid of bordered cards
is a list of records; medals hooked over a rail is a thing you own, and the
whole product rests on the difference between those two feelings.

- The rail is drawn per tile and bleeds wider than the grid gap, so neighbouring
  rails overlap into one continuous bar. Exact abutment leaves a hairline at
  most fractional widths, and a broken rail reads as a rendering fault.
- A soft gradient directly under the rail is the shadow it casts. It is what
  makes the rail read as an object rather than a border.
- Tiles have no box. Height is held even by clamping the title and the
  description to two lines each.
- At rest each medal swings a half degree on a nine-second cycle, staggered.
  Touch or hover and it swings properly, then settles. See §7 for why this is
  the one looping motion the product allows.

---

## 5. Layout Principles

- **Content column** `max-width: 48rem`, `padding-inline: 1rem`. Prose inside it
  stays near 65 characters.
- **Vertical rhythm** 24px between sections, 12px within one. Card padding 16px,
  or 20px when the card is the page's subject.
- **Page padding** 16px top; bottom 112px under 768px (nav bar plus safe area),
  40px above.
- **Desktop offset** content is inset 240px for the sidebar.
- **One figure per screen.** Each screen answers one question with one number in
  `text-hero`; everything else is support. A screen with two hero figures has
  none.
- **Summary before detail.** This is a UI that gets scanned, not a document that
  gets read. The answer sits above the evidence, always.

---

## 6. Depth & Elevation

Three levels. There is no fourth.

| Level | Token | What sits here |
|---|---|---|
| 0 | - | The page ground |
| 1 | `--shadow-1` | Cards, list items |
| 2 | `--shadow-2` | Sheets, dialogs, the medal moment |
| - | `--shadow-accent-lift` | The centre button, and only that |

```css
--shadow-1: 0 1px 2px rgb(94 74 40 / .06), 0 2px 6px rgb(94 74 40 / .05);
--shadow-2: 0 2px 6px rgb(94 74 40 / .08), 0 8px 20px rgb(94 74 40 / .09);
--shadow-accent-lift: 0 4px 10px rgb(48 82 56 / .22), 0 10px 26px rgb(48 82 56 / .16);
```

**Shadows are warm-tinted, never neutral grey.** Grey on cream reads as dirt.
The centre button's shadow is tinted with the green rather than the ground, so it
casts a shadow of its own colour.

Shape: **square, everywhere**. The palette is print, not app, so corners are
square and grouping comes from hairlines and space. Circles are reserved for
things that are genuinely circular: indicator dots, circular icon buttons, and
the centre record button. If a new component reaches for a border radius,
delete the class instead.

---

## 7. Do's and Don'ts

### The motion rule

> **Motion only ever moves in the direction of growth.**
>
> Nothing animates downward, drains, wilts or empties, with two exceptions: a UI element
> being dismissed, and the one figure that counts *down* because a smaller
> remaining distance is good news. There is deliberately no shrink, decay or
> fade-to-nothing preset in `src/lib/ui/motion.ts`: a product whose premise is
> that a slow month still counts must not own an animation that can express
> loss.

### Watering is a reward, never a chore

The single most important rule in this file, because the obvious version of the
feature would quietly destroy the product.

In every farming game, watering is an *obligation*: the plant gets thirsty, you
owe it water, you feel bad when you don't. **That is a streak wearing a
costume.** LifeXP therefore has:

- no thirsty state
- no "needs water" prompt
- nothing anywhere that asks to be watered

Watering happens **only** as a consequence of the user recording something. It
is what logging *looks like*. The plant is watered, and if the entry crossed a
milestone it grows a stage while the water is still on it, so the water is
visibly the cause.

### Do

- Reward at the instant of effort. The distance figure dropping the moment
  something is logged is worth more than any summary screen.
- Give a screen one orchestrated moment and keep everything around it still.
- Let a quiet week read well. "A quiet week. 2 hours, all Japanese. It still
  counts."
- Measure contrast against **every ground the text can sit on**, including chip
  tints. Never eyeball it.
- Encode state in form as well as number (a chip, a stage, a fill) so a screen
  reads at a glance.

### Don't

- **No streaks.** No consecutive-day counter exists in the schema and none may
  be added. This is the product's entire differentiation.
- **No leaderboards or ranks.** Social, when it lands, is invite-only cheers.
- **No plant may wilt, brown or die.**
- **No red**, and no other failure colour.
- **No punitive copy** (see §3).
- **No `--accent` as or behind text. No tier colour as a text colour.**
- No parallax, no scroll-triggered reveals, no animated skeletons or shimmer.
- No looping attention-seekers **except ambient life**: the plants sway and the
  medals hang. Both are slow, sub-degree, staggered, and attached to objects
  that would move in the real world. The test is whether the motion is asking
  for something. A swaying plant is not; a pulsing log button is, and a pulse
  that says *log something* is a nag. No pulsing log button, no bouncing CTA. A pulse
  that says *log something* is a nag, and nags are streak-logic.
- No emoji as section markers; no `01 / 02 / 03` eyebrows unless the content
  genuinely is a sequence.

### Motion inventory

| Moment | Treatment | Built with |
|---|---|---|
| Any tap | `scale(0.96)`, 120ms | CSS |
| Plant idle | 7s sway, amplitude by stage | CSS |
| Route change | Screen fades in, 220ms (opacity only: a transform here would repin every fixed element to the document) | CSS (`app/template.tsx`) |
| Card entry | Cards rise 10px, lists stagger to 200ms | CSS |
| Garden entry | Plants grow from the soil line, 60ms stagger, 400ms | CSS |
| Sheet open | Springs up 28px, backdrop blurs in | `motion` |
| Sheet close | Springs back down 24px, backdrop fades | `motion` (`AnimatePresence`) |
| Sheet mode | Quick/chat/form panels slide in the travel direction | `motion` |
| Skill picked | Duration presets stagger in, 30ms | CSS |
| Calendar month | Grid slides in from the direction travelled | `motion` |
| Day selected | Day panel cross-fades | `motion` |
| Nav change | Active pill slides between tabs | `motion` `layoutId` |
| Day selected | Ink pill travels to the tapped day | `motion` `layoutId` |
| Centre button | `+` rotates 45° into a close mark | CSS |
| **Log saved** | **Can tips, 6 droplets fall, soil darkens, plant squash-stretches** | CSS |
| Tier crossed | Plant cross-fades to the next stage *during* the squash | CSS |
| Distance drops | Figure counts down over 900ms | rAF |
| Medal earned | Card pops in with overshoot, one shine pass, fluttering confetti | CSS + canvas |

The medal's gleam is the **only** thing in the app that catches the light. Metal
is the one material in this palette that should, and keeping it to one place is
what makes it read as an event rather than a texture.

`motion` is reached for **only** where CSS genuinely cannot go: shared-element
transitions, animating a *number* (text content, not a style), and exit
animations `AnimatePresence` has to await. Keeping that boundary explicit is
what stops the bundle growing a physics engine to fade a card in.

Two deliberate simplifications, both worth knowing before "improving" them:

- **The watering renders inside the confirmation, not over the garden.** Logging
  works from every screen; the garden only exists on `/today`. One placement
  means the same moment everywhere, no cross-tree coordination, nothing to
  scroll into view.
- **The garden's grow-in replays on every visit** rather than once per session.
  A once-per-session flag has to survive SSR, and a wrong guess on the server
  means either a hydration mismatch or a flash of the settled state. A 400ms
  animation that always runs beats a 700ms one that occasionally glitches.

Everything sits behind `prefers-reduced-motion: reduce`, which collapses every
duration globally. Imperative animations additionally check the query themselves
and do not start at all. An e2e test asserts the watering, the grow-in and the
sway are all silenced.

### The landing page exception

The public landing page runs under a wider motion budget than the app, because
its job is different: it has seconds to explain a product a visitor has never
met. There, and only there:

- **Scroll-triggered reveals are allowed.** Sections rise once as they enter,
  via `components/landing/reveal.tsx`. Below-fold only; the hero never hides
  waiting for JS, and reduced-motion visitors get the settled page.
- **One looping demo is allowed.** The phone demo replays the quick-log flow
  while it is on screen and stops when it is not.
- **The hero is interactive, not ambient.** The garden demo is the real
  components wired to local state; it moves on tap, plays one scripted
  watering on arrival, and never nags.

Everything else in this file still applies there: growth-only direction, no
red, no punitive copy, transform/opacity only, and the reduced-motion collapse.
The signed-in app gains route transitions (`app/template.tsx`), staggered list
entrances, and the sheet's exit animation, and nothing more.

---

## 8. Responsive Behavior

One breakpoint: **768px**. There is no tablet-specific layout.

| | Under 768px | 768px and up |
|---|---|---|
| Navigation | Fixed bottom bar, 5 items, raised centre button | Left sidebar, 240px, add button promoted to top |
| Content | Full width, 16px gutters | Centred, 48rem, inset 240px left |
| Log sheet | Bottom sheet with a grabber | Centred dialog, all corners rounded |
| Bottom padding | 112px | 40px |
| Garden | Horizontal scroll, 80px per plant, so four fit across a phone | Same, rarely scrolls |

Mobile is the primary target, not the fallback. Every interaction must be
reachable with one thumb, and the centre button sits where the thumb already
rests. `env(safe-area-inset-bottom)` is respected on `body` and every fixed
element.

### The small things that decide whether it feels native

Each of these is one or two lines and each is load-bearing. They are listed
because they are exactly what gets dropped, and their absence is felt without
being noticed.

| Detail | Why |
|---|---|
| `-webkit-tap-highlight-color: transparent` | Kills the grey flash iOS paints over any tapped element. The single most obvious tell that a thing is a website. Feedback is not lost: `.tappable` already depresses. |
| **Form controls ≥ 16px under 768px** | iOS Safari zooms the whole page when a smaller field takes focus. Every control here was 14px, so the most common interaction in the app ended in a lurch. |
| `inputMode` on numeric fields | `decimal` for hours, `numeric` for intervals. A number pad instead of a full keyboard. |
| `enterKeyHint="send"` | The mobile return key says Send rather than Go. |
| `overscroll-behavior: contain` on the sheet | Stops a flick inside the sheet chaining to the page behind it once it hits the end. |
| `max-height: 88svh` on the sheet | `svh`, not `vh`: `vh` ignores the mobile URL bar and the sheet ends up taller than the screen. |
| `text-wrap: balance` on headings | No heading leaves one word alone on the last line. |
| `text-wrap: pretty` on body | No paragraph ends in an orphan. |
| `font-variant-numeric: tabular-nums` | A counting figure would otherwise reflow on every frame. |
| `::selection` in `--accent-soft` | Selecting text should not reveal the browser's blue. |
| `title` on every medal | The description clamps to two lines; the full text is still reachable. |

---

## 9. Agent Prompt Guide

Paste-ready prompts. Attach this file alongside each one.

### A new screen

> Build a LifeXP screen for `<purpose>` following the attached DESIGN.md. Warm
> cream ground (`--paper`), cards in `--paper-raised` with a `--line` border and
> square corners. Newsreader for titles at 20px and above and for every number;
> Hanken Grotesk below that. Give the screen exactly one hero figure
> (`text-hero`, tabular numerals) answering its single question, with supporting
> values in `text-caption`. Green `--accent` for fills only; `--accent-deep` for
> anything carrying text. No red, no week-on-week comparison charts, no streak
> or consecutive-day language. Mobile first: 48rem column, 16px gutters, 112px
> bottom padding to clear the nav bar.

### A new component

> Create `<component>` for LifeXP per the attached DESIGN.md. Use the card
> recipe (paper-raised, 1px `--line`, square corners, `--shadow-1`, 16px padding).
> Every tappable element gets `.tappable`. Encode state in form as well as
> number. Verify each text colour clears 4.5:1 against every ground it can sit
> on, `--paper`, `--paper-raised`, `--accent-soft` and `--medal-soft`.
> `--accent` and the tier colours are decorative and must never carry text.

### Copy

> Write the copy for `<surface>` in LifeXP's voice per DESIGN.md §3. State what
> happened; never praise the person. No guilt vocabulary: nothing may imply the
> user missed, broke, lost or fell behind. A quiet period must read as
> acceptable, not as a problem to fix. Reassurance lines get `.voice`
> (Newsreader italic); everything actionable stays in Hanken.

### Motion

> Add motion to `<surface>` per DESIGN.md §7. Governing rule: motion only moves
> in the direction of growth: nothing shrinks, drains or wilts. Prefer CSS;
> reach for `motion` only for shared-element transitions or for animating a
> number. Give the surface one orchestrated moment and keep the rest still. No
> parallax, no scroll reveals, no looping attention-seekers. Honour
> `prefers-reduced-motion` in CSS *and* by not starting imperative animations.

### Reviewing existing work

> Audit `<file>` against the attached DESIGN.md. Check specifically for:
> `--accent` or a tier colour used as a text colour; text measured only against
> the papers and not against the chip tints; any red; any streak or
> consecutive-day language; punitive copy; more than one hero figure on a
> screen; a serif below 20px or a sans above it; motion that shrinks or fades
> something to nothing; a fixed element ignoring the safe area.

---

## Related

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the app is built
- [`docs/DECISIONS.md`](docs/DECISIONS.md) for why, including the palette,
  typography and motion decisions
- [`src/app/globals.css`](src/app/globals.css) for the tokens themselves, which
  are the real source of truth
- [`e2e/philosophy.spec.ts`](e2e/philosophy.spec.ts) for the rules in this file
  that are enforced rather than merely written down
