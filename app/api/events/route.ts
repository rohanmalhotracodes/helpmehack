import { NextResponse } from "next/server";
import { getEventDiscovery } from "@/lib/event-provider";

export const dynamic = "force-dynamic";

let lastForcedRefresh = 0;

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (force) {
    const elapsed = Date.now() - lastForcedRefresh;
    if (lastForcedRefresh && elapsed < 60_000) {
      const retryAfter = Math.ceil((60_000 - elapsed) / 1000);
      return NextResponse.json({ error: "The event sources were checked recently.", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }
  }
  const payload = await getEventDiscovery({ force });
  if (force) lastForcedRefresh = Date.now();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": force ? "private, no-store" : "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
