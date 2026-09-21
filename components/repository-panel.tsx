"use client";

import { trackFunnel } from "@/lib/analytics";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, CheckCircle2, ExternalLink, LoaderCircle, ShieldAlert, X } from "lucide-react";
import { isDisplayableOpportunityStatus } from "@/lib/open-source-tiers";
import type { OpenSourceOpportunity, OpportunityPayload } from "@/lib/types";
import { RepositoryFeedback } from "./repository-feedback";
import { Avatar, StatusPill } from "./ui";

const repositoryRequests = new Map<string, Promise<OpportunityPayload>>();

export function prefetchRepositoryOpportunities(owner: string, repo: string, tiers: string) {
  const key = `${owner}/${repo}?${tiers}`;
  const cached = repositoryRequests.get(key);
  if (cached) return cached;
  const query = new URLSearchParams({ owner, repo, tiers });
  const request = fetch(`/api/repository-opportunities?${query}`, { cache: "no-store" })
    .then(async (response) => {
      const body = await response.json() as OpportunityPayload & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not load repository issues.");
      return body;
    })
    .catch((error) => {
      repositoryRequests.delete(key);
      throw error;
    });
  repositoryRequests.set(key, request);
  return request;
}

export function RepositoryPanel({ initialItems, savedIds, repositorySaved, onSave, onSaveRepository, onClose }: {
  initialItems: OpenSourceOpportunity[];
  savedIds: string[];
  repositorySaved: boolean;
  onSave: (id: string) => void;
  onSaveRepository: () => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const closeRef = useRef<HTMLButtonElement>(null);
  const seed = initialItems[0];
  const first = items[0] ?? seed;
  const tiersKey = useMemo(() => [...new Set(initialItems.flatMap((item) => item.discoveryTiers ?? []))].join(","), [initialItems]);
  const owner = seed?.owner ?? "";
  const repo = seed?.repo ?? "";

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    let active = true;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const root = document.getElementById("repository-panel");
      const nodes = root?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!nodes?.length) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === firstNode) { event.preventDefault(); lastNode.focus(); }
      else if (!event.shiftKey && document.activeElement === lastNode) { event.preventDefault(); firstNode.focus(); }
    };
    document.addEventListener("keydown", keydown);
    if (owner && repo) {
      prefetchRepositoryOpportunities(owner, repo, tiersKey)
        .then((body) => {
          if (!active) return;
          const fresh = body.records.filter((item): item is OpenSourceOpportunity => item.category === "open-source" && isDisplayableOpportunityStatus(item.status));
          setItems(fresh);
          setState("ready");
          if (!fresh.length) trackFunnel("empty_results", { surface: "repository_panel", repository: `${owner}/${repo}` });
        })
        .catch(() => { if (active) { setState("error"); trackFunnel("product_error", { surface: "repository_panel", repository: `${owner}/${repo}` }); } });
    }
    return () => {
      active = false;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [onClose, owner, repo, tiersKey]);

  if (!first) return null;
  const guidance = first.repositoryGuidance;
  const guidanceLoading = state === "loading" && guidance?.assignmentEvidence === "not-found";
  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-0 backdrop-blur-[2px] sm:p-5" role="dialog" aria-modal="true" aria-labelledby="repository-title" id="repository-panel">
      <button className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="Close repository" />
      <section className="brief-enter x-border relative mx-auto flex h-full w-full max-w-[1080px] flex-col overflow-hidden border bg-[var(--background)] shadow-2xl sm:h-[min(900px,calc(100vh-40px))] sm:rounded-2xl">
        <header className="x-border flex shrink-0 items-start gap-3 border-b px-4 py-4 sm:px-6">
          <Avatar initials={first.avatar} fallback={first.owner} />
          <div className="min-w-0 flex-1">
            <p className="mono x-muted text-xs">{first.owner}</p>
            <h2 id="repository-title" className="x-text truncate text-xl font-bold tracking-tight">{first.repo}</h2>
          </div>
          {first.repositoryUrl && <a href={first.repositoryUrl} onClick={() => trackFunnel("repository_clicked", { repository: `${owner}/${repo}` })} target="_blank" rel="noreferrer" className="focus-ring x-border x-text hidden h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold hover:bg-[var(--surface-raised)] sm:inline-flex">Repository <ExternalLink size={14} /></a>}
          <button ref={closeRef} onClick={onClose} className="focus-ring x-muted grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--surface-raised)]" aria-label="Close repository"><X size={19} /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="x-border border-b px-4 py-5 sm:px-6" aria-labelledby="before-issues-title">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div><h3 id="before-issues-title" className="x-text text-lg font-bold">Read this before choosing an issue</h3>{first.repositoryDescription && <p className="x-muted mt-2 max-w-3xl text-sm leading-5">{first.repositoryDescription}</p>}</div>
              <button onClick={onSaveRepository} aria-pressed={repositorySaved} className={`focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-xs font-bold ${repositorySaved ? "x-primary border-transparent" : "x-border x-text hover:bg-[var(--surface-raised)]"}`}><Bookmark size={14} fill={repositorySaved ? "currentColor" : "none"} />{repositorySaved ? "Saved" : "Save repository"}</button>
            </div>
            {guidanceLoading ? <div className="x-border x-muted mt-5 flex min-h-32 items-center justify-center gap-2 rounded-xl border px-6 text-center text-sm"><LoaderCircle size={16} className="animate-spin" />Reading repository contribution rules…</div> : <div className="mt-5 grid gap-3 md:grid-cols-2">
              <GuidanceCard title="How to get assigned" icon={CheckCircle2} badge={guidance?.assignmentEvidence === "documented" ? "Documented rule" : guidance?.assignmentEvidence === "issue-specific" ? "Current issue evidence" : "No rule confirmed"}>
                <p>{guidance?.assignment ?? "No assignment rule was confirmed. Open the issue and follow its current instructions before starting."}</p>
                {guidance?.assignmentSteps?.length ? <ol className="mt-2 list-decimal space-y-1.5 border-t border-[var(--border)] pt-2 pl-4">{guidance.assignmentSteps.map((step) => <li key={step} className="pl-1">{step}</li>)}</ol> : null}
              </GuidanceCard>
              <GuidanceCard title="What not to do" icon={ShieldAlert}><ul className="space-y-1.5">{(guidance?.avoid ?? [first.caution]).map((point) => <li key={point}>• {point}</li>)}</ul></GuidanceCard>
            </div>}
            {!guidanceLoading && guidance?.source && <p className="x-muted mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]"><span>{guidance.assignmentEvidence === "not-found" ? "Files checked" : "Guidance sources"}</span><span>·</span>{(guidance.sources?.length ? guidance.sources : [guidance.source]).map((source, index) => <span key={source.href} className="inline-flex items-center gap-1.5"><a href={source.href} target="_blank" rel="noreferrer" className="focus-ring underline underline-offset-2">{source.label}</a>{index < (guidance.sources?.length ?? 1) - 1 ? <span>·</span> : null}</span>)}<span>· checked {formatDate(guidance.checkedAt)}</span></p>}
          </section>

          <section aria-labelledby="issues-title">
            <div className="x-border flex items-center justify-between border-b px-4 py-3 sm:px-6"><div><h3 id="issues-title" className="x-text text-sm font-bold">Issues to review</h3><p className="x-muted mt-0.5 text-[11px]">{state === "loading" ? "Verifying the current issue list…" : state === "error" ? `${items.length} ${items.length === 1 ? "issue" : "issues"} in the last available snapshot` : `${items.length} matching ${items.length === 1 ? "issue" : "issues"}`}</p></div>{state === "loading" && <span className="x-muted flex items-center gap-2 text-xs"><LoaderCircle size={14} className="animate-spin" />Checking repository…</span>}{state === "error" && <span className="text-amber-400 text-xs">Showing the last available snapshot</span>}</div>
            <div className="divide-y" aria-live="polite">
              {state === "loading" ? <div className="x-muted flex min-h-40 items-center justify-center gap-2 px-6 text-center text-sm"><LoaderCircle size={16} className="animate-spin" />Checking labels, assignments, claims, and linked pull requests…</div> : items.map((item) => <IssueRow key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => onSave(item.id)} />)}
              {state !== "loading" && !items.length && <p className="x-muted px-6 py-12 text-center text-sm">No matching issues were found for this repository.</p>}
            </div>
          </section>
          {state === "ready" && <RepositoryFeedback key={`${owner}/${repo}`} repository={`${owner}/${repo}`} />}
        </div>
      </section>
    </div>
  );
}

