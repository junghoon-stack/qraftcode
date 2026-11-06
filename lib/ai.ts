import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import type { Message, ProviderName } from "@/lib/types";

export async function generateAssistantReply({
  provider,
  model,
  messages,
}: {
  provider: ProviderName;
  model: string;
  messages: Message[];
}) {
  const sanitizedMessages = messages.map(({ role, content }) => ({
    role,
    content,
  }));

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing. Add it to your .env file.");
    }

    const openai = createOpenAI({ apiKey });
    const result = await generateText({
      model: openai(model || "gpt-4o-mini"),
      messages: sanitizedMessages,
    });

    return result.text;
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is missing. Add it to your .env file.");
    }

    const anthropic = createAnthropic({ apiKey });
    const result = await generateText({
      model: anthropic(model || "claude-3-5-sonnet-20241022"),
      messages: sanitizedMessages,
    });

    return result.text;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
