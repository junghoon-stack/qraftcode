import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { database } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  const allowlist = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!user || !allowlist.includes(user.email.toLowerCase())) {
    return <main style={{ fontFamily: "sans-serif", margin: "4rem auto", maxWidth: 640 }}><h1>Not found</h1><p>This page is not available.</p></main>;
  }
  const [summary] = await database()<any[]>`select (select count(*)::int from users) as users, (select count(*)::int from chat_sessions) as sessions, (select count(*)::int from ai_usage where created_at >= date_trunc('month', now())) as monthly_requests, (select coalesce(sum(input_tokens + output_tokens), 0)::bigint from ai_usage where created_at >= date_trunc('month', now())) as monthly_tokens`;
  return <main style={{ fontFamily: "sans-serif", margin: "4rem auto", maxWidth: 900, padding: 24 }}><p>ADMIN OVERVIEW</p><h1>Kilo AI Service</h1><p>Current month: {new Date().toISOString().slice(0, 7)}</p><section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 16 }}>{Object.entries({ Users: summary.users, Sessions: summary.sessions, "AI requests this month": summary.monthly_requests, "Tokens this month": String(summary.monthly_tokens) }).map(([label, value]) => <article key={label} style={{ border: "1px solid #ccc", borderRadius: 12, padding: 20 }}><small>{label}</small><h2>{value}</h2></article>)}</section><p style={{ marginTop: 24 }}>Usage metrics are recorded only after the usage migration is applied. No monetary cost is estimated because provider pricing changes over time.</p></main>;
}
