import type { ReactNode } from "react";
import { ContributionPageShell } from "@/components/contribution-page-shell";

export function PolicyPage({ title, introduction, sections }: {
  title: string;
  introduction: string;
  sections: { title: string; content: ReactNode }[];
}) {
  return (
    <ContributionPageShell>
      <main className="mx-auto max-w-[800px] px-5 pb-4 pt-12 sm:px-8 sm:pt-16">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mono x-muted mt-4 text-xs">Updated September 21, 2026</p>
        <p className="x-muted mt-6 max-w-[60ch] text-lg leading-7">{introduction}</p>
        <div className="mt-10">
          {sections.map((section) => (
            <section key={section.title} className="x-border border-t py-6">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="x-muted mt-3 max-w-[60ch] text-pretty text-base leading-7">{section.content}</div>
            </section>
          ))}
        </div>
      </main>
    </ContributionPageShell>
  );
}
