import type { ExtractionInput, ExtractionProvider, ExtractionResult } from "./types";
import { RulesExtractionProvider } from "./adapters/rules";
import { OpenAICompatibleProvider } from "./adapters/openai-compatible";
import { AnthropicProvider } from "./adapters/anthropic";
import { GoogleProvider } from "./adapters/google";

/**
 * Resolves the configured provider, falling back to the rule-based one.
 *
 * The fallback is load-bearing, not defensive: it means a missing key degrades
 * chat quality instead of removing the feature, so the product is always
 * demoable and local development never needs a vendor account.
 */

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-opus-5",
  google: "gemini-2.5-flash",
};

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
};

export function resolveProvider(env = process.env): ExtractionProvider {
  const configured = (env.AI_PROVIDER ?? "").trim().toLowerCase();
  const apiKey = (env.AI_API_KEY ?? "").trim();
  const model = (env.AI_MODEL ?? "").trim();
  const baseUrl = (env.AI_BASE_URL ?? "").trim();

  if (!configured || configured === "rules") return new RulesExtractionProvider();

  // Configured for a hosted provider but no key: fall back rather than fail.
  // Chat that quietly stops working is worse than chat that is a bit dumber.
  if (!apiKey) return new RulesExtractionProvider();

  switch (configured) {
    case "openai":
    case "openai-compatible":
      return new OpenAICompatibleProvider(
        apiKey,
        baseUrl || DEFAULT_BASE_URLS.openai,
        model || DEFAULT_MODELS.openai,
      );
    case "anthropic":
    case "claude":
      return new AnthropicProvider(apiKey, model || DEFAULT_MODELS.anthropic);
    case "google":
    case "gemini":
      return new GoogleProvider(apiKey, model || DEFAULT_MODELS.google);
    default:
      return new RulesExtractionProvider();
  }
}

/**
 * Extract, with the rule-based provider as a runtime safety net.
 *
 * A vendor outage, a rate limit or an unparseable response should cost the user
 * some accuracy on one message — not the ability to record what they did.
 */
export async function extractExperiences(
  input: ExtractionInput,
): Promise<ExtractionResult & { providerName: string; degraded: boolean }> {
  const provider = resolveProvider();

  try {
    const result = await provider.extract(input);
    return { ...result, providerName: provider.name, degraded: false };
  } catch (error) {
    if (provider.isLocal) throw error;

    console.error("[lifexp] extraction provider failed, falling back:", error);
    const fallback = new RulesExtractionProvider();
    const result = await fallback.extract(input);
    return { ...result, providerName: fallback.name, degraded: true };
  }
}
