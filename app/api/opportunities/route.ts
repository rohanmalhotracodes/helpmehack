import { NextResponse } from "next/server";
import { hasGitHubAuthentication } from "@/lib/github-auth";
import { getOpportunityData } from "@/lib/provider";

export const dynamic = "force-dynamic";

let lastManualCheck = 0;

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  const cooldown = hasGitHubAuthentication() ? 60_000 : 3_600_000;
  const elapsed = Date.now() - lastManualCheck;
  if (force && lastManualCheck && elapsed < cooldown) {
    const retryAfter = Math.ceil((cooldown - elapsed) / 1000);
    return NextResponse.json({ error: "A recent GitHub check is still fresh.", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }
  try {
    const payload = await getOpportunityData({ force, fallbackToDemo: false });
    if (force) lastManualCheck = Date.now();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "GitHub refresh failed" }, { status: 503 });
  }
}
