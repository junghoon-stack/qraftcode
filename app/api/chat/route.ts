import { NextResponse } from "next/server";

import { generateAssistantReply } from "@/lib/ai";
import { appendMessage, createSession, getSessionById } from "@/lib/store";
import type { ProviderName } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Chat API ready" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      provider?: ProviderName;
      model?: string;
      messages?: Array<{ id?: string; role: "user" | "assistant"; content: string; createdAt?: string }>;
    };

    const provider = body.provider ?? "openai";
    const model = body.model ?? process.env.DEFAULT_MODEL ?? "gpt-4o-mini";
    const submittedMessages = body.messages ?? [];

    if (!submittedMessages.length) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    const latestMessage = submittedMessages[submittedMessages.length - 1];
    const content = latestMessage.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    let session = body.sessionId ? await getSessionById(body.sessionId) : null;
    if (!session) {
      session = await createSession({ title: "New conversation", provider, model });
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content,
      createdAt: new Date().toISOString(),
    };

    await appendMessage(session.id, userMessage);

    const history = [...(session.messages ?? []), userMessage];
    const assistantReply = await generateAssistantReply({
      provider,
      model,
      messages: history,
    });

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: assistantReply,
      createdAt: new Date().toISOString(),
    };

    const updatedSession = await appendMessage(session.id, assistantMessage);

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      message: assistantMessage,
      session: updatedSession,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
