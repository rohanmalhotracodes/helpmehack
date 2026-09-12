"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CircleDot, Info, Search, Star, X } from "lucide-react";
import type { RankedContribution } from "@/lib/open-source-tiers";
import { rankOpenSourceTiers } from "@/lib/open-source-tiers";
import type { OpenSourceOpportunity } from "@/lib/types";
import { Avatar } from "./ui";
import { NewsletterSignup } from "./newsletter-signup";

type RankedRepository = {
  key: string;
  primary: OpenSourceOpportunity;
  issues: OpenSourceOpportunity[];
  reason: string;
  rank: number;
};

const startableStatuses = new Set(["unassigned", "ask-first", "unknown"]);

export function OpenSourceDirectory({ records, onOpenRepository }: {
  records: OpenSourceOpportunity[];
  onOpenRepository: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All");
  const languages = useMemo(() => ["All", ...new Set(records.map((item) => item.language).filter((value) => value !== "Unknown"))], [records]);
  const filtered = useMemo(() => records.filter((item) => {
    const needle = query.trim().toLowerCase();
    const queryMatch = !needle || `${item.owner} ${item.repo} ${item.title} ${item.summary} ${item.repositoryDescription ?? ""} ${item.labels.join(" ")}`.toLowerCase().includes(needle);
    return queryMatch && (language === "All" || item.language === language);
  }), [language, query, records]);
  const tiers = useMemo(() => rankOpenSourceTiers(filtered).map((tier) => ({
    ...tier,
    repositories: groupRepositories(tier.items, filtered),
  })), [filtered]);
  const visibleCount = new Set(tiers.flatMap((tier) => tier.repositories.map((entry) => entry.key))).size;

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1240px] px-3 py-6 sm:px-5 sm:py-8">
      <header>
        <p className="x-muted text-xs font-semibold uppercase tracking-[.13em]">Evidence-ranked repositories</p>
        <h1 className="x-text mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Open source worth starting.</h1>
      </header>

      <section className="mt-5" aria-label="Search and filter open-source repositories">
        <div className="relative max-w-2xl">
          <Search size={17} className="x-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring placeholder-muted x-border x-text h-12 w-full rounded-full border bg-transparent pl-11 pr-11 text-sm" placeholder="Search repositories, organizations, languages, or issue labels" aria-label="Search open-source repositories" />
          {query && <button onClick={() => setQuery("")} className="focus-ring x-muted absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-[var(--surface-raised)]" aria-label="Clear search"><X size={16} /></button>}
        </div>
        <div className="event-carousel mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by language">
          {languages.map((item) => <button key={item} onClick={() => setLanguage(item)} aria-pressed={language === item} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${language === item ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>{item}</button>)}
        </div>
        <p className="x-muted mt-3 text-xs">{visibleCount} {visibleCount === 1 ? "repository" : "repositories"} with currently checked contribution opportunities.</p>
      </section>

      <div className="mt-8 space-y-10">
        {tiers.map((tier) => <RepositoryTierSection key={tier.id} title={tier.title} description={tier.description} items={tier.repositories} onOpen={onOpenRepository} />)}
      </div>

      <details className="x-border x-raised mt-10 rounded-xl border p-4">
        <summary className="focus-ring x-text flex cursor-pointer list-none items-center gap-2 rounded text-sm font-bold"><Info size={16} />How the ranking works</summary>
        <div className="x-muted mt-3 grid gap-4 text-xs leading-5 sm:grid-cols-3">
          <p><strong className="x-text block">Beginner-friendly</strong>38% issue suitability, 22% clarity, 20% onboarding, 12% newcomer evidence, and 8% visible availability.</p>
          <p><strong className="x-text block">Experienced contributors</strong>30% observed repository quality, 25% issue clarity, 20% maintenance, 15% review responsiveness, and 10% availability.</p>
          <p><strong className="x-text block">Major ecosystem projects</strong>42% public adoption, 23% reputation, 15% newcomer evidence, 12% maintenance, and 8% issue clarity. Beginner-labeled work is excluded from this tier; this is not a hiring promise.</p>
        </div>
        <p className="x-muted mt-4 text-xs leading-5">Repository quality is kept separate from issue availability. Merge evidence uses a disclosed 90-day public pull-request sample; if the sample is too small, the score is withheld rather than guessed.</p>
      </details>
      <NewsletterSignup />
    </main>
  );
}

