import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { database } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  const allowlist = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!user || !allowlist.includes(user.email.toLowerCase())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [summary] = await database()<any[]>`select (select count(*)::int from users) as users, (select count(*)::int from chat_sessions) as sessions, (select count(*)::int from ai_usage where created_at >= date_trunc('month', now())) as monthly_requests, (select coalesce(sum(input_tokens + output_tokens), 0)::bigint from ai_usage where created_at >= date_trunc('month', now())) as monthly_tokens`;
  return NextResponse.json({ summary });
}
