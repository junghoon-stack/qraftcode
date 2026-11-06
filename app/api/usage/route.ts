import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { database } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rows = await database()<any[]>`select provider, model, count(*)::int as requests, coalesce(sum(input_tokens), 0)::int as input_tokens, coalesce(sum(output_tokens), 0)::int as output_tokens, coalesce(sum(input_tokens + output_tokens), 0)::int as total_tokens from ai_usage where user_id = ${user.id} and created_at >= date_trunc('month', now()) group by provider, model order by requests desc`;
  return NextResponse.json({ month: new Date().toISOString().slice(0, 7), usage: rows });
}
