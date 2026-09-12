import { NextResponse } from "next/server";
import { getRepositoryOpportunityData } from "@/lib/github-provider";
import type { OpenSourceOpportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

type Tier = NonNullable<OpenSourceOpportunity["discoveryTiers"]>[number];
const allowedTiers = new Set<Tier>(["beginner", "moderate", "high-impact"]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const owner = params.get("owner") ?? "";
  const repo = params.get("repo") ?? "";
  const tiers = (params.get("tiers") ?? "").split(",").filter((tier): tier is Tier => allowedTiers.has(tier as Tier));
  try {
    return NextResponse.json(await getRepositoryOpportunityData(owner, repo, tiers), {
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repository issues could not be loaded." }, { status: 503 });
  }
}
