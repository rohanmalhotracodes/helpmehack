import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";
import { ComparisonStructuredData } from "@/components/discovery-structured-data";

const title = "HelpMeHack vs Up For Grabs: Choose where to contribute";
const description = "Up For Grabs connects contributors to projects with labeled starter tasks. HelpMeHack brings repository fit, contribution guidance, and issue checks into your selection process.";
const url = "https://www.helpmehack.tech/compare/helpmehack-vs-up-for-grabs";
export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", siteName: "HelpMeHack" } };
const rows = [{"title": "Choose a project", "ours": "Search repositories, filter technologies, and explore groups for different experience levels.", "theirs": "Explore project descriptions and technology tags, then follow a project\u2019s task-list link."}, {"title": "Assess a task", "ours": "See availability signals from assignments, comments, labels, and linked pull requests.", "theirs": "Maintainer guidance asks for small, independent tasks with descriptions and implementation pointers."}, {"title": "Plan your start", "ours": "Read assignment guidance and preparation notes with sources in repository details.", "theirs": "The suggested workflow is to read guidelines, run the project, and message the task."}];
export default function ComparisonPage() {
  return <ContributionPageShell>
    <ComparisonStructuredData title={title} description={description} url={url} />
    <main className="mx-auto max-w-[1000px] px-5 pb-4 pt-12 sm:px-8 sm:pt-20">
      <section className="max-w-[760px]" aria-labelledby="comparison-title">
        <h1 id="comparison-title" className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">HelpMeHack vs Up For Grabs</h1>
        <p className="mt-5 text-xl font-semibold leading-7">Move from a task list to an informed first step.</p>
        <p className="x-muted mt-4 max-w-[60ch] text-pretty text-base leading-7">{description}</p>
        <Link href="/#open-source" className="focus-ring x-primary mt-7 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-85 active:opacity-75">Browse open source projects <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
      <section className="mt-12 sm:mt-16" aria-label="Contribution workflow comparison">
        {rows.map(row => <section key={row.title} className="x-border border-t py-6 sm:grid sm:grid-cols-[180px_1fr_1fr] sm:gap-8">
          <h2 className="text-lg font-semibold">{row.title}</h2>
          <div className="mt-4 sm:mt-0"><h3 className="text-sm font-bold">HelpMeHack</h3><p className="x-muted mt-2 max-w-[60ch] text-sm leading-6">{row.ours}</p></div>
          <div className="mt-4 sm:mt-0"><h3 className="x-muted text-sm font-semibold">Up For Grabs</h3><p className="x-muted mt-2 max-w-[60ch] text-sm leading-6">{row.theirs}</p></div>
        </section>)}
      </section>
      <section className="x-border mt-4 border-t pt-7" aria-labelledby="fit-title">
        <h2 id="fit-title" className="text-xl font-bold">Which fits your next contribution?</h2>
        <p className="x-muted mt-3 max-w-[65ch] text-base leading-7">Up For Grabs suits contributors who prefer maintainer-curated task lists. Choose HelpMeHack to review contribution context while selecting repositories. Availability checks can be incomplete; confirm current instructions on GitHub.</p>
        <p className="x-muted mt-5 text-sm leading-6">Sources: <a href="https://up-for-grabs.net/" className="focus-ring underline underline-offset-4">Up For Grabs</a>{" · "}<a href="https://github.com/up-for-grabs/up-for-grabs.net" className="focus-ring underline underline-offset-4">Project documentation</a></p>
        <Link href="/contribute/first-issue" className="focus-ring mt-5 inline-block py-2 text-sm font-semibold underline underline-offset-4">First-issue checklist</Link>
      </section>
    </main>
  </ContributionPageShell>;
}
