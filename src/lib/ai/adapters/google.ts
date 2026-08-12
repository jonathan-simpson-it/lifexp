import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import {
  extractionResultSchema,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
} from "../types";

/**
 * Gemini adapter over the REST API.
 *
 * Gemini's `responseSchema` is a restricted OpenAPI dialect rather than full
 * JSON Schema — it rejects `additionalProperties` and union types like
 * `["integer","null"]` — so the schema is expressed separately here, with
 * `nullable` instead. The Zod parse is still the arbiter of the final shape.
 */
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          minutes: { type: "INTEGER", nullable: true },
          occurredAt: { type: "STRING" },
          skills: { type: "ARRAY", items: { type: "STRING" } },
          notes: { type: "STRING", nullable: true },
          confidence: { type: "NUMBER" },
        },
        required: ["title", "minutes", "occurredAt", "skills", "notes", "confidence"],
      },
    },
    clarification: { type: "STRING", nullable: true },
  },
  required: ["items"],
};

export class GoogleProvider implements ExtractionProvider {
  readonly isLocal = false;
  readonly name: string;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {
    this.name = `Gemini (${model})`;
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildUserPrompt(input) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: GEMINI_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Extraction provider returned ${response.status}: ${detail.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content");

    return extractionResultSchema.parse(JSON.parse(text));
  }
}
