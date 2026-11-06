import { NextResponse } from "next/server";

import { getSessionById, listSessions } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  }

  const session = await getSessionById(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const { deleteSession } = await import("@/lib/store");
  const deleted = await deleteSession(id);
  return NextResponse.json({ deleted });
}
