import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import {
  EXTRACTION_JSON_SCHEMA,
  extractionResultSchema,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
} from "../types";

/**
 * The OpenAI chat-completions wire format.
 *
 * Deliberately raw `fetch` rather than a vendor SDK: this one adapter is meant
 * to reach OpenAI, Groq, OpenRouter, DeepSeek, Together and a local Ollama by
 * changing a base URL, and a vendor SDK would quietly pull the implementation
 * back toward one of them.
 */
export class OpenAICompatibleProvider implements ExtractionProvider {
  readonly isLocal = false;
  readonly name: string;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {
    this.name = `OpenAI-compatible (${model})`;
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        // Providers that don't implement json_schema generally fall back to
        // plain JSON mode; the Zod parse below is what actually guarantees the
        // shape either way.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lifexp_extraction",
            strict: true,
            schema: EXTRACTION_JSON_SCHEMA,
          },
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
      choices?: { message?: { content?: string } }[];
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Extraction provider returned no content");

    return extractionResultSchema.parse(JSON.parse(content));
  }
}
