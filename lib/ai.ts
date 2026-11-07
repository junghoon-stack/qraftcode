import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { CoreMessage } from "ai";
import type { ProviderName } from "@/lib/types";

// The OpenAI provider speaks the OpenAI chat-completions protocol, so it can point at any
// OpenAI-compatible gateway. This deployment runs on Pollinations, whose OpenAI-compatible
// endpoint lives at https://text.pollinations.ai/openai (no OpenAI account needed).
// Move to another gateway with OPENAI_BASE_URL; change the selectable models with
// OPENAI_MODELS / ANTHROPIC_MODELS (comma separated).
const DEFAULT_OPENAI_BASE_URL = "https://text.pollinations.ai/openai";
const DEFAULT_OPENAI_MODELS = ["openai-fast"];
const DEFAULT_ANTHROPIC_MODELS = ["claude-3-5-sonnet-20241022", "claude-3-7-sonnet-20250219", "claude-sonnet-4-20250514"];

export type ProviderInfo = { id: ProviderName; label: string; models: string[] };

function list(value: string | undefined, fallback: string[]) {
  const items = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

export function openaiBaseUrl() {
  return process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL;
}

function openaiLabel() {
  const url = openaiBaseUrl();
  if (url.includes("pollinations")) return "Pollinations";
  if (url.includes("openai.com")) return "OpenAI";
  return "OpenAI-compatible";
}

export function providerCatalog(): ProviderInfo[] {
  const catalog: ProviderInfo[] = [];
  if (process.env.OPENAI_API_KEY || openaiBaseUrl().includes("pollinations")) {
    catalog.push({
      id: "openai",
      label: openaiLabel(),
      models: list(process.env.OPENAI_MODELS, DEFAULT_OPENAI_MODELS),
    });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    catalog.push({
      id: "anthropic",
      label: "Anthropic",
      models: list(process.env.ANTHROPIC_MODELS, DEFAULT_ANTHROPIC_MODELS),
    });
  }
  return catalog;
}

export function validateModel(provider: ProviderName, model: string) {
  const entry = providerCatalog().find((item) => item.id === provider);
  if (!entry || !entry.models.includes(model)) throw new Error("This model is not enabled for this service.");
}

export async function generateAssistantReply({ provider, model, messages }: { provider: ProviderName; model: string; messages: CoreMessage[] }) {
  validateModel(provider, model);
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new Error("The AI provider is not configured. Set OPENAI_API_KEY on the server.");
    const result = await generateText({
      model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: openaiBaseUrl() })(model),
      messages,
      maxTokens: 2048,
      maxRetries: 1,
    });
    return result.text;
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY on the server.");
  const result = await generateText({ model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(model), messages, maxTokens: 2048, maxRetries: 1 });
  return result.text;
}
