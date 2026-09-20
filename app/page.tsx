import type { Metadata } from "next";
import { OpportunityApp } from "@/components/opportunity-app";
import { getOpportunityData } from "@/lib/provider";

export const metadata: Metadata = {
  title: "HelpMeHack | Open source worth starting",
  description: "Find open-source projects and issues to contribute to. Read the Overlooked feed for practical advice, or explore the repository directory.",
  alternates: { canonical: "https://www.helpmehack.tech" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const payload = await getOpportunityData({ fallbackToDemo: true });
  return <OpportunityApp initialPayload={payload} />;
}
