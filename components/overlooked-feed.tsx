import Image from "next/image";
import { ArrowUpRight, BadgeCheck, BookOpen, CalendarDays, GitPullRequest, ShieldCheck } from "lucide-react";
import { NewsletterSignup } from "./newsletter-signup";

const posts = [
  {
    id: "hacktoberfest-2026",
    eyebrow: "Hacktoberfest 2026",
    title: "Hacktoberfest cancelled? Not exactly — it works differently this year.",
    body: "Hacktoberfest is still happening throughout October, but the old four-PR-style challenge is no longer the centre of the event. In 2026, MLH and DEV, in partnership with DigitalOcean, are shifting the focus to 300+ online and in-person Fests built around open-source AI, open-weight models, learning, and hands-on building. The official FAQ says Hacktoberfest is moving away from counting pull requests because AI tools have made low-effort PR spam much easier, creating more noise and maintainer burnout. You can still contribute to open source this October — Hacktoberfest just is not rewarding raw PR counts the way it used to.",
    source: "Official Hacktoberfest 2026 FAQ",
    href: "https://hacktoberfest.com/questions/",
    icon: CalendarDays,
    imageUrl: "https://github.com/hacktoberfest.png",
    imageAlt: "Hacktoberfest official logo",
  },
  {
    id: "linked-work",
    eyebrow: "Before you claim an issue",
    title: "An empty assignee field does not mean nobody is working on it.",
    body: "Check recent comments and linked pull requests before starting. helpmehack treats these signals separately, so an issue can be unassigned while competing work is already visible.",
    source: "How GitHub links pull requests to issues",
    href: "https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue",
    icon: GitPullRequest,
    imageUrl: undefined,
    imageAlt: undefined,
  },
  {
    id: "contribution-rules",
    eyebrow: "Repository process",
    title: "“Good first issue” is a label. CONTRIBUTING.md is the process.",
    body: "Repositories differ: some ask you to request assignment, some want a proposal first, and others welcome a direct pull request. Read the project’s documented path before announcing work.",
    source: "GitHub’s open-source contribution guide",
    href: "https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-open-source",
    icon: BookOpen,
    imageUrl: undefined,
    imageAlt: undefined,
  },
  {
    id: "merge-evidence",
    eyebrow: "How ranking works",
    title: "We look beyond stars to see whether newcomer work gets reviewed and merged.",
    body: "Repository quality and issue availability are ranked separately. The repository score uses a disclosed 90-day sample of public pull requests, maintainer response, maintenance, reputation, and onboarding evidence. Missing evidence stays missing.",
    source: "Open-source contribution best practices",
    href: "https://opensource.guide/how-to-contribute/",
    icon: ShieldCheck,
    imageUrl: undefined,
    imageAlt: undefined,
  },
];

export function OverlookedFeed({ onOpenSource }: { onOpenSource: () => void }) {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1080px] px-0 sm:px-5">
      <div className="grid items-start lg:grid-cols-[minmax(0,680px)_300px] lg:gap-7">
        <section className="x-border border-x" aria-labelledby="feed-title">
          <header className="x-border border-b px-4 py-4 sm:px-5">
            <h1 id="feed-title" className="x-text text-xl font-bold tracking-tight">Feed</h1>
            <p className="x-muted mt-1 text-sm">Practical open-source context and contribution advice from helpmehack.</p>
          </header>
          <div className="divide-y x-border">
            {posts.map((post) => {
              const Icon = post.icon;
              return (
                <article key={post.id} className="x-border px-4 py-5 transition-colors hover:bg-[var(--surface-raised)] sm:px-5">
                  <div className="flex gap-3">
                    <Image src="/helpmehack-mark.png" width={42} height={42} alt="" className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 text-sm"><strong className="x-text">helpmehack</strong><BadgeCheck size={15} aria-label="Administrator" className="text-[#1d9bf0]" /><span className="x-muted">@helpmehack · Admin</span></div>
                      <p className="x-muted mt-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[.1em]"><Icon size={13} aria-hidden="true" />{post.eyebrow}</p>
                      {post.imageUrl && <img src={post.imageUrl} alt={post.imageAlt ?? ""} className="x-border mt-4 h-16 w-16 rounded-2xl border object-cover" />}
                      <h2 className="x-text mt-2 text-[17px] font-bold leading-6">{post.title}</h2>
                      <p className="x-text mt-2 text-[15px] leading-6">{post.body}</p>
                      <a href={post.href} target="_blank" rel="noreferrer" className="focus-ring x-muted mt-4 inline-flex items-center gap-1.5 rounded text-xs font-medium hover:underline">{post.source}<ArrowUpRight size={13} /></a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="sticky top-20 hidden space-y-4 lg:block" aria-label="Feed information">
          <div className="card overlooked-aside-card p-4">
            <h2 className="x-text text-base font-bold">No engagement bait</h2>
            <p className="x-muted mt-2 text-sm leading-5">This is a read-only editorial feed. There are no likes, replies, reposts, follower counts, or sponsored posts.</p>
          </div>
          <div className="card overlooked-aside-card p-4">
            <h2 className="x-text text-base font-bold">Ready to contribute?</h2>
            <p className="x-muted mt-2 text-sm leading-5">Browse issues ranked using availability, setup guidance, maintainer activity, and newcomer pull-request evidence.</p>
            <button onClick={onOpenSource} className="focus-ring x-primary mt-4 inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold">Browse repos <ArrowUpRight size={14} /></button>
          </div>
        </aside>
      </div>
      <NewsletterSignup />
    </main>
  );
}
