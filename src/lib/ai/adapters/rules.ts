import { TEMPLATES } from "@/lib/progress/milestones";
import type {
  ExtractionInput,
  ExtractionProvider,
  ExtractionResult,
  ExperienceDraft,
} from "../types";

/**
 * The no-key extractor.
 *
 * This is not a stub. It is the reason the whole product can be demoed on a
 * laptop with no account, no key and no network, which matters a great deal
 * for the user interviews the PRD asks for, and for local development.
 *
 * It is deliberately conservative: it will decline to extract rather than
 * invent, exactly like the model-backed adapters are instructed to.
 */

const DURATION_PATTERNS: Array<{ re: RegExp; minutes: (m: RegExpMatchArray) => number }> = [
  // "1.5 hours", "2 hrs", "an hour and a half"
  {
    re: /(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i,
    minutes: (m) => Math.round(parseFloat(m[1].replace(",", ".")) * 60),
  },
  // "90 minutes", "45 min", "20m"
  {
    re: /(\d+)\s*(?:m|min|mins|minute|minutes)\b/i,
    minutes: (m) => parseInt(m[1], 10),
  },
  // "1h30", "2h15"
  {
    re: /(\d+)\s*h\s*(\d{1,2})\b/i,
    minutes: (m) => parseInt(m[1], 10) * 60 + parseInt(m[2], 10),
  },
];

/** Spelled-out counts, so "two hours" parses as readily as "2 hours". */
const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fortyfive: 45,
  "forty-five": 45,
  sixty: 60,
  ninety: 90,
};

const NUMBER_WORD_RE = Object.keys(NUMBER_WORDS).join("|");

// Ordered: the most specific phrasings first, so "an hour and a half" is not
// consumed by the plain "an hour" rule.
const WORD_DURATIONS: Array<{ re: RegExp; minutes: (m: RegExpMatchArray) => number }> = [
  { re: /\ban hour and a half\b/i, minutes: () => 90 },
  { re: /\bhalf an hour\b|\bhalf[- ]hour\b/i, minutes: () => 30 },
  { re: /\ba couple of hours\b/i, minutes: () => 120 },
  {
    re: new RegExp(`\\b(${NUMBER_WORD_RE})\\s*(?:and a half\\s*)?hours?\\b`, "i"),
    minutes: (m) => {
      const base = NUMBER_WORDS[m[1].toLowerCase()] * 60;
      return /and a half/i.test(m[0]) ? base + 30 : base;
    },
  },
  {
    re: new RegExp(`\\b(${NUMBER_WORD_RE})\\s*(?:min|mins|minutes)\\b`, "i"),
    minutes: (m) => NUMBER_WORDS[m[1].toLowerCase()],
  },
  { re: /\ban hour\b|\ba full hour\b/i, minutes: () => 60 },
  { re: /\ball morning\b|\ball afternoon\b/i, minutes: () => 180 },
];

/**
 * Keyword -> the name a skill should actually get.
 *
 * Without this, "read 40 pages" creates a skill called "Read" and "morning run"
 * creates nothing at all, because the raw keyword is a verb rather than the
 * name of a practice.
 */
const CANONICAL_SKILL_NAME: Record<string, string> = {
  read: "Reading",
  reading: "Reading",
  books: "Reading",
  run: "Running",
  running: "Running",
  ran: "Running",
  jog: "Running",
  gym: "Gym",
  lift: "Gym",
  swim: "Swimming",
  swimming: "Swimming",
  cycle: "Cycling",
  cycling: "Cycling",
  meditate: "Meditation",
  meditation: "Meditation",
  ski: "Skiing",
  skiing: "Skiing",
  climb: "Climbing",
  climbing: "Climbing",
  code: "Coding",
  coding: "Coding",
  draw: "Drawing",
  drawing: "Drawing",
  write: "Writing",
  writing: "Writing",
  cook: "Cooking",
  cooking: "Cooking",
  speak: "Public speaking",
  speaking: "Public speaking",
  journal: "Journaling",
  journaling: "Journaling",
};

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Words that mean "this did not happen", an intent, not a record. */
const NON_EVENT = [
  /\bi (?:should|need to|want to|will|plan to|might|hope to)\b/i,
  /\bgoing to\b/i,
  /\btomorrow\b/i,
  /\bhow (?:do|can|much|many)\b/i,
  /\bwhat (?:is|are|should)\b/i,
  /\?\s*$/,
];

