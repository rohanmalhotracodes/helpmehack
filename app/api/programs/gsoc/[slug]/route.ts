import { NextResponse } from "next/server";
import { loadGsocOrganization } from "@/lib/program-directory";

export const revalidate = 2592000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const organization = await loadGsocOrganization(slug);

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json(organization, {
    headers: {
      "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
