"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, ChevronDown, Clipboard, ExternalLink, Eye, GitFork, Link2, MessageSquareText, ShieldAlert, TestTube2, X } from "lucide-react";
import type { OpenSourceOpportunity } from "@/lib/types";
import { Avatar, StatusPill } from "./ui";

export function ContributionBrief({ item, statusChange, saved, followed, onSave, onFollow, onClose }: { item: OpenSourceOpportunity; statusChange?: { from: string; to: string } | null; saved: boolean; followed: boolean; onSave: () => void; onFollow: () => void; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `brief-title-${item.id}`;
  const claimDraft = `Hi! I’m interested in helping with this issue. Is it still available, and does the proposed scope in the issue description look current?`;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const root = document.getElementById(`brief-${item.id}`);
        const nodes = root?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [item.id, onClose]);

  const copyClaim = async () => {
    try { await navigator.clipboard.writeText(claimDraft); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId} id={`brief-${item.id}`}>
      <button className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px]" aria-label="Close contribution brief" onClick={onClose} />
      <section className="brief-enter absolute inset-y-0 right-0 flex w-full flex-col border-l border-zinc-800 bg-[#0d0d0f] shadow-2xl sm:w-[min(520px,92vw)]">
        <header className="flex shrink-0 items-start gap-3 border-b border-zinc-800 bg-[#111114] px-4 py-4 sm:px-6">
          <Avatar initials={item.avatar} fallback={item.owner} />
          <div className="min-w-0 flex-1"><p className="mono truncate text-xs text-zinc-500">{item.owner.toLowerCase().replaceAll(" ", "-")}/{item.repo} · #{item.issueNumber}</p><h2 id={titleId} className="mt-1 text-base font-semibold leading-snug text-zinc-50 sm:text-lg">{item.title}</h2></div>
          <button ref={closeRef} onClick={onClose} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Close contribution brief"><X size={19} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">{item.status !== "unknown" && <StatusPill status={item.status} label={item.availabilityLabel} />}<span className="text-xs text-zinc-500">Verified <time dateTime={item.checkedAt}>{new Date(item.checkedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</time></span></div>
          {statusChange && <div role="status" className="x-border x-raised x-muted mb-5 rounded-lg border p-3 text-xs leading-5"><strong className="x-text font-semibold">Availability changed during recheck.</strong> {statusChange.from} → {statusChange.to}. Review the current evidence below before acting.</div>}

          <BriefSection number="01" title="Current availability">
            <p className="text-sm leading-6 text-zinc-300">{item.statusDetail}</p>
            {item.assignmentPolicy && <div className="x-border x-raised mt-3 rounded-lg border p-3"><p className="x-text text-xs font-medium">{item.assignmentPolicy.label}</p><p className="x-muted mt-1 text-xs leading-5">{item.assignmentPolicy.detail}</p>{item.assignmentPolicy.source && <a href={item.assignmentPolicy.source.href} target="_blank" rel="noreferrer" className="focus-ring mt-2 inline-flex items-center gap-1 text-[11px] text-[#1d9bf0] hover:underline">Policy source <ExternalLink size={11} /></a>}</div>}
            <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 sm:grid-cols-2">
              {[ ["Assignment", item.assignment], ["Visible claims", item.visibleClaims], ["Linked pull requests", item.linkedPrs], ["Blockers", item.blockers] ].map(([label, value]) => <div key={label} className="bg-zinc-950/80 p-3"><span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{label}</span><p className="mt-1 text-xs leading-5 text-zinc-300">{value}</p></div>)}
            </div>
            {item.maintainerActivity && <div className="mt-3 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3"><Eye size={14} className="mt-0.5 shrink-0 text-zinc-500" /><p className="text-xs leading-5 text-zinc-400"><span className="text-zinc-200">{item.maintainerActivity}</span><br />{item.activityWindow}. This is observed activity, not a response-time promise.</p></div>}
          </BriefSection>

          <BriefSection number="02" title="How to start">
            <ol className="space-y-2">{item.startSteps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-5 text-zinc-300"><span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-full bg-zinc-800 text-[10px] text-zinc-400">{index + 1}</span>{step}</li>)}</ol>
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-medium text-zinc-300"><MessageSquareText size={14} className="text-zinc-500" />Editable claim-comment draft</span><button onClick={copyClaim} className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 text-[11px] text-zinc-300 hover:bg-zinc-800">{copied ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}{copied ? "Copied" : "Copy draft"}</button></div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{claimDraft}</p>
              <p className="mt-2 text-[10px] text-zinc-600">Review and edit before posting. helpmehack never contacts maintainers for you.</p>
            </div>
          </BriefSection>

          <BriefSection number="03" title="What to avoid">
            <div className="space-y-2">{item.avoid.map((guidance, index) => <details key={`${guidance.kind}-${index}`} className="group rounded-lg border border-zinc-800 bg-zinc-950/60 open:bg-zinc-900/60"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-3 text-xs font-medium text-zinc-300"><span className="flex items-center gap-2"><ShieldAlert size={14} className={guidance.kind === "Official repository rule" ? "text-amber-400" : "text-zinc-500"} />{guidance.kind}</span><ChevronDown size={14} className="text-zinc-600 transition-transform group-open:rotate-180" /></summary><div className="px-3 pb-3 text-xs leading-5 text-zinc-400"><p>{guidance.text}</p>{guidance.source && <a href={guidance.source.href} className="focus-ring mt-2 inline-flex items-center gap-1 text-[#1d9bf0] hover:underline">{guidance.source.label}<ExternalLink size={11} /></a>}</div></details>)}</div>
          </BriefSection>

          <BriefSection number="04" title="Before you code">
            <ul className="space-y-2">{item.setup.map((step) => <li key={step} className="flex gap-2 text-sm leading-5 text-zinc-300"><TestTube2 size={14} className="mt-0.5 shrink-0 text-zinc-500" />{step}</li>)}</ul>
          </BriefSection>

          {item.repositoryQuality && <BriefSection number="05" title="Repository evidence">
            <details className="group rounded-lg border border-zinc-800 bg-zinc-950/60 open:bg-zinc-900/50">
              <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-3"><div><p className="text-xs font-medium text-zinc-200">{item.repositoryQuality.label}</p><p className="mt-1 text-[10px] text-zinc-600">{item.repositoryQuality.coverage}% evidence coverage · 90-day observation window</p></div><ChevronDown size={14} className="shrink-0 text-zinc-600 transition-transform group-open:rotate-180" /></summary>
              <div className="space-y-3 border-t border-zinc-800 px-3 py-3">{item.repositoryQuality.factors.map((factor) => <div key={factor.key}><div className="flex items-center justify-between gap-3 text-[11px]"><span className="font-medium text-zinc-300">{factor.label} <span className="text-zinc-600">· {factor.weight}%</span></span><span className="mono text-zinc-400">{factor.earned === null ? "Insufficient data" : `${factor.earned}/${factor.weight}`}</span></div><p className="mt-1 text-[11px] leading-4 text-zinc-500">{factor.evidence}</p></div>)}</div>
            </details>
            {item.feedScore !== undefined && <p className="mt-2 text-[10px] leading-4 text-zinc-600">Recommended order gates on availability, then uses 60% repository quality, 25% beginner suitability, and 15% issue clarity. Scores are withheld when evidence is incomplete.</p>}
          </BriefSection>}

          <BriefSection number="06" title="Issue summary">
            <p className="text-sm leading-6 text-zinc-400">{item.summary}</p>
          </BriefSection>

          <BriefSection number="07" title="Sources">
            {!item.issueUrl && <div id="demo-source-note" className="x-border x-raised x-muted mb-3 rounded-lg border p-3 text-xs leading-5">This is an explicitly fictional repository record used to demonstrate the product. Links are local source placeholders; no behavior is attributed to a real maintainer or organization.</div>}
            <div className="space-y-2">{item.sources.map((source) => <a key={source.label} href={source.href} className="focus-ring flex items-center justify-between rounded-lg border border-zinc-800 p-3 text-xs text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"><span className="flex items-center gap-2"><Link2 size={13} className="text-zinc-500" />{source.label}</span><span className="capitalize text-zinc-600">{source.kind.replace("-", " ")}</span></a>)}</div>
          </BriefSection>
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-zinc-800 bg-[#111114] p-3 sm:flex sm:items-center sm:px-6">
          {item.issueUrl ? <a href={item.issueUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-xs font-semibold text-zinc-950 hover:bg-white">Open source issue <ExternalLink size={13} /></a> : <button disabled className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-800 px-4 text-xs font-medium text-zinc-500">No live issue</button>}
          <button onClick={onSave} aria-pressed={saved} className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium ${saved ? "x-primary border-transparent" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}><Bookmark size={14} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save"}</button>
          <button onClick={onFollow} aria-pressed={followed} className={`focus-ring col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium sm:col-span-1 ${followed ? "x-primary border-transparent" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}><GitFork size={14} />{followed ? "Following locally" : "Follow repository"}</button>
        </footer>
      </section>
    </div>
  );
}

function BriefSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="mb-7"><div className="mb-3 flex items-center gap-2"><span className="mono text-[10px] text-zinc-600">{number}</span><h3 className="text-sm font-semibold text-zinc-100">{title}</h3></div>{children}</section>;
}
