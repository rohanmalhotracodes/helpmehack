import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getOpportunityData } from "@/lib/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function matchesSecret(request: Request, secret: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(secret));
}

export async function POST(request: Request) {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduled refresh is not configured." }, { status: 503 });
  if (!matchesSecret(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const payload = await getOpportunityData({ force: true, fallbackToDemo: false });
    const repositories = new Set(payload.records.filter((item) => item.category === "open-source").map((item) => `${item.owner}/${item.repo}`));
    return NextResponse.json({ ok: true, checkedAt: payload.checkedAt, repositories: repositories.size, issues: payload.records.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled refresh failed." }, { status: 503 });
  }
}
