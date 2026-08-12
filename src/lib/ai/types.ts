import { z } from "zod";

/**
 * The provider boundary.
 *
 * Everything above this line (the chat route, the confirm card) is written
 * against `ExtractionProvider` and knows nothing about any vendor. Everything
 * below it is a swappable adapter. Adding a provider means adding one file.
 */

export const experienceDraftSchema = z.object({
  /** Short, human phrasing: "Japanese class", not "user attended a class". */
  title: z.string().min(1).max(120),
  /** Null when the user genuinely didn't say. Never guessed. */
  minutes: z.number().int().min(0).max(24 * 60).nullable(),
  /** YYYY-MM-DD. */
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Skill names, matched to existing ones where possible. */
  skills: z.array(z.string().min(1).max(60)).max(4),
  notes: z.string().max(500).nullable(),
  /** 0–1. Drives whether the confirm card opens pre-expanded for editing. */
  confidence: z.number().min(0).max(1),
});

export const extractionResultSchema = z.object({
  items: z.array(experienceDraftSchema).max(10),
  /**
   * A question to ask when nothing could be extracted, or something was
   * genuinely ambiguous. Null when the drafts speak for themselves.
   */
  clarification: z.string().max(300).nullable().optional(),
});

export type ExperienceDraft = z.infer<typeof experienceDraftSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export type ExtractionInput = {
  text: string;
  /** Today's date in the user's timezone, YYYY-MM-DD. */
  today: string;
  timezone: string;
  existingSkills: { id: string; name: string }[];
};

export interface ExtractionProvider {
  /** Shown in Settings so the user can see what is actually running. */
  readonly name: string;
  /** True when this provider needs no network and no key. */
  readonly isLocal: boolean;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

/**
 * JSON Schema mirror of `extractionResultSchema`, for providers that constrain
 * output server-side. Kept adjacent to the Zod schema so the two are edited
 * together; the Zod parse is still the last word, because a provider can always
 * return something the schema didn't catch.
 */
export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short human phrasing of what was done" },
          minutes: {
            type: ["integer", "null"],
            description: "Duration in minutes, or null if not stated",
          },
          occurredAt: {
            type: "string",
            description: "Date it happened, YYYY-MM-DD",
          },
          skills: {
            type: "array",
            items: { type: "string" },
            description: "Skill names this contributes to",
          },
          notes: { type: ["string", "null"] },
          confidence: { type: "number", description: "0 to 1" },
        },
        required: ["title", "minutes", "occurredAt", "skills", "notes", "confidence"],
        additionalProperties: false,
      },
    },
    clarification: {
      type: ["string", "null"],
      description: "A question to ask when nothing could be extracted",
    },
  },
  required: ["items", "clarification"],
  additionalProperties: false,
} as const;
