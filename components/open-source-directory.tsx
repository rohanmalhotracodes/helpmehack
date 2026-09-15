"use client";

import { useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, CircleDot, Search, Star, X } from "lucide-react";
import type { RankedContribution } from "@/lib/open-source-tiers";
import { isDisplayableOpportunityStatus, rankOpenSourceTiers } from "@/lib/open-source-tiers";
import type { OpenSourceOpportunity } from "@/lib/types";
import { Avatar } from "./ui";
import { NewsletterSignup } from "./newsletter-signup";
import { prefetchRepositoryOpportunities } from "./repository-panel";

type RankedRepository = {
  key: string;
  primary: OpenSourceOpportunity;
  issues: OpenSourceOpportunity[];
  matchingIssueCount: number;
  reason: string;
  rank: number;
};

type RepositorySort = "recommended" | "recent" | "adoption";

export function OpenSourceDirectory({ records, savedRepositoryIds, savedIssueIds, onSaveRepository, onOpenRepository }: {
  records: OpenSourceOpportunity[];
  savedRepositoryIds: string[];
  savedIssueIds: string[];
  onSaveRepository: (key: string) => void;
  onOpenRepository: (key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("All");
  const [sort, setSort] = useState<RepositorySort>("recommended");
  const [savedOnly, setSavedOnly] = useState(false);
  const technologies = useMemo(() => {
    const counts = new Map<string, number>();
    const repositories = new Set<string>();
    for (const item of records) {
      const key = `${item.owner}/${item.repo}`;
      for (const value of item.technologies?.length ? item.technologies : [item.language]) {
        if (value === "Unknown") continue;
        const pair = `${key}\u0000${value}`;
        if (repositories.has(pair)) continue;
        repositories.add(pair);
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, [records]);
  const filtered = useMemo(() => records.filter((item) => {
    const needle = query.trim().toLowerCase();
    const key = `${item.owner}/${item.repo}`;
    const stack = item.technologies?.length ? item.technologies : [item.language];
    const queryMatch = !needle || `${item.owner} ${item.repo} ${item.title} ${item.summary} ${item.repositoryDescription ?? ""} ${item.labels.join(" ")} ${stack.join(" ")}`.toLowerCase().includes(needle);
    const savedMatch = !savedOnly || savedRepositoryIds.includes(key) || savedIssueIds.includes(item.id);
    return queryMatch && savedMatch && (technology === "All" || stack.includes(technology));
  }), [query, records, savedIssueIds, savedOnly, savedRepositoryIds, technology]);
  const tiers = useMemo(() => rankOpenSourceTiers(filtered).map((tier) => ({
    ...tier,
    repositories: groupRepositories(tier.items, filtered, sort),
  })), [filtered, sort]);
  const visibleCount = new Set(tiers.flatMap((tier) => tier.repositories.map((entry) => entry.key))).size;
  const filtersActive = Boolean(query) || technology !== "All" || savedOnly;

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1240px] px-3 py-6 sm:px-5 sm:py-8">
      <header>
        <h1 className="x-text text-2xl font-bold tracking-tight sm:text-3xl">Open source worth starting.</h1>
      </header>

      <section className="mt-5" aria-label="Search and filter open-source repositories">
        <div className="flex max-w-4xl flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="x-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring placeholder-muted x-border x-text h-12 w-full rounded-full border bg-transparent pl-11 pr-11 text-sm" placeholder="Search repositories, technologies, or issue labels" aria-label="Search open-source repositories" />
            {query && <button onClick={() => setQuery("")} className="focus-ring x-muted absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-[var(--surface-raised)]" aria-label="Clear search"><X size={16} /></button>}
          </div>
          <select value={sort} onChange={(event) => setSort(event.target.value as RepositorySort)} className="focus-ring x-border x-text h-12 rounded-full border bg-[var(--background)] px-4 text-sm font-semibold" aria-label="Sort repositories">
            <option value="recommended">Best current fit</option>
            <option value="recent">Recently updated</option>
            <option value="adoption">Most established</option>
          </select>
          <button onClick={() => setSavedOnly((value) => !value)} aria-pressed={savedOnly} className={`focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold ${savedOnly ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}><Bookmark size={16} fill={savedOnly ? "currentColor" : "none"} />Saved{savedRepositoryIds.length ? ` ${savedRepositoryIds.length}` : ""}</button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">Technologies in current results</p>
          {filtersActive && <button onClick={() => { setQuery(""); setTechnology("All"); setSavedOnly(false); }} className="focus-ring x-muted rounded text-xs font-semibold underline underline-offset-4 hover:text-[var(--text)]">Clear filters</button>}
        </div>
        <div className="event-carousel mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by repository technology">
          <button onClick={() => setTechnology("All")} aria-pressed={technology === "All"} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${technology === "All" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>All</button>
          {technologies.map((item) => <button key={item.name} onClick={() => setTechnology(item.name)} aria-pressed={technology === item.name} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${technology === item.name ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>{item.name} <span className="opacity-60">{item.count}</span></button>)}
        </div>
        <p className="x-muted mt-3 text-xs">{visibleCount} {visibleCount === 1 ? "repository" : "repositories"} match the current view.</p>
      </section>

      <div className="mt-8 space-y-10">
        {tiers.map((tier) => <RepositoryTierSection key={tier.id} title={tier.title} description={tier.description} items={tier.repositories} savedRepositoryIds={savedRepositoryIds} onSave={onSaveRepository} onOpen={onOpenRepository} />)}
      </div>

      <NewsletterSignup />
    </main>
  );
}

function groupRepositories(entries: RankedContribution[], allIssues: OpenSourceOpportunity[], sort: RepositorySort): RankedRepository[] {
  const grouped = new Map<string, RankedRepository>();
  for (const entry of entries) {
    const key = `${entry.item.owner}/${entry.item.repo}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        key,
        primary: entry.item,
        issues: allIssues.filter((item) => `${item.owner}/${item.repo}` === key && isDisplayableOpportunityStatus(item.status)),
        matchingIssueCount: entry.item.matchingIssueCount ?? 1,
        reason: entry.reason,
        rank: entry.rank,
      });
    } else if (entry.rank > existing.rank) {
      existing.primary = entry.item;
      existing.reason = entry.reason;
      existing.rank = entry.rank;
    }
    const current = grouped.get(key);
    if (current) current.matchingIssueCount = Math.max(current.matchingIssueCount, entry.item.matchingIssueCount ?? 1);
  }
  return [...grouped.values()].sort((a, b) => {
    if (sort === "recent") return Date.parse(b.primary.updatedAt) - Date.parse(a.primary.updatedAt);
    if (sort === "adoption") return (b.primary.repositoryQuality?.stars ?? 0) - (a.primary.repositoryQuality?.stars ?? 0);
    return b.rank - a.rank;
  });
}

function RepositoryTierSection({ title, description, items, savedRepositoryIds, onSave, onOpen }: { title: string; description: string; items: RankedRepository[]; savedRepositoryIds: string[]; onSave: (key: string) => void; onOpen: (key: string) => void }) {
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
          {items.map((entry) => <RepositoryCard key={entry.key} entry={entry} saved={savedRepositoryIds.includes(entry.key)} onSave={() => onSave(entry.key)} onOpen={() => onOpen(entry.key)} />)}
        </div>
      ) : (
        <div className="x-border x-muted flex min-h-36 items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm">No repository has enough current evidence for this section and these filters.</div>
      )}
    </section>
  );
}

