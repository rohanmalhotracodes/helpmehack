import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";

const title = "Open source projects to contribute to | HelpMeHack";
const description = "Find open source projects to contribute to. Compare issue availability, contribution guides, and maintainer activity before choosing your first contribution.";
const url = "https://www.helpmehack.tech/open-source-projects";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", siteName: "HelpMeHack" },
};

const steps = [
  {
    title: "Choose a project that fits",
    body: "Start with a language you know and a project you want to use. HelpMeHack groups repositories for beginners, experienced contributors, and people exploring widely adopted projects. Compare the available issues, then open a repository to see its contribution details. You can browse without creating an account or uploading a resume.",
  },
  {
    title: "Look beyond the label",
    body: "A good first issue can still have someone working on it. HelpMeHack checks assignment, recent comments, and linked pull requests when assessing availability. It also looks at maintenance and newcomer contribution evidence. These checks help you narrow your search, but you should always read the latest GitHub discussion before starting.",
  },
  {
    title: "Follow the project's process",
    body: "Read the repository's contribution guide and setup instructions before writing code. Some maintainers ask you to request assignment; others want a proposal first. Choose one small change you can explain and test. Follow the instructions on GitHub, keep your pull request focused, and allow time for review. Each project sets its own rules. If the scope is unclear, ask a specific question in the issue before investing hours in a solution.",
  },
];

export default function OpenSourceProjectsPage() {
  return (
    <ContributionPageShell>
      <main className="mx-auto max-w-[1000px] px-5 pb-4 pt-12 sm:px-8 sm:pt-20">
        <section aria-labelledby="contribution-title" className="max-w-[760px]">
          <h1 id="contribution-title" className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">Open source projects to contribute to</h1>
          <p className="x-muted mt-6 max-w-[60ch] text-pretty text-lg leading-7">Find your next contribution with HelpMeHack. Explore repositories, check whether an issue is available, and learn how each project welcomes contributors. Start with the evidence before you commit your time.</p>
          <Link href="/#open-source" className="focus-ring x-primary mt-8 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-85 active:opacity-75">Browse open source projects <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
        <section aria-labelledby="starting-title" className="mt-16 sm:mt-20">
          <h2 id="starting-title" className="mb-8 text-2xl font-bold tracking-tight">From a project to your first contribution</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={step.title} className="x-border grid grid-cols-[32px_1fr] gap-x-4 border-t py-7 sm:grid-cols-[48px_220px_1fr] sm:gap-x-6 sm:py-8">
                <span className="mono x-muted pt-1 text-sm" aria-hidden="true">0{index + 1}</span>
                <h3 className="text-lg font-semibold leading-6">{step.title}</h3>
                <p className="x-muted col-start-2 mt-3 max-w-[60ch] text-pretty text-base leading-7 sm:col-start-3 sm:mt-0">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </ContributionPageShell>
  );
}
