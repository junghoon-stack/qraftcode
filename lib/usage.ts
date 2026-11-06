import { randomUUID } from "crypto";
import { database } from "@/lib/db";
import type { ProviderName } from "@/lib/types";

export async function recordAiUsage(input: { userId: string; sessionId: string; provider: ProviderName; model: string; inputTokens: number; outputTokens: number; durationMs: number }) {
  await database()`insert into ai_usage (id, user_id, session_id, provider, model, input_tokens, output_tokens, duration_ms) values (${randomUUID()}, ${input.userId}, ${input.sessionId}, ${input.provider}, ${input.model}, ${Math.max(0, Math.floor(input.inputTokens))}, ${Math.max(0, Math.floor(input.outputTokens))}, ${Math.max(0, Math.floor(input.durationMs))})`;
}
