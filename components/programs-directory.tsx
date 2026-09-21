"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Code2, Search, X } from "lucide-react";
import type { ProgramOrganization } from "@/lib/program-directory";

type ProgramKind = "gsoc" | "summer-of-bitcoin";

export function ProgramsDirectory({
  gsoc,
  summerOfBitcoin,
}: {
  gsoc: ProgramOrganization[];
  summerOfBitcoin: ProgramOrganization[];
}) {
  const [program, setProgram] = useState<ProgramKind>("gsoc");
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("All");

  const source = program === "gsoc" ? gsoc : summerOfBitcoin;
  const technologies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const organization of source) {
      for (const item of new Set(organization.technologies)) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 24);
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
        ...organization.repositories.map((repository) => repository.label),
      ].join(" ").toLowerCase();
      return (!needle || stack.includes(needle))
        && (technology === "All" || organization.technologies.includes(technology));
    });
  }, [query, source, technology]);

  const switchProgram = (next: ProgramKind) => {
    setProgram(next);
    setQuery("");
    setTechnology("All");
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1240px] px-3 py-8 sm:px-5 sm:py-12">
      <header className="max-w-3xl">
        <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Annual open-source programs</p>
        <h1 className="x-text mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Find organizations before application season.</h1>
        <p className="x-muted mt-5 max-w-[68ch] text-base leading-7 sm:text-lg">
          Browse the 2026 mentoring organizations for Google Summer of Code and Summer of Bitcoin without mixing them into the live contribution feed.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Programs">
        <button
          type="button"
          role="tab"
          aria-selected={program === "gsoc"}
          onClick={() => switchProgram("gsoc")}
          className={`focus-ring rounded-full border px-5 py-2.5 text-sm font-bold ${program === "gsoc" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}
        >
          GSoC 2026 <span className="ml-1 opacity-70">{gsoc.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={program === "summer-of-bitcoin"}
          onClick={() => switchProgram("summer-of-bitcoin")}
          className={`focus-ring rounded-full border px-5 py-2.5 text-sm font-bold ${program === "summer-of-bitcoin" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}
        >
          Summer of Bitcoin 2026 <span className="ml-1 opacity-70">{summerOfBitcoin.length}</span>
        </button>
      </div>

      <section className="mt-7" aria-label="Program directory filters">
        <div className="flex max-w-4xl flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="x-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="focus-ring placeholder-muted x-border x-text h-12 w-full rounded-full border bg-transparent pl-11 pr-11 text-sm"
              placeholder="Search organizations, technologies, topics, or project repos"
              aria-label="Search program organizations"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="focus-ring x-muted absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-[var(--surface-raised)]"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="event-carousel mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by technology">
          <button
            type="button"
            onClick={() => setTechnology("All")}
            aria-pressed={technology === "All"}
            className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${technology === "All" ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}
          >
            All
          </button>
          {technologies.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setTechnology(name)}
              aria-pressed={technology === name}
              className={`focus-ring h-9 shrink-0 rounded-full border px-4 text-xs font-semibold ${technology === name ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}
            >
              {name} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
        <p className="x-muted mt-3 text-xs">{filtered.length} {filtered.length === 1 ? "organization" : "organizations"} match the current view.</p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((organization) => (
          <article key={organization.id} className="card flex min-h-[300px] flex-col p-5">
            <div>
              <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">{organization.category}</p>
              <h2 className="x-text mt-2 text-xl font-bold tracking-tight">{organization.name}</h2>
              <p className="x-muted mt-3 line-clamp-4 text-sm leading-6">{organization.description}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {organization.technologies.slice(0, 5).map((item) => (
                <span key={item} className="x-border x-text rounded-full border px-2.5 py-1 text-[10px] font-semibold">{item}</span>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              {organization.repositories.length > 0 ? (
                organization.repositories.map((repository) => (
                  <a
                    key={repository.url}
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring x-border x-text flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold hover:bg-[var(--surface-raised)]"
                  >
                    <span className="flex min-w-0 items-center gap-2"><Code2 size={15} className="shrink-0" /><span className="truncate">{repository.label}</span></span>
                    <ArrowUpRight size={14} className="x-muted shrink-0" />
                  </a>
                ))
              ) : (
                <p className="x-muted text-xs leading-5">No direct project-code repository was published in the yearly dataset.</p>
              )}
            </div>

            <div className="mt-auto flex flex-wrap gap-4 pt-5 text-xs font-semibold">
              <a href={organization.programUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted rounded hover:text-[var(--text)] hover:underline">
                Program page <ArrowUpRight size={12} className="ml-1 inline" />
              </a>
              {organization.websiteUrl && (
                <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted rounded hover:text-[var(--text)] hover:underline">
                  Organization <ArrowUpRight size={12} className="ml-1 inline" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      {!filtered.length && (
        <div className="x-border x-muted mt-8 rounded-xl border border-dashed px-6 py-14 text-center text-sm">
          No organization matches those filters.
        </div>
      )}

      <p className="x-muted mt-8 text-xs leading-5">
        GSoC organization data is cached from the 2026 GSoC Organizations dataset and refreshed monthly. Summer of Bitcoin entries are curated from the official 2026 organization announcement and linked source repositories.
      </p>
    </main>
  );
}
