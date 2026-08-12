import { describe, expect, it } from "vitest";
import { RulesExtractionProvider } from "./rules";

const TODAY = "2026-08-12"; // a Wednesday
const provider = new RulesExtractionProvider();

const SKILLS = [
  { id: "s1", name: "Japanese" },
  { id: "s2", name: "Piano" },
  { id: "s3", name: "Running" },
  { id: "s4", name: "Reading" },
];

function extract(text: string, existingSkills = SKILLS) {
  return provider.extract({
    text,
    today: TODAY,
    timezone: "UTC",
    existingSkills,
  });
}

describe("rule-based extraction", () => {
  it("handles the PRD's own example", async () => {
    const { items } = await extract("Went to Japanese class for 90 minutes today.");

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      minutes: 90,
      occurredAt: TODAY,
      skills: ["Japanese"],
    });
    // The title should be a label, not the sentence back again.
    expect(items[0].title).toBe("Japanese class");
    expect(items[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  describe("durations", () => {
    const cases: Array<[string, number | null]> = [
      ["Japanese for 90 minutes", 90],
      ["Japanese for 45 min", 45],
      ["Japanese for 1.5 hours", 90],
      ["Japanese for 2 hrs", 120],
      ["Japanese for 1h30", 90],
      ["Piano for half an hour", 30],
      ["Piano for an hour", 60],
      ["Piano for an hour and a half", 90],
      ["Climbing for two hours", 120],
      ["Climbing for a couple of hours", 120],
      ["Meditation for twenty minutes", 20],
      ["Japanese for three and a half hours", 210],
      // Nothing stated: must stay null rather than being guessed.
      ["Japanese class", null],
      ["Read 40 pages before bed", null],
    ];

    for (const [text, expected] of cases) {
      it(`${text} -> ${expected ?? "no duration"}`, async () => {
        const { items } = await extract(text);
        expect(items[0]?.minutes).toBe(expected);
      });
    }

    it("never invents a duration from a page count", async () => {
      const { items } = await extract("Read 40 pages");
      expect(items[0].minutes).toBeNull();
    });
  });

  describe("dates", () => {
    it("defaults to today", async () => {
      const { items } = await extract("Piano practice");
      expect(items[0].occurredAt).toBe(TODAY);
    });

    it("resolves yesterday", async () => {
      const { items } = await extract("Piano practice yesterday");
      expect(items[0].occurredAt).toBe("2026-08-11");
    });

    it("resolves 'last night' to yesterday", async () => {
      const { items } = await extract("Piano practice last night");
      expect(items[0].occurredAt).toBe("2026-08-11");
    });

    it("resolves N days ago", async () => {
      const { items } = await extract("Piano practice 5 days ago");
      expect(items[0].occurredAt).toBe("2026-08-07");
    });

    it("resolves a weekday to the most recent one that has passed", async () => {
      // 2026-08-12 is a Wednesday, so Tuesday was the day before.
      const { items } = await extract("Climbing on tuesday");
      expect(items[0].occurredAt).toBe("2026-08-11");
    });

    it("treats a weekday matching today as a week ago, not today", async () => {
      const { items } = await extract("Climbing on wednesday");
      expect(items[0].occurredAt).toBe("2026-08-05");
    });
  });

  describe("skills", () => {
    it("matches an existing skill by name", async () => {
      const { items } = await extract("Japanese study for 1h");
      expect(items[0].skills).toEqual(["Japanese"]);
    });

    it("maps a verb onto the user's existing practice name", async () => {
      // "run" should find their "Running" skill, not propose a new "Run".
      const { items } = await extract("Morning run for 35 mins");
      expect(items[0].skills).toEqual(["Running"]);
    });

    it("proposes a practice name, not a verb, for a new skill", async () => {
      const { items } = await extract("Read 40 pages before bed", []);
      expect(items[0].skills).toEqual(["Reading"]);
    });

    it("proposes a sensible new skill from a keyword", async () => {
      const { items } = await extract("Went climbing with friends for two hours", []);
      expect(items[0].skills).toEqual(["Climbing"]);
    });

    it("is less confident when it had to guess the skill", async () => {
      const known = await extract("Japanese study for 1h");
      const guessed = await extract("Went climbing for two hours", []);
      expect(guessed.items[0].confidence).toBeLessThan(known.items[0].confidence);
    });
  });

  describe("refusing to invent", () => {
    const nonEvents = [
      "I should practise piano tomorrow",
      "I want to learn Japanese",
      "How many hours have I done?",
      "I'm going to the gym later",
    ];

    for (const text of nonEvents) {
      it(`declines: "${text}"`, async () => {
        const { items, clarification } = await extract(text);
        expect(items).toHaveLength(0);
        expect(clarification).toBeTruthy();
      });
    }

    it("asks rather than guessing when the message is empty", async () => {
      const { items, clarification } = await extract("hi");
      expect(items).toHaveLength(0);
      expect(clarification).toBeTruthy();
    });
  });

  it("splits a message containing two activities", async () => {
    const { items } = await extract(
      "morning run 35 mins and then japanese study for 1h",
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ minutes: 35, skills: ["Running"] });
    expect(items[1]).toMatchObject({ minutes: 60, skills: ["Japanese"] });
  });

  it("flags when it could not attribute a skill", async () => {
    const { items, clarification } = await extract("Did the thing for 20 minutes", []);
    expect(items[0].skills).toEqual([]);
    expect(clarification).toMatch(/skill/i);
  });
});
