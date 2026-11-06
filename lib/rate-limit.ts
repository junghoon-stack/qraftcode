import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { database } from "@/lib/db";

const schema = z.object({ scope: z.enum(["chat", "login", "register"]), limit: z.number().int().positive().max(100).default(20), windowSeconds: z.number().int().positive().max(3600).default(60) });

export async function consumeRateLimit(key: string, input: { limit: number; windowSeconds: number }) {
  const parsed = schema.safeParse({ ...input, scope: "chat" });
  if (!parsed.success) throw new Error("Invalid rate limit configuration");
  const result = await database()<any[]>`insert into api_rate_limits (key, window_started_at, request_count) values (${key}, now(), 1) on conflict (key) do update set window_started_at = case when api_rate_limits.window_started_at <= now() - (${input.windowSeconds} * interval '1 second') then now() else api_rate_limits.window_started_at end, request_count = case when api_rate_limits.window_started_at <= now() - (${input.windowSeconds} * interval '1 second') then 1 else api_rate_limits.request_count + 1 end returning request_count`;
  return result[0].request_count <= input.limit;
}

export async function rateLimitResponse(userId: string, scope: "chat" | "login" | "register", limit: number, windowSeconds: number) {
  const allowed = await consumeRateLimit(`${scope}:${userId}`, { limit, windowSeconds });
  if (allowed) return null;
  return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(windowSeconds) } });
}
