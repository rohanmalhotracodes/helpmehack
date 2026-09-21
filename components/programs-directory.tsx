"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Code2, Search, X } from "lucide-react";
import type { ProgramOrganizationSummary, SummerOfBitcoinYearArchive } from "@/lib/program-directory";
import { programsFaq } from "@/lib/seo-content";
import { SeoFaq } from "./seo-faq";

type ProgramKind = "gsoc" | "summer-of-bitcoin";

export function ProgramsDirectory({
  gsoc,
  summerOfBitcoin,
  summerOfBitcoinYears,
}: {
  gsoc: ProgramOrganizationSummary[];
  summerOfBitcoin: ProgramOrganizationSummary[];
  summerOfBitcoinYears: SummerOfBitcoinYearArchive[];
}) {
  const [program, setProgram] = useState<ProgramKind>("gsoc");
  const [query, setQuery] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([2026]);

  const source = program === "gsoc" ? gsoc : summerOfBitcoin;

  const availableYears = useMemo(() => {
    if (program === "summer-of-bitcoin") return summerOfBitcoinYears.map((item) => item.year).sort((a, b) => b - a);
    return [...new Set(gsoc.flatMap((organization) => organization.years.map((item) => item.year)))].sort((a, b) => b - a);
  }, [gsoc, program, summerOfBitcoinYears]);

  const technologies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const organization of source) {
      for (const item of new Set(organization.technologies)) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 24);
  }, [source]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return source.filter((organization) => {
      const stack = [
        organization.name,
        organization.description,
        organization.category,
        ...organization.technologies,
        ...organization.topics,
        ...organization.latestRepositories.map((repository) => repository.label),
      ].join(" ").toLowerCase();
      const yearMatch = selectedYears.length === 0 || organization.years.some((item) => selectedYears.includes(item.year));
      const technologyMatch = selectedTechnologies.length === 0 || organization.technologies.some((item) => selectedTechnologies.includes(item));
      return (!needle || stack.includes(needle)) && technologyMatch && yearMatch;
    });
  }, [query, selectedTechnologies, selectedYears, source]);

  const visibleSummerYears = useMemo(() => {
    if (program !== "summer-of-bitcoin") return [];
    return summerOfBitcoinYears.filter((item) => selectedYears.length === 0 || selectedYears.includes(item.year));
  }, [program, selectedYears, summerOfBitcoinYears]);

  const toggleYear = (value: number) => {
    setSelectedYears((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };

  const toggleTechnology = (value: string) => {
    setSelectedTechnologies((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };

  const switchProgram = (next: ProgramKind) => {
    setProgram(next);
    setQuery("");
    setSelectedTechnologies([]);
    setSelectedYears([2026]);
  };

  const filtersActive = Boolean(query) || selectedYears.length > 0 || selectedTechnologies.length > 0;

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1240px] px-3 py-8 sm:px-5 sm:py-12">
      <header className="max-w-3xl">
        <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Annual open-source programs</p>
        <h1 className="x-text mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Find organizations before application season.</h1>
        <p className="x-muted mt-5 max-w-[68ch] text-base leading-7 sm:text-lg">
          Explore mentoring organizations, participation history, technologies, and past projects without leaving the HelpMeHack experience.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Programs">
        <button type="button" role="tab" aria-selected={program === "gsoc"} onClick={() => switchProgram("gsoc")} className={`focus-ring rounded-full border px-5 py-2.5 text-sm font-bold ${program === "gsoc" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>
          GSoC <span className="ml-1 opacity-70">{gsoc.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={program === "summer-of-bitcoin"} onClick={() => switchProgram("summer-of-bitcoin")} className={`focus-ring rounded-full border px-5 py-2.5 text-sm font-bold ${program === "summer-of-bitcoin" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>
          Summer of Bitcoin <span className="ml-1 opacity-70">2021–2026</span>
        </button>
      </div>

      <section className="mt-7" aria-label="Program directory filters">
        <div className="relative max-w-4xl">
          <Search size={17} className="x-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring placeholder-muted x-border x-text h-12 w-full rounded-full border bg-transparent pl-11 pr-11 text-sm" placeholder="Search organizations, technologies, topics, or repositories" aria-label="Search program organizations" />
          {query && <button type="button" onClick={() => setQuery("")} className="focus-ring x-muted absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-[var(--surface-raised)]" aria-label="Clear search"><X size={16} /></button>}
        </div>

        <div className="mt-4">
          <p className="x-muted mb-2 text-[11px] font-semibold uppercase tracking-[.12em]">Participation year</p>
          <div className="event-carousel flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setSelectedYears([])} aria-pressed={selectedYears.length === 0} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${selectedYears.length === 0 ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>All years</button>
            {availableYears.map((item) => {
              const selected = selectedYears.includes(item);
              return <button key={item} type="button" onClick={() => toggleYear(item)} aria-pressed={selected} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${selected ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>{item}</button>;
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="x-muted mb-2 text-[11px] font-semibold uppercase tracking-[.12em]">Technology</p>
          <div className="event-carousel flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setSelectedTechnologies([])} aria-pressed={selectedTechnologies.length === 0} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${selectedTechnologies.length === 0 ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>All</button>
            {technologies.map(([name, count]) => {
              const selected = selectedTechnologies.includes(name);
              return <button key={name} type="button" onClick={() => toggleTechnology(name)} aria-pressed={selected} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${selected ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>{name} <span className="opacity-60">{count}</span></button>;
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="x-muted text-xs">{filtered.length} {filtered.length === 1 ? "organization" : "organizations"} match the current organization view.</p>
          {filtersActive && <button type="button" onClick={() => { setQuery(""); setSelectedYears([]); setSelectedTechnologies([]); }} className="focus-ring x-muted rounded text-xs font-semibold underline underline-offset-4 hover:text-[var(--text)]">Clear filters</button>}
        </div>
      </section>

      {program === "summer-of-bitcoin" && (
        <section className="mt-8" aria-labelledby="sob-year-archive">
          <div className="mb-4">
            <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Complete program history</p>
            <h2 id="sob-year-archive" className="x-text mt-1 text-2xl font-bold tracking-tight">Summer of Bitcoin 2021–2026</h2>
            <p className="x-muted mt-2 max-w-[70ch] text-sm leading-6">Each cohort links to the official published year/project source. The organization cards below are currently richest for 2026 while older cohort data is kept separate from the live repository index.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleSummerYears.map((item) => (
              <article key={item.year} className="card flex min-h-[190px] flex-col p-5">
                <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Cohort</p>
                <h3 className="x-text mt-1 text-2xl font-bold">{item.year}</h3>
                <p className="x-muted mt-3 text-sm leading-6">{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold">
                  {item.contributors != null && <span className="x-border x-text rounded-full border px-2.5 py-1">{item.contributors} contributors</span>}
                  {item.organizationCount != null && <span className="x-border x-text rounded-full border px-2.5 py-1">{item.organizationCount} organizations</span>}
                  {item.projectCount != null && <span className="x-border x-text rounded-full border px-2.5 py-1">{item.projectCount} projects</span>}
                </div>
                <a href={item.officialUrl} target="_blank" rel="noreferrer" className="focus-ring x-text mt-auto inline-flex items-center gap-1.5 self-start rounded pt-5 text-xs font-bold hover:underline">
                  Official cohort / projects <ArrowUpRight size={13} />
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="organization-results">
        <div className="mb-4">
          <h2 id="organization-results" className="x-text text-xl font-bold tracking-tight">
            {program === "summer-of-bitcoin" ? "Documented organizations" : "Organizations"}
          </h2>
          {program === "summer-of-bitcoin" && selectedYears.some((item) => item < 2026) && !selectedYears.includes(2026) && (
            <p className="x-muted mt-2 text-sm leading-6">Use the cohort cards above for the complete official list for older years. Organization-level cards below currently contain the curated 2026 repository mappings.</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((organization) => (
            <article key={organization.id} className="card flex min-h-[340px] flex-col p-5">
              <div className="flex items-start gap-4">
                <div className="x-border grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border bg-[var(--surface-raised)]" style={organization.imageBackgroundColor ? { backgroundColor: organization.imageBackgroundColor } : undefined}>
                  {organization.imageUrl ? <img src={organization.imageUrl} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" /> : <span className="x-text text-lg font-bold">{organization.name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="min-w-0">
                  <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">{organization.category}</p>
                  <h3 className="x-text mt-1 text-xl font-bold tracking-tight">{organization.name}</h3>
                </div>
              </div>

              <p className="x-muted mt-4 line-clamp-3 text-sm leading-6">{organization.description}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {organization.years.slice(0, 7).map((item) => <span key={item.year} className="x-border x-text rounded-full border px-2.5 py-1 text-[10px] font-semibold">{item.year}</span>)}
                {organization.years.length > 7 && <span className="x-muted px-1 py-1 text-[10px] font-semibold">+{organization.years.length - 7}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {organization.technologies.slice(0, 5).map((item) => <span key={item} className="x-border x-text rounded-full border px-2.5 py-1 text-[10px] font-semibold">{item}</span>)}
              </div>

              {program === "summer-of-bitcoin" && organization.latestRepositories.length > 0 && (
                <div className="mt-5 space-y-2">
                  {organization.latestRepositories.slice(0, 2).map((repository) => (
                    <a key={repository.url} href={repository.url} target="_blank" rel="noreferrer" className="focus-ring x-border x-text flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold hover:bg-[var(--surface-raised)]">
                      <span className="flex min-w-0 items-center gap-2"><Code2 size={15} className="shrink-0" /><span className="truncate">{repository.label}</span></span>
                      <ArrowUpRight size={14} className="x-muted shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-4 pt-5 text-xs font-semibold">
                {program === "gsoc" ? (
                  <Link href={"/programs/gsoc/" + organization.slug} className="focus-ring x-text rounded hover:underline">
                    View years & projects <ArrowUpRight size={12} className="ml-1 inline" />
                  </Link>
                ) : (
                  <a href={organization.years[0]?.programUrl} target="_blank" rel="noreferrer" className="focus-ring x-text rounded hover:underline">
                    Official program <ArrowUpRight size={12} className="ml-1 inline" />
                  </a>
                )}
                {organization.websiteUrl && <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted rounded hover:text-[var(--text)] hover:underline">Organization</a>}
              </div>
            </article>
          ))}
        </div>

        {!filtered.length && (
          <div className="x-border x-muted mt-4 rounded-xl border border-dashed px-6 py-10 text-center text-sm">
            {program === "summer-of-bitcoin" && selectedYears.some((item) => item < 2026)
              ? "No curated organization cards are attached to this older cohort yet. Use the official cohort archive above for its complete published projects."
              : "No organization matches those filters."}
          </div>
        )}
      </section>

      <section aria-labelledby="program-guide-title" className="x-border mt-12 border-t pt-8">
        <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Use history as context</p>
        <h2 id="program-guide-title" className="x-text mt-2 max-w-[760px] text-2xl font-bold tracking-tight sm:text-3xl">
          Explore GSoC organizations and open-source programs without guessing from a single year.
        </h2>
        <p className="x-muted mt-4 max-w-[72ch] text-base leading-7">
          Participation history can show which communities have mentored contributors, what technologies they use, and what kinds of projects have been proposed. It does not guarantee that an organization will return in a future cohort, so use HelpMeHack for research and confirm the active program list with the official source.
        </p>
        <div className="mt-7 grid gap-6 md:grid-cols-3">
          <article className="x-border border-t pt-5">
            <h3 className="x-text text-base font-semibold">Filter by multiple years</h3>
            <p className="x-muted mt-2 text-sm leading-6">Compare repeated participation across years instead of treating one appearance as a long-term signal.</p>
          </article>
          <article className="x-border border-t pt-5">
            <h3 className="x-text text-base font-semibold">Filter by technologies</h3>
            <p className="x-muted mt-2 text-sm leading-6">Narrow organizations by languages and tools you already know, then inspect their past projects and contribution paths.</p>
          </article>
          <article className="x-border border-t pt-5">
            <h3 className="x-text text-base font-semibold">Continue beyond programs</h3>
            <p className="x-muted mt-2 text-sm leading-6">A program application is only one way into open source. You can also browse active repositories and contribute directly throughout the year.</p>
          </article>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/open-source-projects" className="focus-ring rounded underline underline-offset-4">Browse open-source projects</Link>
          <Link href="/contribute" className="focus-ring rounded underline underline-offset-4">Ways to contribute</Link>
          <Link href="/contribute/first-issue" className="focus-ring rounded underline underline-offset-4">Choose a good first issue</Link>
        </div>
      </section>

      <SeoFaq
        questions={programsFaq}
        className="mt-12"
        intro="Answers about HelpMeHack's GSoC and Summer of Bitcoin program data."
      />

      <p className="x-muted mt-8 text-xs leading-5">
        GSoC data includes historical participation and project links and is cached for 30 days. Summer of Bitcoin covers every cohort from 2021 through 2026, with official year links and curated repository mappings where available.
      </p>
    </main>
  );
}