function usable(value: number): number | null {
  return Number.isFinite(value) && value > 0 && value <= 24 * 60 ? value : null;
}

function parseDuration(text: string): number | null {
  // "1h30" must be tried before the plain-hours pattern, or "1h30" reads as 1h.
  const ordered = [DURATION_PATTERNS[2], DURATION_PATTERNS[0], DURATION_PATTERNS[1]];
  for (const { re, minutes } of ordered) {
    const match = text.match(re);
    if (match) {
      const value = usable(minutes(match));
      if (value !== null) return value;
    }
  }

  for (const { re, minutes } of WORD_DURATIONS) {
    const match = text.match(re);
    if (match) {
      const value = usable(minutes(match));
      if (value !== null) return value;
    }
  }

  return null;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Resolves relative day references against the caller-supplied "today". */
function parseDate(text: string, today: string): { date: string; explicit: boolean } {
  const base = new Date(`${today}T12:00:00.000Z`);
  const lower = text.toLowerCase();

  if (/\byesterday\b|\blast night\b/.test(lower)) {
    return { date: toIsoDate(new Date(base.getTime() - 86_400_000)), explicit: true };
  }
  if (/\btoday\b|\bthis morning\b|\bthis afternoon\b|\btonight\b|\bthis evening\b/.test(lower)) {
    return { date: today, explicit: true };
  }

  const daysAgo = lower.match(/\b(\d+)\s*days?\s*ago\b/);
  if (daysAgo) {
    const n = parseInt(daysAgo[1], 10);
    return {
      date: toIsoDate(new Date(base.getTime() - n * 86_400_000)),
      explicit: true,
    };
  }

  const weeksAgo = lower.match(/\b(?:a|(\d+))\s*weeks?\s*ago\b/);
  if (weeksAgo) {
    const n = weeksAgo[1] ? parseInt(weeksAgo[1], 10) : 1;
    return {
      date: toIsoDate(new Date(base.getTime() - n * 7 * 86_400_000)),
      explicit: true,
    };
  }

  // "on tuesday", "last friday", the most recent one that has passed.
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (new RegExp(`\\b(?:last |on )?${WEEKDAYS[i]}\\b`).test(lower)) {
      const todayDow = base.getUTCDay();
      let delta = todayDow - i;
      if (delta <= 0) delta += 7;
      return {
        date: toIsoDate(new Date(base.getTime() - delta * 86_400_000)),
        explicit: true,
      };
    }
  }

  return { date: today, explicit: false };
}

/**
 * Matches against the user's own skills first, then the template keyword lists.
 * Never invents a skill name out of thin air.
 */
function matchSkills(
  text: string,
  existing: { id: string; name: string }[],
): { names: string[]; certain: boolean } {
  const lower = text.toLowerCase();
  const names: string[] = [];

  for (const skill of existing) {
    const needle = skill.name.toLowerCase();
    if (needle.length >= 3 && lower.includes(needle)) names.push(skill.name);
  }
  if (names.length > 0) return { names, certain: true };

  // A verb the user wrote ("run", "read") often names a skill they already
  // track under its practice name ("Running", "Reading"). Check that before
  // proposing anything new.
  for (const [keyword, canonical] of Object.entries(CANONICAL_SKILL_NAME)) {
    if (!new RegExp(`\\b${keyword}\\b`, "i").test(lower)) continue;

    const owned = existing.find(
      (skill) => skill.name.toLowerCase() === canonical.toLowerCase(),
    );
    if (owned) return { names: [owned.name], certain: true };

    return { names: [canonical], certain: false };
  }

  // Nothing of theirs matched, fall back to well-known activity keywords.
  for (const template of TEMPLATES) {
    for (const keyword of template.match) {
      if (keyword.length >= 4 && new RegExp(`\\b${keyword}`, "i").test(lower)) {
        const canonical =
          CANONICAL_SKILL_NAME[keyword] ??
          keyword[0].toUpperCase() + keyword.slice(1);
        return { names: [canonical], certain: false };
      }
    }
  }

  return { names: [], certain: false };
}

