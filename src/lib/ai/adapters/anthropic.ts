import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import {
  EXTRACTION_JSON_SCHEMA,
  extractionResultSchema,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
} from "../types";

/**
 * Claude adapter, via the official Anthropic SDK.
 *
 * Uses structured outputs (`output_config.format`) so the model is constrained
 * to our schema server-side rather than being asked nicely for JSON.
 *
 * Effort is set to "low": this is a short extraction from one sentence, and low
 * effort keeps latency and cost down on what is an interactive, type-and-wait
 * interaction. Thinking is intentionally left at its default rather than
 * disabled, on current Claude models, disabling thinking is the more expensive
 * lever and carries its own failure modes, whereas low effort is the cheap one.
 */
export class AnthropicProvider implements ExtractionProvider {
  readonly isLocal = false;
  readonly name: string;

  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
    this.name = `Claude (${model})`;
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: EXTRACTION_JSON_SCHEMA,
        },
      },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    // Safety classifiers can decline a request; that arrives as a normal 200
    // with stop_reason "refusal" and empty content, so check before indexing.
    if (message.stop_reason === "refusal") {
      throw new Error("The extraction request was declined by the provider");
    }

    const text = message.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") {
      throw new Error("Claude returned no text content");
    }

    return extractionResultSchema.parse(JSON.parse(text.text));
  }
}
