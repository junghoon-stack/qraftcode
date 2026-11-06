import { NextResponse } from "next/server";
import { clearAuthCookie, currentUser } from "@/lib/auth";

export async function GET() {
  try { return NextResponse.json({ user: await currentUser() }); }
  catch { return NextResponse.json({ user: null }); }
}

export async function DELETE() {
  clearAuthCookie();
  return NextResponse.json({ ok: true });
}
