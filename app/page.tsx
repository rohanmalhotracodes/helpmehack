import type { Metadata } from "next";
import { OpportunityApp } from "@/components/opportunity-app";
import { getOpportunityData } from "@/lib/provider";

export const metadata: Metadata = {
  title: "HelpMeHack: Open source directory for contributors",
  description: "Find beginner-friendly open source issues and projects. Compare contribution guidance in Repos, or read practical advice in the Feed.",
  alternates: { canonical: "https://www.helpmehack.tech" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const payload = await getOpportunityData({ fallbackToDemo: true });
  return <OpportunityApp initialPayload={payload} />;
}
