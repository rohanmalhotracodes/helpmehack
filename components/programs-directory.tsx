"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Code2, ExternalLink, Search, X } from "lucide-react";
import type { ProgramOrganization, ProgramOrganizationSummary, SummerOfBitcoinYearArchive } from "@/lib/program-directory";
import { programsFaq } from "@/lib/seo-content";
import { SeoFaq } from "./seo-faq";

type ProgramKind = "gsoc" | "summer-of-bitcoin";

function ProjectHistoryChart({ organization }: { organization: ProgramOrganizationSummary }) {
  const years = [...organization.years].sort((a, b) => a.year - b.year);
  const maxProjects = Math.max(1, ...years.map((item) => item.projectCount));

  return (
    <div className="space-y-2" aria-label={"Projects by year for " + organization.name}>
      {years.map((item) => (
        <div key={item.year} className="grid grid-cols-[50px_1fr_38px] items-center gap-3 text-xs">
          <span className="x-muted font-semibold">{item.year}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
            <div
              className="h-full rounded-full bg-[var(--text)] opacity-80"
              style={{ width: item.projectCount === 0 ? "0%" : Math.max(5, (item.projectCount / maxProjects) * 100) + "%" }}
            />
          </div>
          <span className="x-text text-right font-bold">{item.projectCount}</span>
        </div>
      ))}
    </div>
  );
}

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
  const [selectedOrganization, setSelectedOrganization] = useState<ProgramOrganizationSummary | null>(null);
  const [selectedModalYear, setSelectedModalYear] = useState<number | null>(null);
  const [detailsBySlug, setDetailsBySlug] = useState<Record<string, ProgramOrganization>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const detailRequests = useRef(new Map<string, Promise<ProgramOrganization>>());

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

  const selectedDetails = selectedOrganization ? detailsBySlug[selectedOrganization.slug] : null;
  const selectedError = selectedOrganization ? detailErrors[selectedOrganization.slug] : null;
  const modalYears = selectedOrganization
    ? [...selectedOrganization.years].sort((a, b) => b.year - a.year)
    : [];
  const selectedYearDetails = selectedDetails?.years.find((item) => item.year === selectedModalYear);
  const selectedYearSummary = selectedOrganization?.years.find((item) => item.year === selectedModalYear);
  const selectedTotalProjects = selectedOrganization?.years.reduce((total, item) => total + item.projectCount, 0) ?? 0;

  useEffect(() => {
    if (!selectedOrganization) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedOrganization(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedOrganization]);

  const ensureGsocDetails = (organization: ProgramOrganizationSummary, reportError = false) => {
    const cached = detailsBySlug[organization.slug];
    if (cached) return Promise.resolve(cached);

    const pending = detailRequests.current.get(organization.slug);
    if (pending) return pending;

    const request = fetch("/api/programs/gsoc/" + encodeURIComponent(organization.slug))
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load project details.");
        return response.json() as Promise<ProgramOrganization>;
      })
      .then((details) => {
        detailRequests.current.delete(organization.slug);
        setDetailsBySlug((current) => ({ ...current, [organization.slug]: details }));
        setDetailErrors((current) => {
          if (!current[organization.slug]) return current;
          const next = { ...current };
          delete next[organization.slug];
          return next;
        });
        return details;
      })
      .catch((error: unknown) => {
        detailRequests.current.delete(organization.slug);
        if (reportError) {
          setDetailErrors((current) => ({
            ...current,
            [organization.slug]: error instanceof Error ? error.message : "Could not load project details.",
          }));
        }
        throw error;
      });

    detailRequests.current.set(organization.slug, request);
    return request;
  };

  const openGsocOrganization = (organization: ProgramOrganizationSummary) => {
    const latestYear = [...organization.years].sort((a, b) => b.year - a.year)[0]?.year ?? null;
    setSelectedModalYear(latestYear);
    setSelectedOrganization(organization);
    setDetailErrors((current) => {
      if (!current[organization.slug]) return current;
      const next = { ...current };
      delete next[organization.slug];
      return next;
    });
    void ensureGsocDetails(organization, true).catch(() => undefined);
  };

  const prefetchGsocOrganization = (organization: ProgramOrganizationSummary) => {
    void ensureGsocDetails(organization, false).catch(() => undefined);
  };

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
    setSelectedOrganization(null);
  };

  const filtersActive = Boolean(query) || selectedYears.length > 0 || selectedTechnologies.length > 0;

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1240px] px-3 py-8 sm:px-5 sm:py-12">
      <header className="max-w-3xl">
        <div>
          <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Annual open-source programs</p>
          <h1 className="x-text mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Find organizations before application season.</h1>
          <p className="x-muted mt-5 max-w-[68ch] text-base leading-7 sm:text-lg">
            Explore mentoring organizations, participation history, technologies, and past projects without leaving the helpmehack experience.
          </p>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Programs">
        <button type="button" role="tab" aria-selected={program === "gsoc"} onClick={() => switchProgram("gsoc")} className={program === "gsoc" ? "focus-ring x-primary rounded-full border border-transparent px-5 py-2.5 text-sm font-bold" : "focus-ring x-border x-text rounded-full border px-5 py-2.5 text-sm font-bold hover:bg-[var(--surface-raised)]"}>
          GSoC <span className="ml-1 opacity-70">{gsoc.length} orgs</span>
        </button>
        <button type="button" role="tab" aria-selected={program === "summer-of-bitcoin"} onClick={() => switchProgram("summer-of-bitcoin")} className={program === "summer-of-bitcoin" ? "focus-ring x-primary rounded-full border border-transparent px-5 py-2.5 text-sm font-bold" : "focus-ring x-border x-text rounded-full border px-5 py-2.5 text-sm font-bold hover:bg-[var(--surface-raised)]"}>
          Summer of Bitcoin <span className="ml-1 opacity-70">{summerOfBitcoin.length} orgs</span>
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
            <button type="button" onClick={() => setSelectedYears([])} aria-pressed={selectedYears.length === 0} className={selectedYears.length === 0 ? "focus-ring x-primary h-9 shrink-0 rounded-full border border-transparent px-4 text-xs font-semibold" : "focus-ring x-border x-text h-9 shrink-0 rounded-full border px-4 text-xs font-semibold hover:bg-[var(--surface-raised)]"}>All years</button>
            {availableYears.map((item) => {
              const selected = selectedYears.includes(item);
              return <button key={item} type="button" onClick={() => toggleYear(item)} aria-pressed={selected} className={selected ? "focus-ring x-primary h-9 shrink-0 rounded-full border border-transparent px-4 text-xs font-semibold" : "focus-ring x-border x-text h-9 shrink-0 rounded-full border px-4 text-xs font-semibold hover:bg-[var(--surface-raised)]"}>{item}</button>;
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="x-muted mb-2 text-[11px] font-semibold uppercase tracking-[.12em]">Technology</p>
          <div className="event-carousel flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setSelectedTechnologies([])} aria-pressed={selectedTechnologies.length === 0} className={selectedTechnologies.length === 0 ? "focus-ring x-primary h-9 shrink-0 rounded-full border border-transparent px-4 text-xs font-semibold" : "focus-ring x-border x-text h-9 shrink-0 rounded-full border px-4 text-xs font-semibold hover:bg-[var(--surface-raised)]"}>All</button>
            {technologies.map(([name, count]) => {
              const selected = selectedTechnologies.includes(name);
              return <button key={name} type="button" onClick={() => toggleTechnology(name)} aria-pressed={selected} className={selected ? "focus-ring x-primary h-9 shrink-0 rounded-full border border-transparent px-4 text-xs font-semibold" : "focus-ring x-border x-text h-9 shrink-0 rounded-full border px-4 text-xs font-semibold hover:bg-[var(--surface-raised)]"}>{name} <span className="opacity-60">{count}</span></button>;
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
          {filtered.map((organization) => {
            const isGsoc = program === "gsoc";
            return (
              <article
                key={organization.id}
                className={isGsoc ? "card focus-ring flex min-h-[340px] cursor-pointer flex-col p-5 transition-transform hover:-translate-y-0.5" : "card flex min-h-[340px] flex-col p-5"}
                role={isGsoc ? "button" : undefined}
                tabIndex={isGsoc ? 0 : undefined}
                aria-label={isGsoc ? "Open " + organization.name + " GSoC details" : undefined}
                onClick={isGsoc ? () => openGsocOrganization(organization) : undefined}
                onMouseEnter={isGsoc ? () => prefetchGsocOrganization(organization) : undefined}
                onFocus={isGsoc ? () => prefetchGsocOrganization(organization) : undefined}
                onKeyDown={isGsoc ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openGsocOrganization(organization);
                  }
                } : undefined}
              >
                <div className="flex items-start gap-4">
                  <div className="x-border grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border bg-[var(--surface-raised)]" style={organization.imageBackgroundColor ? { backgroundColor: organization.imageBackgroundColor } : undefined}>
                    {organization.imageUrl ? <img src={organization.imageUrl} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" /> : <span className="x-text text-lg font-bold">{organization.name.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">{organization.category}</p>
                    <h3 className="x-text mt-1 text-xl font-bold tracking-tight">
                      {isGsoc ? (
                        <a
                          href={"/programs/gsoc/" + organization.slug}
                          className="focus-ring rounded"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                            event.preventDefault();
                            openGsocOrganization(organization);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          {organization.name}
                        </a>
                      ) : organization.name}
                    </h3>
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
                    <span className="x-text inline-flex items-center gap-1 rounded">
                      View years & projects <ArrowUpRight size={12} />
                    </span>
                  ) : (
                    <a href={organization.years[0]?.programUrl} target="_blank" rel="noreferrer" className="focus-ring x-text rounded hover:underline">
                      Official program <ArrowUpRight size={12} className="ml-1 inline" />
                    </a>
                  )}
                  {program === "summer-of-bitcoin" && organization.websiteUrl && (
                    <a
                      href={organization.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring x-muted rounded hover:text-[var(--text)] hover:underline"
                    >
                      Organization
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!filtered.length && (
          <div className="x-border x-muted mt-4 rounded-xl border border-dashed px-6 py-10 text-center text-sm">
            {program === "summer-of-bitcoin" && selectedYears.some((item) => item < 2026)
              ? "No curated organization cards are attached to this older cohort yet. Use the official cohort archive above for its complete published projects."
              : "No organization matches those filters."}
          </div>
        )}
      </section>

      {selectedOrganization && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrganization(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gsoc-modal-title"
            className="x-border relative flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border bg-[var(--background)] shadow-2xl sm:max-h-[88vh]"
          >
            <div className="x-border flex items-start gap-4 border-b p-4 sm:p-6">
              <div className="x-border grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-[var(--surface-raised)]" style={selectedOrganization.imageBackgroundColor ? { backgroundColor: selectedOrganization.imageBackgroundColor } : undefined}>
                {selectedOrganization.imageUrl ? <img src={selectedOrganization.imageUrl} alt="" className="h-full w-full object-contain p-2" /> : <span className="x-text text-xl font-bold">{selectedOrganization.name.slice(0, 2).toUpperCase()}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="x-muted text-[11px] font-semibold uppercase tracking-[.14em]">{selectedOrganization.category}</p>
                <h2 id="gsoc-modal-title" className="x-text mt-1 pr-10 text-2xl font-bold tracking-tight sm:text-3xl">{selectedOrganization.name}</h2>
                <p className="x-muted mt-2 line-clamp-2 text-sm leading-6">{selectedOrganization.description}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrganization(null)} className="focus-ring x-muted absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-raised)] hover:text-[var(--text)]" aria-label="Close organization details">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="x-border rounded-xl border p-4">
                  <p className="x-muted text-[10px] font-semibold uppercase tracking-[.12em]">Years participated</p>
                  <p className="x-text mt-2 text-2xl font-bold">{selectedOrganization.years.length}</p>
                </div>
                <div className="x-border rounded-xl border p-4">
                  <p className="x-muted text-[10px] font-semibold uppercase tracking-[.12em]">Projects recorded</p>
                  <p className="x-text mt-2 text-2xl font-bold">{selectedTotalProjects}</p>
                </div>
                <div className="x-border rounded-xl border p-4">
                  <p className="x-muted text-[10px] font-semibold uppercase tracking-[.12em]">Latest year</p>
                  <p className="x-text mt-2 text-2xl font-bold">{modalYears[0]?.year ?? "—"}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
                <section>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">History</p>
                      <h3 className="x-text mt-1 text-lg font-bold">Projects by year</h3>
                    </div>
                    <span className="x-muted text-xs">project count</span>
                  </div>
                  <div className="x-border mt-3 max-h-[260px] overflow-y-auto rounded-xl border p-4">
                    <ProjectHistoryChart organization={selectedOrganization} />
                  </div>
                </section>

                <section>
                  <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">Technologies & topics</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedOrganization.technologies.slice(0, 12).map((item) => (
                      <span key={"tech-" + item} className="x-border x-text rounded-full border px-3 py-1.5 text-xs font-semibold">{item}</span>
                    ))}
                    {selectedOrganization.topics.slice(0, 10).map((item) => (
                      <span key={"topic-" + item} className="x-border x-muted rounded-full border px-3 py-1.5 text-xs font-semibold">{item}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                    {selectedOrganization.websiteUrl && (
                      <a href={selectedOrganization.websiteUrl} target="_blank" rel="noreferrer" className="focus-ring x-text inline-flex items-center gap-1.5 rounded hover:underline">
                        Organization website <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </section>
              </div>

              <section className="mt-7">
                <div>
                  <p className="x-muted text-[11px] font-semibold uppercase tracking-[.12em]">Projects</p>
                  <h3 className="x-text mt-1 text-xl font-bold">Year-wise project history</h3>
                </div>

                <div className="event-carousel mt-4 flex gap-2 overflow-x-auto pb-2">
                  {modalYears.map((item) => (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => setSelectedModalYear(item.year)}
                      className={selectedModalYear === item.year ? "focus-ring x-primary shrink-0 rounded-full border border-transparent px-4 py-2 text-xs font-bold" : "focus-ring x-border x-text shrink-0 rounded-full border px-4 py-2 text-xs font-bold hover:bg-[var(--surface-raised)]"}
                    >
                      {item.year} <span className="ml-1 opacity-70">{item.projectCount}</span>
                    </button>
                  ))}
                </div>

                <div className="x-border mt-3 rounded-xl border p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="x-text text-lg font-bold">{selectedModalYear ?? "Projects"}</h4>
                      <p className="x-muted mt-1 text-xs">{selectedYearSummary?.projectCount ?? 0} {(selectedYearSummary?.projectCount ?? 0) === 1 ? "project" : "projects"} recorded</p>
                    </div>
                    {selectedYearSummary?.programUrl && (
                      <a href={selectedYearSummary.programUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted inline-flex items-center gap-1.5 rounded text-xs font-semibold hover:text-[var(--text)] hover:underline">
                        Official year page <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>

                  {!selectedDetails && !selectedError && (
                    <div className="mt-5 grid gap-3 md:grid-cols-2" aria-label="Loading project details">
                      {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="x-border animate-pulse rounded-xl border p-4">
                          <div className="h-4 w-2/3 rounded bg-[var(--surface-raised)]" />
                          <div className="mt-3 h-3 w-full rounded bg-[var(--surface-raised)]" />
                          <div className="mt-2 h-3 w-4/5 rounded bg-[var(--surface-raised)]" />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedError && (
                    <div className="x-muted mt-5 rounded-xl border border-dashed px-5 py-6 text-sm">
                      <p>{selectedError}</p>
                      <button type="button" onClick={() => { if (selectedOrganization) void ensureGsocDetails(selectedOrganization, true).catch(() => undefined); }} className="focus-ring x-text mt-3 rounded font-semibold underline underline-offset-4">
                        Retry
                      </button>
                    </div>
                  )}

                  {selectedDetails && selectedYearDetails && selectedYearDetails.projects.length > 0 && (
                    <div className="mt-5 grid max-h-[360px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                      {selectedYearDetails.projects.map((project, index) => (
                        <article key={project.projectUrl ?? project.codeUrl ?? String(selectedModalYear) + "-" + index} className="card flex flex-col p-4">
                          <h5 className="x-text text-sm font-bold leading-6">{project.title}</h5>
                          {(project.shortDescription || project.description) && <p className="x-muted mt-2 line-clamp-4 text-sm leading-5">{project.shortDescription || project.description}</p>}
                          <div className="mt-auto flex flex-wrap gap-4 pt-4 text-xs font-semibold">
                            {project.codeUrl && <a href={project.codeUrl} target="_blank" rel="noreferrer" className="focus-ring x-text inline-flex items-center gap-1.5 rounded hover:underline"><Code2 size={13} /> Code</a>}
                            {project.projectUrl && <a href={project.projectUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted inline-flex items-center gap-1.5 rounded hover:text-[var(--text)] hover:underline">Project page <ArrowUpRight size={13} /></a>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {selectedDetails && (!selectedYearDetails || selectedYearDetails.projects.length === 0) && (
                    <div className="x-muted mt-5 rounded-xl border border-dashed px-5 py-7 text-sm">
                      This year is recorded for the organization, but project-level links are not present in the source dataset.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}

      <section aria-labelledby="program-guide-title" className="x-border mt-12 border-t pt-8">
        <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Use history as context</p>
        <h2 id="program-guide-title" className="x-text mt-2 max-w-[760px] text-2xl font-bold tracking-tight sm:text-3xl">
          Explore GSoC organizations and open-source programs without guessing from a single year.
        </h2>
        <p className="x-muted mt-4 max-w-[72ch] text-base leading-7">
          Participation history can show which communities have mentored contributors, what technologies they use, and what kinds of projects have been proposed. It does not guarantee that an organization will return in a future cohort, so use helpmehack for research and confirm the active program list with the official source.
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
        intro="Answers about helpmehack's GSoC and Summer of Bitcoin program data."
      />

      <p className="x-muted mt-8 text-xs leading-5">
        GSoC data includes historical participation and project links and is cached for 30 days. Summer of Bitcoin covers every cohort from 2021 through 2026, with official year links and curated repository mappings where available.
      </p>
    </main>
  );
}
