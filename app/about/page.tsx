import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";

const description = "HelpMeHack combines an open-source contribution directory with an editorial feed for beginners and experienced developers.";
const url = "https://main.d27aveplt50hl3.amplifyapp.com/about";

export const metadata: Metadata = {
  title: "About HelpMeHack",
  description,
  alternates: { canonical: url },
  openGraph: { title: "About HelpMeHack", description, url, type: "website", siteName: "HelpMeHack" },
};

export default function AboutPage() {
  return (
    <ContributionPageShell>
      <main className="mx-auto max-w-[1000px] px-5 pb-4 pt-12 sm:px-8 sm:pt-20">
        <section aria-labelledby="about-title" className="max-w-[760px]">
          <h1 id="about-title" className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">About HelpMeHack</h1>
          <p className="x-muted mt-6 max-w-[60ch] text-pretty text-lg leading-7">{description}</p>
          <Link href="/#open-source" className="focus-ring x-primary mt-8 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-85 active:opacity-75">Explore repositories <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
        <div className="mt-12 sm:mt-16">
          <section className="x-border border-t py-6 sm:py-8">
            <h2 className="text-xl font-semibold">Choose a contribution</h2>
            <p className="x-muted mt-3 max-w-[60ch] text-pretty leading-7">Search repositories, filter by technology, and read contribution guidance. Check issue availability, then continue on GitHub. You can browse without an account.</p>
          </section>
          <section className="x-border border-t py-6 sm:py-8">
            <h2 className="text-xl font-semibold">Read the Feed</h2>
            <p className="x-muted mt-3 max-w-[60ch] text-pretty leading-7">Overlooked is HelpMeHack&apos;s editorial feed. It shares open-source context and links to external reading.</p>
          </section>
          <section className="x-border border-t py-6 sm:py-8">
            <h2 className="text-xl font-semibold">Check before starting</h2>
            <p className="x-muted mt-3 max-w-[60ch] text-pretty leading-7">Repository data can be incomplete or outdated. Read the latest issue discussion and each project&apos;s contribution rules. Maintainers decide whether to accept contributions.</p>
          </section>
        </div>
      </main>
    </ContributionPageShell>
  );
}
