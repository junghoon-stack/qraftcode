import { NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { setAuthCookie, verifyPassword } from "@/lib/auth";

const credentials = z.object({ email: z.string().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const body = credentials.parse(await request.json());
    const [user] = await database()<any[]>`select id, email, password_hash from users where email = ${body.email} limit 1`;
    if (!user || !(await verifyPassword(body.password, user.password_hash))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    setAuthCookie(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 500 });
  }
}