function GuidanceCard({ title, icon: Icon, badge, children }: { title: string; icon: typeof CheckCircle2; badge?: string; children: React.ReactNode }) {
  return <div className="x-border x-raised rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="x-text flex items-center gap-2 text-xs font-bold"><Icon size={14} />{title}</h4>{badge && <span className="x-border x-muted rounded-full border px-2 py-0.5 text-[9px] font-semibold">{badge}</span>}</div><div className="x-muted mt-2 text-xs leading-5">{children}</div></div>;
}

function IssueRow({ item, saved, onSave }: { item: OpenSourceOpportunity; saved: boolean; onSave: () => void }) {
  return <article className="x-border flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-raised)] sm:px-6"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-emerald-500 text-emerald-500"><span className="h-1 w-1 rounded-full bg-current" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h4 className="x-text text-sm font-bold leading-5 sm:text-base">{item.title}</h4>{item.labels.slice(0, 3).map((label) => <span key={label} className="x-border x-raised rounded-full border px-2 py-0.5 text-[10px] font-medium">{label}</span>)}</div><p className="x-muted mt-1 text-xs">#{item.issueNumber} · updated {formatDate(item.updatedAt)}{item.status === "ask-first" ? " · check assignment guidance above" : ""}</p><div className="mt-2"><StatusPill status={item.status} /></div><p className="x-muted mt-2 line-clamp-2 text-xs leading-5">{item.summary}</p></div><div className="flex shrink-0 items-center gap-1"><button onClick={onSave} aria-pressed={saved} className="focus-ring x-muted grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--background)]" aria-label={saved ? "Remove saved issue" : "Save issue"}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button>{item.issueUrl && <a href={item.issueUrl} onClick={() => trackFunnel("contribution_issue_clicked", { repository: `${item.owner}/${item.repo}`, issue_number: item.issueNumber })} target="_blank" rel="noreferrer" className="focus-ring x-primary grid h-9 w-9 place-items-center rounded-full" aria-label={`Open issue #${item.issueNumber} on GitHub`}><ArrowUpRight size={16} /></a>}</div></article>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
