import { NextResponse } from "next/server";
import { database } from "@/lib/db";

export async function GET() {
  try {
    await database()`select 1`;
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch {
    return NextResponse.json({ status: "unavailable", database: "unavailable" }, { status: 503 });
  }
}
