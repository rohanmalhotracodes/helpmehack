import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";

const title = "Ways to contribute to open source | HelpMeHack";
const description = "Explore four ways to contribute to open source: documentation, bug reports, code fixes, and testing. Choose a contribution that fits your skills.";
const url = "https://www.helpmehack.tech/contribute";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", siteName: "HelpMeHack" },
};

const topics = [
  {
    id: "documentation",
    title: "Documentation",
    body: "Try a project's setup guide as a new user. Fix an unclear step, update an example, or explain a missing requirement. Follow its writing guidelines and check that your instructions work.",
  },
  {
    id: "bug-reports",
    title: "Bug reports",
    body: "Search existing issues before opening a report. Describe what you expected, what happened, and the smallest steps that reproduce it. Include the version and environment, without sharing private data.",
  },
  {
    id: "code-fixes",
    title: "Code fixes",
    body: "Choose a small issue in a language you know. Check whether someone has claimed it and read the contribution guide. Confirm the scope, add a focused fix, and run the project's checks.",
  },
  {
    id: "testing",
    title: "Testing and feedback",
    body: "Reproduce an existing issue or test a proposed change. Report the exact steps and results so maintainers can compare them. A useful test can help even when you don't write the fix.",
  },
];

export default function ContributePage() {
  return (
    <ContributionPageShell>
      <main className="mx-auto max-w-[1000px] px-5 pb-4 pt-12 sm:px-8 sm:pt-20">
        <section aria-labelledby="contribute-title" className="max-w-[760px]">
          <h1 id="contribute-title" className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">Ways to contribute to open source</h1>
          <p className="x-muted mt-6 max-w-[60ch] text-pretty text-lg leading-7">Code is one way to help. Start with a contribution that fits your skills, then follow the project&apos;s process.</p>
          <Link href="/#open-source" className="focus-ring x-primary mt-8 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-85 active:opacity-75">Browse open source projects <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
        <div className="mt-12 sm:mt-16">
          {topics.map((topic, index) => (
            <section key={topic.id} aria-labelledby={topic.id} className="x-border grid grid-cols-[32px_1fr] gap-x-4 border-t py-6 sm:grid-cols-[48px_220px_1fr] sm:gap-x-6 sm:py-8">
              <span className="mono x-muted pt-1 text-sm" aria-hidden="true">0{index + 1}</span>
              <h2 id={topic.id} className="text-xl font-semibold leading-7">{topic.title}</h2>
              <p className="x-muted col-start-2 mt-3 max-w-[60ch] text-pretty text-base leading-7 sm:col-start-3 sm:mt-0">{topic.body}</p>
            </section>
          ))}
        </div>
        <nav aria-label="Next step" className="x-border border-t pt-6">
          <Link href="/open-source-projects" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold underline underline-offset-4">Find a project <ArrowRight size={16} aria-hidden="true" /></Link>
        </nav>
      </main>
    </ContributionPageShell>
  );
}