/**
 * Strips the parts already captured as structured fields, so the title reads
 * like a label rather than a repeat of the sentence: "Went to Japanese class
 * for 90 minutes today." becomes "Japanese class".
 */
function buildTitle(text: string): string {
  const weekdayAlternation = WEEKDAYS.join("|");

  let title = text
    // Leading filler, with or without a pronoun.
    .replace(
      // "read" is deliberately absent: "Read 40 pages" is a better title than
      // "40 pages", so the verb earns its place there.
      /^\s*(?:i|we)?\s*(?:just\s+)?(?:did|went to|went|had|spent|finished|started|got|attended)\b\s*/i,
      "",
    )
    // Time references, already captured as occurredAt.
    .replace(
      /\b(?:today|yesterday|this morning|this afternoon|tonight|this evening|last night)\b/gi,
      "",
    )
    .replace(new RegExp(`\\b(?:last |on )?(?:${weekdayAlternation})\\b`, "gi"), "")
    .replace(/\b\d+\s*(?:days?|weeks?)\s*ago\b/gi, "")
    // Durations, already captured as minutes.
    .replace(
      new RegExp(
        `\\b(?:for\\s+)?(?:\\d+(?:[.,]\\d+)?|${NUMBER_WORD_RE}|an|a)\\s*(?:and a half\\s*)?(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\\b`,
        "gi",
      ),
      "",
    )
    .replace(/\bfor\s+half an hour\b|\bhalf an hour\b|\bhalf[- ]hour\b/gi, "")
    .replace(/\ba couple of hours\b/gi, "")
    .replace(/\bfor\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    // Trailing and leading punctuation left behind by the removals above.
    .replace(/^[\s,;:.–-]+|[\s,;:.–-]+$/g, "")
    .trim();

  // If stripping ate the whole thing, the original is better than nothing.
  if (title.length < 2) title = text.trim().replace(/[.\s]+$/, "");
  if (title.length > 120) title = `${title.slice(0, 117).trimEnd()}…`;

  return title.charAt(0).toUpperCase() + title.slice(1);
}

export class RulesExtractionProvider implements ExtractionProvider {
  readonly name = "Rule-based (no API key)";
  readonly isLocal = true;

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const text = input.text.trim();

    if (text.length < 3) {
      return {
        items: [],
        clarification: "Tell me what you did and I'll record it.",
      };
    }

    if (NON_EVENT.some((re) => re.test(text))) {
      return {
        items: [],
        clarification:
          "That sounds like a plan rather than something you've done. Tell me once you have, and I'll log it.",
      };
    }

    // Split on sentence enders and " and then ", so one message can hold two
    // activities without them being merged into a single mangled record.
    const segments = text
      .split(/(?:[.;]|\band then\b|\balso\b)\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    const items: ExperienceDraft[] = [];

    for (const segment of segments.length > 0 ? segments : [text]) {
      const minutes = parseDuration(segment) ?? parseDuration(text);
      const { date, explicit } = parseDate(`${segment} ${text}`, input.today);
      const { names, certain } = matchSkills(segment, input.existingSkills);

      // Confidence is honest rather than flattering: the card opens in edit
      // mode below 0.6, which is exactly what we want when we guessed a skill.
      let confidence = 0.5;
      if (minutes !== null) confidence += 0.2;
      if (explicit) confidence += 0.1;
      if (certain) confidence += 0.2;
      else if (names.length > 0) confidence -= 0.05;
      else confidence -= 0.15;

      items.push({
        title: buildTitle(segment),
        minutes,
        occurredAt: date,
        skills: names,
        notes: null,
        confidence: Math.min(Math.max(Number(confidence.toFixed(2)), 0), 1),
      });
    }

    if (items.length === 0) {
      return {
        items: [],
        clarification: "I couldn't make that out. What did you do, and for how long?",
      };
    }

    const needsSkill = items.some((item) => item.skills.length === 0);

    return {
      items,
      clarification: needsSkill
        ? "I couldn't tell which skill this belongs to, pick one below."
        : null,
    };
  }
}
