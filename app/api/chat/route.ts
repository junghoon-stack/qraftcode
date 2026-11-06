import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { appendMessage, createSession, getSessionById } from "@/lib/store";
import { generateAssistantReply, validateModel } from "@/lib/ai";
import type { ProviderName } from "@/lib/types";

export const runtime = "nodejs";
const inputSchema = z.object({ sessionId: z.string().uuid().optional(), provider: z.enum(["openai", "anthropic"]).default("openai"), model: z.string().min(1).max(100), content: z.string().trim().min(1).max(12000) });

export async function GET() { return NextResponse.json({ ok: true }); }

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = inputSchema.parse(await request.json());
    const provider = body.provider as ProviderName;
    validateModel(provider, body.model);
    let session = body.sessionId ? await getSessionById(user.id, body.sessionId) : null;
    if (body.sessionId && !session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (!session) session = await createSession(user.id, { title: body.content.slice(0, 60), provider, model: body.model });
    if (!session) throw new Error("Unable to create session.");

    const history = session.messages.slice(-30).map((message) => ({ role: message.role, content: message.content }));
    history.push({ role: "user", content: body.content });
    await appendMessage(user.id, session.id, { role: "user", content: body.content });
    const answer = await generateAssistantReply({ provider, model: body.model, messages: history });
    await appendMessage(user.id, session.id, { role: "assistant", content: answer });
    const updated = await getSessionById(user.id, session.id);
    return NextResponse.json({ session: updated, assistant: answer });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request. Check the model, provider, and prompt size." }, { status: 400 });
    const message = error instanceof Error ? error.message : "AI request failed.";
    const status = message.includes("not enabled") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
