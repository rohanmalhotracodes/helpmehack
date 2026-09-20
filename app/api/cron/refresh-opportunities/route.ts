import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { refreshOpportunityIndex } from "@/lib/opportunity-indexer";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function matchesSecret(request: Request, secret: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(secret));
}

export async function POST(request: Request) {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduled refresh is not configured." }, { status: 503 });
  if (!matchesSecret(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const discoveryOnly = url.searchParams.get("mode") === "discover";
  const rawLimit = Number(url.searchParams.get("limit"));
  const batchSizeOverride = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(6, Math.max(1, Math.round(rawLimit)))
    : undefined;

  try {
    const result = await refreshOpportunityIndex({ discoveryOnly, batchSizeOverride });
    return NextResponse.json({ ok: true, mode: discoveryOnly ? "discover" : "refresh", ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled refresh failed." }, { status: 503 });
  }
}