function groupRepositories(entries: RankedContribution[], allIssues: OpenSourceOpportunity[]): RankedRepository[] {
  const grouped = new Map<string, RankedRepository>();
  for (const entry of entries) {
    const key = `${entry.item.owner}/${entry.item.repo}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        key,
        primary: entry.item,
        issues: allIssues.filter((item) => `${item.owner}/${item.repo}` === key && startableStatuses.has(item.status)),
        reason: entry.reason,
        rank: entry.rank,
      });
    } else if (entry.rank > existing.rank) {
      existing.primary = entry.item;
      existing.reason = entry.reason;
      existing.rank = entry.rank;
    }
  }
  return [...grouped.values()].sort((a, b) => b.rank - a.rank);
}

function RepositoryTierSection({ title, description, items, onOpen }: { title: string; description: string; items: RankedRepository[]; onOpen: (key: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => scroller.current?.scrollBy({ left: direction * Math.min(scroller.current.clientWidth * 0.82, 680), behavior: "smooth" });
  const headingId = `tier-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="border-l-4 border-current pl-3">
          <h2 id={headingId} className="x-text text-xl font-bold tracking-tight">{title}</h2>
          <p className="x-muted mt-1 max-w-2xl text-xs leading-5 sm:text-sm">{description}</p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button onClick={() => scroll(-1)} disabled={!items.length} className="focus-ring x-border x-text grid h-10 w-10 place-items-center rounded-full border hover:bg-[var(--surface-raised)] disabled:opacity-30" aria-label={`Scroll ${title} left`}><ChevronLeft size={18} /></button>
          <button onClick={() => scroll(1)} disabled={!items.length} className="focus-ring x-border x-text grid h-10 w-10 place-items-center rounded-full border hover:bg-[var(--surface-raised)] disabled:opacity-30" aria-label={`Scroll ${title} right`}><ChevronRight size={18} /></button>
        </div>
      </div>
      {items.length ? (
        <div ref={scroller} className="event-carousel -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-5 sm:gap-4 sm:px-5">
          {items.map((entry) => <RepositoryCard key={entry.key} entry={entry} onOpen={() => onOpen(entry.key)} />)}
        </div>
      ) : (
        <div className="x-border x-muted flex min-h-36 items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm">No repository has enough current evidence for this section and these filters.</div>
      )}
    </section>
  );
}

function RepositoryCard({ entry, onOpen }: { entry: RankedRepository; onOpen: () => void }) {
  const { primary: item, issues, reason } = entry;
  const stars = item.repositoryQuality?.stars;
  const guidance = item.repositoryGuidance;
  return (
    <article className="card w-[min(82vw,292px)] shrink-0 snap-start overflow-hidden sm:w-[292px]">
      <button onClick={onOpen} className="focus-ring group flex min-h-[250px] w-full flex-col p-4 text-left hover:bg-[var(--surface-raised)]" aria-label={`View ${entry.key} contribution guide and open issues`}>
        <div className="flex w-full items-center gap-3">
          <Avatar initials={item.avatar} fallback={item.owner} />
          <div className="min-w-0 flex-1">
            <p className="mono x-muted truncate text-[11px]">{item.owner}</p>
            <h3 className="mono x-text truncate text-sm font-bold">{item.repo}</h3>
          </div>
          <ChevronRight size={18} className="x-muted shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="x-muted mt-4 line-clamp-2 min-h-10 text-xs leading-5">{item.repositoryDescription || item.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="x-border x-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.languageColor }} />{item.language}</span>
          <span className="x-border x-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"><CircleDot size={11} />{issues.length} checked {issues.length === 1 ? "issue" : "issues"}</span>
          {stars != null && stars > 0 && <span className="x-border x-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"><Star size={11} />{compactNumber(stars)}</span>}
        </div>
        <p className="x-muted mt-auto border-l-2 x-border pt-5 pl-2 text-[11px] leading-4">{reason}</p>
        <p className="x-text mt-3 text-xs font-bold">{guidance ? "Read contribution rules and choose an issue" : "View repository and choose an issue"} <span aria-hidden>→</span></p>
      </button>
    </article>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