function RepositoryCard({ entry, saved, onSave, onOpen }: { entry: RankedRepository; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const { primary: item, reason } = entry;
  const stars = item.repositoryQuality?.stars;
  const guidance = item.repositoryGuidance;
  const tiersKey = [...new Set(entry.issues.flatMap((issue) => issue.discoveryTiers ?? item.discoveryTiers ?? []))].join(",");
  const prefetch = () => {
    void prefetchRepositoryOpportunities(item.owner, item.repo, tiersKey).catch(() => undefined);
  };
  return (
    <article onMouseEnter={prefetch} onFocusCapture={prefetch} onPointerDown={prefetch} className="card group relative min-h-[270px] w-[min(82vw,292px)] shrink-0 snap-start overflow-hidden p-4 transition-colors hover:bg-[var(--surface-raised)] sm:w-[292px]">
      <button type="button" onClick={onOpen} className="focus-ring absolute inset-0 z-0 cursor-pointer rounded-[inherit]" aria-label={`View ${entry.key} contribution guide and open issues`} />
      <div className="pointer-events-none relative z-10 flex h-full min-h-[238px] flex-col">
        <div className="flex w-full items-center gap-3">
          <Avatar initials={item.avatar} fallback={item.owner} />
          <div className="min-w-0 flex-1">
            <p className="mono x-muted truncate text-[11px]">{item.owner}</p>
            <h3 className="mono x-text truncate text-sm font-bold">{item.repo}</h3>
          </div>
          <button type="button" onClick={onSave} aria-pressed={saved} className="focus-ring x-muted pointer-events-auto grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-[var(--background)]" aria-label={saved ? `Remove ${entry.key} from saved repositories` : `Save ${entry.key}`}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button>
        </div>
        <p className="x-muted mt-4 line-clamp-2 min-h-10 text-xs leading-5">{item.repositoryDescription || item.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="x-border x-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.languageColor }} />{item.language}</span>
          <span className="x-border x-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"><CircleDot size={11} />Contribution issues</span>
          {stars != null && stars > 0 && <span className="x-border x-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"><Star size={11} />{compactNumber(stars)}</span>}
        </div>
        <p className="x-muted mt-auto border-l-2 x-border pt-5 pl-2 text-[11px] leading-4">{reason}</p>
        <div className="x-text mt-3 flex items-center justify-between text-left text-xs font-bold"><span>{guidance ? "Read rules and choose an issue" : "View repository issues"}</span><ChevronRight size={16} className="x-muted transition-transform group-hover:translate-x-0.5" /></div>
      </div>
    </article>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
