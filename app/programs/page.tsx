import type { Metadata } from "next";
import { ContributionPageShell } from "@/components/contribution-page-shell";
import { ProgramsDirectory } from "@/components/programs-directory";
import { loadGsocOrganizations, summarizeProgramOrganization, summerOfBitcoin2026Organizations } from "@/lib/program-directory";

export const metadata: Metadata = {
  title: "Open-source programs | HelpMeHack",
  description: "Browse GSoC organization history, participation years, past projects, technologies, and Summer of Bitcoin organizations.",
  alternates: { canonical: "https://helpmehack.tech/programs" },
};

export default async function ProgramsPage() {
  const gsoc = (await loadGsocOrganizations()).map(summarizeProgramOrganization);
  const summerOfBitcoin = summerOfBitcoin2026Organizations.map(summarizeProgramOrganization);

  return (
    <ContributionPageShell>
      <ProgramsDirectory gsoc={gsoc} summerOfBitcoin={summerOfBitcoin} />
    </ContributionPageShell>
  );
}
