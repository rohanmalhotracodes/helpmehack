import Link from "next/link";
import { ArrowRight, BookOpenText, GitFork, GraduationCap } from "lucide-react";
import { HomepageFaq } from "./homepage-faq";

export function HomeLanding({ onNavigate }: { onNavigate: (view: "overlooked" | "open-source") => void }) {
  return (
    <main className="mx-auto max-w-[1080px] px-5 pb-4 sm:px-8">
      <section aria-labelledby="landing-title" className="pb-8 pt-16 sm:pb-14 sm:pt-24">
        <h1 id="landing-title" className="max-w-[800px] text-balance text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl">Open source<br />worth starting.</h1>
        <p className="x-muted mt-6 max-w-[560px] text-pretty text-lg leading-7">Find a project you want to contribute to. Read the Feed for practical open-source context, or explore repositories and their open issues.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#feed" onClick={(event) => { event.preventDefault(); onNavigate("overlooked"); }} className="focus-ring x-border inline-flex min-h-12 items-center gap-3 rounded-full border px-6 py-3 text-base font-semibold transition-colors hover:bg-[var(--surface-raised)] active:opacity-75"><BookOpenText size={18} aria-hidden="true" />Feed</a>
          <a href="#open-source" onClick={(event) => { event.preventDefault(); onNavigate("open-source"); }} className="focus-ring x-primary inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3 text-base font-semibold transition-opacity hover:opacity-85 active:opacity-75"><GitFork size={18} aria-hidden="true" />Repos<ArrowRight size={18} aria-hidden="true" /></a>
          <Link href="/programs" className="focus-ring x-border inline-flex min-h-12 items-center gap-3 rounded-full border px-6 py-3 text-base font-semibold transition-colors hover:bg-[var(--surface-raised)] active:opacity-75"><GraduationCap size={18} aria-hidden="true" />Programs</Link>
        </div>
      </section>
      <HomepageFaq />
    </main>
  );
}
