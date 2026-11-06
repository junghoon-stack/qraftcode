import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { createSession, deleteSession, listSessions, renameSession } from "@/lib/store";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ sessions: await listSessions(user.id) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const schema = z.object({ title: z.string().trim().min(1).max(100).default("New conversation"), provider: z.enum(["openai", "anthropic"]).default("openai"), model: z.string().min(1).max(100).default("gpt-4o-mini") });
  try {
    const body = schema.parse(await request.json());
    const session = await createSession(user.id, body);
    return NextResponse.json({ session }, { status: 201 });
  } catch { return NextResponse.json({ error: "Invalid session details." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Valid session id required." }, { status: 400 });
  const deleted = await deleteSession(user.id, id);
  return NextResponse.json({ deleted });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  const parsed = z.object({ title: z.string().trim().min(1).max(100) }).safeParse(await request.json().catch(() => null));
  if (!id || !z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Valid session id and title required." }, { status: 400 });
  const session = await renameSession(user.id, id, parsed.data.title);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Session not found." }, { status: 404 });
}
