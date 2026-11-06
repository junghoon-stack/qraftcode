import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { CoreMessage } from "ai";
import type { ProviderName } from "@/lib/types";

const MODEL_ALLOWLIST: Record<ProviderName, Set<string>> = {
  openai: new Set(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"]),
  anthropic: new Set(["claude-3-5-sonnet-20241022", "claude-3-7-sonnet-20250219", "claude-sonnet-4-20250514"]),
};

export function validateModel(provider: ProviderName, model: string) {
  if (!MODEL_ALLOWLIST[provider].has(model)) throw new Error("This model is not enabled for this service.");
}

export async function generateAssistantReply({ provider, model, messages }: { provider: ProviderName; model: string; messages: CoreMessage[] }) {
  validateModel(provider, model);
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI is not configured. Set OPENAI_API_KEY on the server.");
    const result = await generateText({ model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(model), messages, maxTokens: 2048, maxRetries: 1 });
    return result.text;
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY on the server.");
  const result = await generateText({ model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(model), messages, maxTokens: 2048, maxRetries: 1 });
  return result.text;
}
