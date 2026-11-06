import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSessionById, deleteSession } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const session = await getSessionById(user.id, params.id);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Session not found." }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const deleted = await deleteSession(user.id, params.id);
  return NextResponse.json({ deleted }, { status: deleted ? 200 : 404 });
}
