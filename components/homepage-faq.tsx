import Link from "next/link";
import { SeoFaq } from "./seo-faq";
import { homepageFaq } from "@/lib/seo-content";

const discoveryAreas = [
  {
    title: "Active repositories",
    body: "Explore open-source projects by technology, then inspect contribution guidance and issue signals before choosing where to spend your time.",
    href: "/open-source-projects",
    label: "Find open-source projects",
  },
  {
    title: "Contribution programs",
    body: "Browse GSoC organization history and Summer of Bitcoin cohorts by year and technology, with past projects and official sources where available.",
    href: "/programs",
    label: "Explore programs",
  },
  {
    title: "Contribution rules",
    body: "Understand assignment, linked pull requests, project processes, and what to check before you start a supposedly beginner-friendly issue.",
    href: "/contribute/first-issue",
    label: "Choose a first issue",
  },
];

export function HomepageFaq() {
  return (
    <>
      <section aria-labelledby="discover-title" className="x-border mt-6 border-t pt-8 sm:mt-10">
        <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Open-source discovery without guesswork</p>
        <h2 id="discover-title" className="x-text mt-2 max-w-[760px] text-2xl font-bold tracking-tight sm:text-3xl">
          Find the project, program, and contribution context in one place.
        </h2>
        <p className="x-muted mt-4 max-w-[70ch] text-base leading-7">
          helpmehack is built for contributors who want more than a list of issue labels. Use repository signals, program history, and practical contribution guidance to narrow your search, then verify the latest details with the project itself.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {discoveryAreas.map((item) => (
            <article key={item.title} className="x-border border-t pt-5">
              <h3 className="x-text text-base font-semibold">{item.title}</h3>
              <p className="x-muted mt-2 text-sm leading-6">{item.body}</p>
              <Link href={item.href} className="focus-ring x-text mt-4 inline-flex rounded text-sm font-semibold underline underline-offset-4">
                {item.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <SeoFaq
        questions={homepageFaq}
        className="mt-12"
        intro="Quick answers about how helpmehack finds and explains open-source opportunities."
      />
    </>
  );
}
