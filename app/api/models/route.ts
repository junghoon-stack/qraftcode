import { NextResponse } from "next/server";
import { providerCatalog } from "@/lib/ai";

// Exposes the providers/models this deployment can actually call, so the chat UI never
// offers a model the server would reject.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ providers: providerCatalog() });
}
