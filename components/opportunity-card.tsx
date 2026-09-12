"use client";

import { Bookmark, CalendarClock, ChevronRight, ExternalLink, MapPin, RefreshCw, ShieldAlert, Users } from "lucide-react";
import type { EventOpportunity, OpenSourceOpportunity } from "@/lib/types";
import { Avatar, StatusPill } from "./ui";

const relativeTime = (iso: string) => {
  const hours = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 36e5));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function OpenSourceCard({ item, saved, onSave, onOpen }: { item: OpenSourceOpportunity; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const requirement = item.keyRequirement ?? item.startSteps[0] ?? item.caution;
  return (
    <article className="group bg-[#111114] px-4 py-4 transition-colors hover:bg-[#151518] sm:px-5">
      <div className="flex items-start gap-3">
        <Avatar initials={item.avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="focus-ring block w-full rounded text-left">
            <h2 className="text-[15px] font-semibold leading-5 text-zinc-50 transition-colors group-hover:text-white">{item.title} <span className="mono font-normal text-zinc-600">#{item.issueNumber}</span></h2>
          </button>
          <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-zinc-500">
            <span className="mono shrink-0 text-zinc-300">{item.owner.toLowerCase().replaceAll(" ", "-")}/{item.repo}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{item.repositoryDescription ?? item.summary}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={item.status} label={item.availabilityLabel} />
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400"><i className="h-2 w-2 rounded-full" style={{ background: item.languageColor }} />{item.language}</span>
            <span className="text-[11px] text-zinc-600">{item.experience}</span>
            {item.repositoryQuality && <span className="text-[11px] text-zinc-600">· {item.repositoryQuality.label}</span>}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-start gap-1.5 text-xs leading-4 text-amber-200/85"><ShieldAlert className="mt-0.5 shrink-0" size={12} aria-hidden="true" /><span><strong className="font-medium text-amber-100">Before starting:</strong> {requirement}</span></p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-600"><RefreshCw size={10} aria-hidden="true" />Checked {relativeTime(item.checkedAt)}{item.maintainerActivity && <><span aria-hidden="true">·</span><span className="truncate">{item.maintainerActivity}</span></>}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {item.issueUrl && <a className="focus-ring inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11px] text-zinc-500 hover:bg-zinc-800 hover:text-white" href={item.issueUrl} target="_blank" rel="noreferrer">GitHub <ExternalLink size={11} /></a>}
              <button onClick={onOpen} className="focus-ring inline-flex h-8 items-center gap-1 rounded-md bg-zinc-100 px-3 text-[11px] font-semibold text-zinc-950 transition-colors hover:bg-white">View brief <ChevronRight size={12} /></button>
            </div>
          </div>
        </div>
        <button onClick={onSave} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`} aria-pressed={saved} className={`focus-ring -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors ${saved ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"}`}><Bookmark size={15} fill={saved ? "currentColor" : "none"} /></button>
      </div>
    </article>
  );
}

const eventStatus = {
  open: "border-emerald-900/70 bg-emerald-950/50 text-emerald-300",
  "closing-soon": "border-amber-900/70 bg-amber-950/40 text-amber-300",
  upcoming: "border-zinc-700 bg-zinc-900 text-zinc-300",
  closed: "border-zinc-700 bg-zinc-900 text-zinc-400",
  unknown: "border-zinc-700 bg-zinc-900 text-zinc-300",
};

export function EventCard({ item, saved, onSave }: { item: EventOpportunity; saved: boolean; onSave: () => void }) {
  return (
    <article className="card overflow-hidden p-4 transition-colors hover:border-zinc-700 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{item.category === "hackathon" ? "Hackathon" : "Developer program"}</span><h2 className="mt-1 text-[15px] font-semibold text-zinc-50">{item.title}</h2><p className="mt-0.5 text-xs text-zinc-500">{item.organizer}</p></div>
        <button onClick={onSave} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`} aria-pressed={saved} className={`focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full ${saved ? "x-primary" : "text-zinc-500 hover:bg-zinc-800"}`}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button>
      </div>
      <p className="mt-3 text-[13px] leading-5 text-zinc-400">{item.summary}</p>
      <div className="mt-4 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400 sm:grid-cols-2">
        <span className="flex items-start gap-2"><CalendarClock className="mt-0.5 shrink-0 text-zinc-500" size={14} /><span><span className="block text-[10px] uppercase tracking-wide text-zinc-600">Deadline</span>{item.deadline}</span></span>
        <span className="flex items-start gap-2"><MapPin className="mt-0.5 shrink-0 text-zinc-500" size={14} /><span><span className="block text-[10px] uppercase tracking-wide text-zinc-600">Format</span>{item.format}</span></span>
        <span className="flex items-start gap-2"><Users className="mt-0.5 shrink-0 text-zinc-500" size={14} /><span><span className="block text-[10px] uppercase tracking-wide text-zinc-600">Participation</span>{item.team}</span></span>
        <span><span className="block text-[10px] uppercase tracking-wide text-zinc-600">Eligibility · Cost</span>{item.eligibility} · {item.cost}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${eventStatus[item.status]}`}>{item.status.replace("-", " ")}</span><span className="text-[11px] text-zinc-600">Checked {relativeTime(item.checkedAt)}</span></div>
        <a href={item.officialUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 text-xs font-semibold text-zinc-950 hover:bg-white">View official source <ExternalLink size={12} /></a>
      </div>
      <p className="mt-3 border-t border-zinc-800 pt-3 text-[11px] leading-4 text-zinc-600">{item.sourceNote}</p>
    </article>
  );
}
