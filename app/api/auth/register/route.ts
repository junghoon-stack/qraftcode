import { NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { hashPassword, setAuthCookie, verifyPassword } from "@/lib/auth";

const credentials = z.object({ email: z.string().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(12).max(128) });

export async function POST(request: Request) {
  try {
    const body = credentials.parse(await request.json());
    const passwordHash = await hashPassword(body.password);
    const id = crypto.randomUUID();
    try {
      await database()`insert into users (id, email, password_hash) values (${id}, ${body.email}, ${passwordHash})`;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "23505") return NextResponse.json({ error: "Unable to create account with those credentials." }, { status: 409 });
      throw error;
    }
    setAuthCookie(id);
    return NextResponse.json({ user: { id, email: body.email } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Use a valid email and a password of at least 12 characters." }, { status: 400 });
    return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 500 });
  }
}
