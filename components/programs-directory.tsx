"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Code2, Search, X } from "lucide-react";
import type { ProgramOrganizationSummary } from "@/lib/program-directory";

type ProgramKind = "gsoc" | "summer-of-bitcoin";

export function ProgramsDirectory({
  gsoc,
  summerOfBitcoin,
}: {
  gsoc: ProgramOrganizationSummary[];
  summerOfBitcoin: ProgramOrganizationSummary[];
}) {
  const [program, setProgram] = useState<ProgramKind>("gsoc");
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("All");
  const [year, setYear] = useState<number | "All">(2026);

  const source = program === "gsoc" ? gsoc : summerOfBitcoin;
  const availableYears = useMemo(
    () => [...new Set(source.flatMap((organization) => organization.years.map((item) => item.year)))].sort((a, b) => b - a),
    [source],
  );
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
      const yearMatch = year === "All" || organization.years.some((item) => item.year === year);
      return (!needle || stack.includes(needle))
        && (technology === "All" || organization.technologies.includes(technology))
        && yearMatch;
    });
  }, [query, source, technology, year]);

  const switchProgram = (next: ProgramKind) => {
    setProgram(next);
    setQuery("");
    setTechnology("All");
    setYear(2026);
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1240px] px-3 py-8 sm:px-5 sm:py-12">
      <header className="max-w-3xl">
        <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Annual open-source programs</p>
        <h1 className="x-text mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Find organizations before application season.</h1>
        <p className="x-muted mt-5 max-w-[68ch] text-base leading-7 sm:text-lg">
          Explore mentoring organizations, their participation history, technologies, and past projects without leaving the HelpMeHack experience.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Programs">
        <button type="button" role="tab" aria-selected={program === "gsoc"} onClick={() => switchProgram("gsoc")} className={`focus-ring rounded-full border px-5 py-2.5 text-sm font-bold ${program === "gsoc" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>
          GSoC <span className="ml-1 opacity-70">{gsoc.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={program === "summer-of-bitcoin"} onClick={() => switchProgram("summer-of-bitcoin")} className={`focus-ring rounded-full border px-5 py-2.5 text-sm font-bold ${program === "summer-of-bitcoin" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>
          Summer of Bitcoin <span className="ml-1 opacity-70">{summerOfBitcoin.length}</span>
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
            <button type="button" onClick={() => setYear("All")} aria-pressed={year === "All"} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${year === "All" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>All years</button>
            {availableYears.map((item) => <button key={item} type="button" onClick={() => setYear(item)} aria-pressed={year === item} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${year === item ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>{item}</button>)}
          </div>
        </div>

        <div className="mt-4">
          <p className="x-muted mb-2 text-[11px] font-semibold uppercase tracking-[.12em]">Technology</p>
          <div className="event-carousel flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setTechnology("All")} aria-pressed={technology === "All"} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${technology === "All" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>All</button>
            {technologies.map(([name, count]) => <button key={name} type="button" onClick={() => setTechnology(name)} aria-pressed={technology === name} className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${technology === name ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}>{name} <span className="opacity-60">{count}</span></button>)}
          </div>
        </div>
        <p className="x-muted mt-3 text-xs">{filtered.length} {filtered.length === 1 ? "organization" : "organizations"} match the current view.</p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((organization) => (
          <article key={organization.id} className="card flex min-h-[340px] flex-col p-5">
            <div className="flex items-start gap-4">
              <div className="x-border grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border bg-[var(--surface-raised)]" style={organization.imageBackgroundColor ? { backgroundColor: organization.imageBackgroundColor } : undefined}>
                {organization.imageUrl ? <img src={organization.imageUrl} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" /> : <span className="x-text text-lg font-bold">{organization.name.slice(0, 2).toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">{organization.category}</p>
                <h2 className="x-text mt-1 text-xl font-bold tracking-tight">{organization.name}</h2>
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

            {organization.latestRepositories.length > 0 && (
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

      {!filtered.length && <div className="x-border x-muted mt-8 rounded-xl border border-dashed px-6 py-14 text-center text-sm">No organization matches those filters.</div>}

      <p className="x-muted mt-8 text-xs leading-5">
        GSoC data includes historical participation and project links and is cached for 30 days. Summer of Bitcoin entries are curated from the official 2026 organization announcement.
      </p>
    </main>
  );
}
