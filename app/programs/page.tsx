import type { Metadata } from "next";
import { ContributionPageShell } from "@/components/contribution-page-shell";
import { ProgramsDirectory } from "@/components/programs-directory";
import { loadGsocOrganizations, summarizeProgramOrganization, summerOfBitcoin2026Organizations } from "@/lib/program-directory";

export const metadata: Metadata = {
  title: "Open-source programs | HelpMeHack",
  description: "Browse GSoC 2026 and Summer of Bitcoin 2026 organizations, technologies, project repositories, and official program links.",
  alternates: { canonical: "https://helpmehack.tech/programs" },
};

export default async function ProgramsPage() {
  const gsoc = (await loadGsocOrganizations()).map(summarizeProgramOrganization);\n  const summerOfBitcoin = summerOfBitcoin2026Organizations.map(summarizeProgramOrganization);

  return (
    <ContributionPageShell>
      <ProgramsDirectory gsoc={gsoc} summerOfBitcoin={summerOfBitcoin} />
    </ContributionPageShell>
  );
}
