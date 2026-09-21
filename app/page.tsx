import type { Metadata } from "next";
import { OpportunityApp } from "@/components/opportunity-app";
import { FaqStructuredData } from "@/components/structured-data";
import { SoftwareStructuredData } from "@/components/discovery-structured-data";
import { getOpportunityData } from "@/lib/provider";
import { homepageFaq } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "HelpMeHack: Find open-source projects worth contributing to",
  description: "Find active open-source projects, beginner-friendly issues, GSoC organizations, Summer of Bitcoin projects, and contribution guidance in one directory.",
  alternates: { canonical: "https://www.helpmehack.tech" },
  openGraph: {
    title: "HelpMeHack: Find open-source projects worth contributing to",
    description: "Find active open-source projects, contribution programs, beginner-friendly issues, and the contribution context that matters before you start.",
    url: "https://www.helpmehack.tech",
    type: "website",
    siteName: "HelpMeHack",
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const payload = await getOpportunityData({ fallbackToDemo: true });

  return (
    <>
      <SoftwareStructuredData />
      <FaqStructuredData questions={homepageFaq} />
      <OpportunityApp initialPayload={payload} />
    </>
  );
}
