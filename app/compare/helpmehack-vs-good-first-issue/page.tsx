import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";
import { ComparisonStructuredData } from "@/components/discovery-structured-data";

const title = "HelpMeHack vs Good First Issue: Choose where to contribute";
const description = "Good First Issue curates beginner issues by language. HelpMeHack helps you inspect project fit, contribution rules, and issue availability before moving to GitHub.";
const url = "https://www.helpmehack.tech/compare/helpmehack-vs-good-first-issue";
export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", siteName: "HelpMeHack" } };
const rows = [{"title": "Find a fit", "ours": "Filter technologies and compare experience groups, with saved repositories in your browser.", "theirs": "Browse curated projects by language, with issue links and recent activity ages."}, {"title": "Check the work", "ours": "Review availability signals from assignees, comments, labels, and linked pull requests.", "theirs": "Find issues with beginner-friendly labels in projects selected for newcomer contributions."}, {"title": "Prepare to contribute", "ours": "Open repository details for assignment guidance, preparation notes, and their sources.", "theirs": "Project admission requires setup instructions, contribution guidelines, and recent activity."}];
export default function ComparisonPage() {
  return <ContributionPageShell>
    <ComparisonStructuredData title={title} description={description} url={url} />
    <main className="mx-auto max-w-[1000px] px-5 pb-4 pt-12 sm:px-8 sm:pt-20">
      <section className="max-w-[760px]" aria-labelledby="comparison-title">
        <h1 id="comparison-title" className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">HelpMeHack vs Good First Issue</h1>
        <p className="mt-5 text-xl font-semibold leading-7">Choose a project, then check your next step.</p>
        <p className="x-muted mt-4 max-w-[60ch] text-pretty text-base leading-7">{description}</p>
        <Link href="/#open-source" className="focus-ring x-primary mt-7 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-85 active:opacity-75">Browse open source projects <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
      <section className="mt-12 sm:mt-16" aria-label="Contribution workflow comparison">
        {rows.map(row => <section key={row.title} className="x-border border-t py-6 sm:grid sm:grid-cols-[180px_1fr_1fr] sm:gap-8">
          <h2 className="text-lg font-semibold">{row.title}</h2>
          <div className="mt-4 sm:mt-0"><h3 className="text-sm font-bold">HelpMeHack</h3><p className="x-muted mt-2 max-w-[60ch] text-sm leading-6">{row.ours}</p></div>
          <div className="mt-4 sm:mt-0"><h3 className="x-muted text-sm font-semibold">Good First Issue</h3><p className="x-muted mt-2 max-w-[60ch] text-sm leading-6">{row.theirs}</p></div>
        </section>)}
      </section>
      <section className="x-border mt-4 border-t pt-7" aria-labelledby="fit-title">
        <h2 id="fit-title" className="text-xl font-bold">Which fits your next contribution?</h2>
        <p className="x-muted mt-3 max-w-[65ch] text-base leading-7">Good First Issue suits a quick language-led shortlist. Choose HelpMeHack when you want contribution context beside your matches. Checks can be incomplete; read the latest GitHub discussion before starting.</p>
        <p className="x-muted mt-5 text-sm leading-6">Sources: <a href="https://goodfirstissue.dev/" className="focus-ring underline underline-offset-4">Good First Issue</a>{" · "}<a href="https://github.com/DeepSourceCorp/good-first-issue" className="focus-ring underline underline-offset-4">Project documentation</a></p>
        <Link href="/contribute/first-issue" className="focus-ring mt-5 inline-block py-2 text-sm font-semibold underline underline-offset-4">First-issue checklist</Link>
      </section>
    </main>
  </ContributionPageShell>;
}
