import { NextResponse } from "next/server";

import { createSession, deleteSession, getSessionById, listSessions } from "@/lib/store";

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    provider?: "openai" | "anthropic";
    model?: string;
  };

  const session = await createSession({
    title: body.title ?? "New conversation",
    provider: body.provider ?? "openai",
    model: body.model ?? process.env.DEFAULT_MODEL ?? "gpt-4o-mini",
  });

  return NextResponse.json({ session });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const deleted = await deleteSession(id);
  return NextResponse.json({ deleted });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const body = (await request.json()) as { title?: string };

  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const session = await getSessionById(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  session.title = body.title ?? session.title;
  session.updatedAt = new Date().toISOString();

  return NextResponse.json({ session });
}
