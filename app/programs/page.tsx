import type { Metadata } from "next";
import { ContributionPageShell } from "@/components/contribution-page-shell";
import { ProgramsDirectory } from "@/components/programs-directory";
import { FaqStructuredData } from "@/components/structured-data";
import { loadGsocOrganizations, summarizeProgramOrganization, summerOfBitcoin2026Organizations, summerOfBitcoinYearArchives } from "@/lib/program-directory";
import { programsFaq } from "@/lib/seo-content";

const title = "GSoC organizations & open-source programs | helpmehack";
const description = "Browse Google Summer of Code organization history, technologies, participation years, past projects, and Summer of Bitcoin cohorts from 2021 through 2026.";
const url = "https://www.helpmehack.tech/programs";

export const revalidate = 60 * 60 * 24 * 30;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", siteName: "helpmehack" },
};

export default async function ProgramsPage() {
  const gsoc = (await loadGsocOrganizations()).map(summarizeProgramOrganization);
  const summerOfBitcoin = summerOfBitcoin2026Organizations.map(summarizeProgramOrganization);

  return (
    <ContributionPageShell>
      <FaqStructuredData questions={programsFaq} />
      <ProgramsDirectory gsoc={gsoc} summerOfBitcoin={summerOfBitcoin} summerOfBitcoinYears={summerOfBitcoinYearArchives} />
    </ContributionPageShell>
  );
}
