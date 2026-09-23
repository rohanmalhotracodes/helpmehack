import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";

const title = "How to choose a good first issue | helpmehack";
const description = "Learn how to choose a good first issue: search GitHub for unassigned beginner tasks, check availability, confirm the scope, and follow contribution rules.";
const url = "https://www.helpmehack.tech/contribute/first-issue";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", siteName: "helpmehack" },
};

const issueSearch = 'is:issue is:open label:"good first issue" no:assignee';
const issueSearchUrl = `https://github.com/search?q=${encodeURIComponent(issueSearch)}&type=issues`;

const checks = [
  { title: "Find an open, unassigned issue", body: "Search GitHub for beginner issues with no assignee:", search: true },
  { title: "Can you explain the change?", body: "Read the contribution guide and reproduce the problem. If setup fails, share the exact error in the project's preferred help channel." },
  { title: "What should you do next?", body: "helpmehack's Unassigned status is not a reservation. Possibly claimed means someone may already be working. Status unknown means helpmehack could not confirm availability. Check the latest discussion and linked pull requests. If availability is unclear, ask before starting. Follow the project's contribution rules; wait for assignment or approval if required." },
];

export default function FirstIssuePage() {
  return (
    <ContributionPageShell>
      <main className="mx-auto max-w-[1000px] px-5 pb-4 pt-12 sm:px-8 sm:pt-20">
        <section aria-labelledby="first-issue-title" className="max-w-[760px]">
          <h1 id="first-issue-title" className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">How to choose a good first issue</h1>
          <p className="x-muted mt-6 max-w-[60ch] text-pretty text-lg leading-7">Find a task you can explain and test. Then confirm nobody has started it.</p>
          <Link href="/#open-source" className="focus-ring x-primary mt-8 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-85 active:opacity-75">Browse open source projects <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
        <ol className="mt-12 sm:mt-16">
          {checks.map((check, index) => (
            <li key={check.title} className="x-border grid grid-cols-[32px_1fr] gap-x-4 border-t py-6 sm:grid-cols-[48px_220px_1fr] sm:gap-x-6 sm:py-8">
              <span className="mono x-muted pt-1 text-sm" aria-hidden="true">0{index + 1}</span>
              <h2 className="text-xl font-semibold leading-7">{check.title}</h2>
              <div className="x-muted col-start-2 mt-3 min-w-0 max-w-[60ch] text-pretty text-base leading-7 sm:col-start-3 sm:mt-0">
                <p>{check.body}</p>
                {check.search && <>
                  <a href={issueSearchUrl} className="focus-ring x-border mt-3 block rounded-lg border p-3 font-mono text-sm leading-6 underline decoration-dotted underline-offset-4" aria-label="Search GitHub for open, unassigned good first issues">
                    <code className="break-words">{issueSearch}</code>
                  </a>
                  <p className="mt-3">Add <code>language:Python</code> for Python projects, or <code className="break-words">repo:OWNER/REPO</code> for one repository. No assignee does not prove availability. Read comments and linked pull requests.</p>
                  <a href="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests" className="focus-ring mt-2 inline-block text-sm underline underline-offset-4">GitHub search reference</a>
                </>}
              </div>
            </li>
          ))}
        </ol>
        <aside className="x-border border-t py-6" aria-labelledby="scope-question">
          <h2 id="scope-question" className="text-xl font-semibold">Ask a specific question</h2>
          <blockquote className="x-muted mt-3 max-w-[60ch] text-base leading-7">“I reproduced this with the documented setup. I plan to change [component] and test [result]. Is that scope useful, and is anyone already working on it?”</blockquote>
        </aside>
        <nav aria-label="Related guides" className="x-border flex flex-wrap gap-x-6 border-t pt-6">
          <Link href="/open-source-projects" className="focus-ring inline-flex min-h-11 items-center rounded text-sm font-semibold underline underline-offset-4">Find a project</Link>
          <Link href="/contribute" className="focus-ring inline-flex min-h-11 items-center rounded text-sm font-semibold underline underline-offset-4">Ways to contribute</Link>
        </nav>
      </main>
    </ContributionPageShell>
  );
}
