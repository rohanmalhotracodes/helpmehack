import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Code2, ExternalLink } from "lucide-react";
import { ContributionPageShell } from "@/components/contribution-page-shell";
import { loadGsocOrganization } from "@/lib/program-directory";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const organization = await loadGsocOrganization(slug);
  if (!organization) return { title: "GSoC organization | HelpMeHack" };
  return {
    title: `${organization.name} GSoC history | HelpMeHack`,
    description: `See ${organization.name}'s Google Summer of Code participation years, projects, technologies, and code links.`,
    alternates: { canonical: `https://www.helpmehack.tech/programs/gsoc/${organization.slug}` },
  };
}

export default async function GsocOrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await loadGsocOrganization(slug);
  if (!organization) notFound();

  const pageUrl = `https://www.helpmehack.tech/programs/gsoc/${organization.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#page`,
      url: pageUrl,
      name: `${organization.name} GSoC history`,
      description: organization.description,
      about: {
        "@type": "Organization",
        name: organization.name,
        url: organization.websiteUrl || undefined,
      },
      keywords: organization.technologies,
      isPartOf: {
        "@type": "WebSite",
        name: "HelpMeHack",
        url: "https://www.helpmehack.tech",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "HelpMeHack", item: "https://www.helpmehack.tech" },
        { "@type": "ListItem", position: 2, name: "Programs", item: "https://www.helpmehack.tech/programs" },
        { "@type": "ListItem", position: 3, name: organization.name, item: pageUrl },
      ],
    },
  ];

  return (
    <ContributionPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/programs" className="focus-ring x-muted inline-flex items-center gap-2 rounded text-sm font-semibold hover:text-[var(--text)]">
          <ArrowLeft size={16} /> Back to Programs
        </Link>

        <section className="mt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div
              className="x-border grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-[var(--surface-raised)]"
              style={organization.imageBackgroundColor ? { backgroundColor: organization.imageBackgroundColor } : undefined}
            >
              {organization.imageUrl ? (
                <img src={organization.imageUrl} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <span className="x-text text-2xl font-bold">{organization.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">{organization.category}</p>
              <h1 className="x-text mt-2 text-4xl font-bold tracking-tight sm:text-6xl">{organization.name}</h1>
              <p className="x-muted mt-4 max-w-[70ch] text-base leading-7">{organization.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {organization.technologies.slice(0, 10).map((item) => (
                  <span key={item} className="x-border x-text rounded-full border px-3 py-1.5 text-xs font-semibold">{item}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                {organization.websiteUrl && (
                  <a href={organization.websiteUrl} target="_blank" rel="noreferrer" className="focus-ring x-text inline-flex items-center gap-1.5 rounded hover:underline">
                    Organization website <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="x-muted text-xs font-semibold uppercase tracking-[.14em]">Participation history</p>
              <h2 className="x-text mt-2 text-2xl font-bold tracking-tight">{organization.years.length} GSoC {organization.years.length === 1 ? "year" : "years"}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {organization.years.map((item) => (
                <a key={item.year} href={"#year-" + item.year} className="focus-ring x-border x-text rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-raised)]">
                  {item.year}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-7 space-y-6">
            {organization.years.map((item) => (
              <article id={"year-" + item.year} key={item.year} className="x-border scroll-mt-24 border-t pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="x-text text-2xl font-bold">{item.year}</h3>
                    <p className="x-muted mt-1 text-sm">{item.projectCount} {item.projectCount === 1 ? "project" : "projects"}</p>
                  </div>
                  <a href={item.programUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted inline-flex items-center gap-1.5 rounded text-xs font-semibold hover:text-[var(--text)] hover:underline">
                    Official year page <ArrowUpRight size={13} />
                  </a>
                </div>

                {item.projects.length ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {item.projects.map((project, index) => (
                      <div key={project.projectUrl ?? project.codeUrl ?? `${item.year}-${index}`} className="card flex flex-col p-4">
                        <h4 className="x-text text-base font-bold leading-6">{project.title}</h4>
                        {(project.shortDescription || project.description) && (
                          <p className="x-muted mt-2 line-clamp-4 text-sm leading-5">{project.shortDescription || project.description}</p>
                        )}
                        <div className="mt-auto flex flex-wrap gap-4 pt-4 text-xs font-semibold">
                          {project.codeUrl && (
                            <a href={project.codeUrl} target="_blank" rel="noreferrer" className="focus-ring x-text inline-flex items-center gap-1.5 rounded hover:underline">
                              <Code2 size={13} /> Code
                            </a>
                          )}
                          {project.projectUrl && (
                            <a href={project.projectUrl} target="_blank" rel="noreferrer" className="focus-ring x-muted inline-flex items-center gap-1.5 rounded hover:text-[var(--text)] hover:underline">
                              Project page <ArrowUpRight size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="x-border x-muted mt-5 rounded-xl border border-dashed px-5 py-8 text-sm">
                    This year is recorded for the organization, but project-level links are not present in the source dataset.
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </ContributionPageShell>
  );
}
