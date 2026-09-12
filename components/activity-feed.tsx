"use client";

import { Bookmark, CalendarClock, ChevronRight, ExternalLink, GitBranch, Radio, Sparkles, Star } from "lucide-react";
import type { EventOpportunity, OpenSourceOpportunity, Opportunity } from "@/lib/types";
import { Avatar, StatusPill } from "./ui";

const relativeTime = (iso: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1_440)}d`;
};

const compactNumber = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function ActivityFeed({ records, savedIds, onSave, onOpen }: { records: Opportunity[]; savedIds: string[]; onSave: (id: string) => void; onOpen: (id: string) => void }) {
  const repoCounts = new Map<string, number>();
  records.forEach((item) => {
    if (item.category === "open-source") {
      const key = `${item.owner}/${item.repo}`;
      repoCounts.set(key, (repoCounts.get(key) ?? 0) + 1);
    }
  });

  const chronological = [...records].sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt));
  const highlightedProgram = chronological.find((item) => item.category === "program");
  const withoutHighlight = highlightedProgram ? chronological.filter((item) => item.id !== highlightedProgram.id) : chronological;
  const sorted = highlightedProgram ? [withoutHighlight[0], highlightedProgram, ...withoutHighlight.slice(1)].filter(Boolean) as Opportunity[] : chronological;
  return <div className="divide-y divide-zinc-800/90 overflow-hidden rounded-xl border border-zinc-800 bg-[#111114]">
      {sorted.map((item) => item.category === "open-source"
        ? <RepositoryUpdate key={item.id} item={item} repoIssueCount={repoCounts.get(`${item.owner}/${item.repo}`) ?? 1} saved={savedIds.includes(item.id)} onSave={() => onSave(item.id)} onOpen={() => onOpen(item.id)} />
        : <ProgramUpdate key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => onSave(item.id)} />)}
  </div>;
}

function RepositoryUpdate({ item, repoIssueCount, saved, onSave, onOpen }: { item: OpenSourceOpportunity; repoIssueCount: number; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const repoName = `${item.owner.toLowerCase().replaceAll(" ", "-")}/${item.repo}`;
  return <article className="group px-4 py-4 transition-colors hover:bg-[#151518] sm:px-5">
    <div className="flex items-start gap-3">
      <Avatar initials={item.avatar} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-semibold text-zinc-100">Repository update</span><span className="mono truncate text-xs text-zinc-500">{repoName}</span><span className="text-xs text-zinc-700">·</span><time dateTime={item.checkedAt} className="text-xs text-zinc-500">{relativeTime(item.checkedAt)}</time></div>
        <p className="mt-2 text-[15px] font-medium leading-5 text-zinc-100">A contribution opportunity was checked in <span className="mono text-zinc-300">{repoName}</span>.</p>
        <button onClick={onOpen} className="focus-ring mt-3 block w-full rounded-lg border border-zinc-800 bg-zinc-950/55 p-3 text-left transition-colors hover:border-zinc-700">
          <p className="text-sm font-semibold leading-5 text-zinc-100">{item.title} <span className="mono font-normal text-zinc-600">#{item.issueNumber}</span></p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><StatusPill status={item.status} label={item.availabilityLabel} /><span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><i className="h-2 w-2 rounded-full" style={{ background: item.languageColor }} />{item.language}</span></div>
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500"><span className="inline-flex items-center gap-1.5"><GitBranch size={12} />{repoIssueCount} {repoIssueCount === 1 ? "opportunity" : "opportunities"}</span>{item.repositoryQuality && <span className="inline-flex items-center gap-1.5"><Star size={12} />{compactNumber(item.repositoryQuality.stars)} GitHub stars</span>}</div>
          <div className="flex items-center gap-1"><button onClick={onSave} aria-pressed={saved} className={`focus-ring grid h-8 w-8 place-items-center rounded-md ${saved ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"}`} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /></button><button onClick={onOpen} className="focus-ring inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800">View brief <ChevronRight size={12} /></button></div>
        </div>
      </div>
    </div>
  </article>;
}

function ProgramUpdate({ item, saved, onSave }: { item: EventOpportunity; saved: boolean; onSave: () => void }) {
  const isProgram = item.category === "program";
  return <article className="group px-4 py-4 transition-colors hover:bg-[#151518] sm:px-5">
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${isProgram ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-amber-900 bg-amber-950/40 text-amber-300"}`}>{isProgram ? <Sparkles size={16} /> : <CalendarClock size={16} />}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-zinc-100">{isProgram ? "New fellowship or program" : "Hackathon update"}</span><span className="text-xs text-zinc-500">@{item.organizer.replaceAll(" ", "").toLowerCase()}</span><span className="text-xs text-zinc-700">·</span><time dateTime={item.checkedAt} className="text-xs text-zinc-500">{relativeTime(item.checkedAt)}</time></div>
        <p className="mt-2 text-[15px] font-semibold leading-5 text-zinc-100">{item.title}</p>
        <p className="mt-1 text-sm leading-5 text-zinc-400">{item.summary}</p>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/55 p-3 text-xs text-zinc-400"><div className="flex flex-wrap gap-x-5 gap-y-2"><span><strong className="font-medium text-zinc-200">Deadline:</strong> {item.deadline}</span><span><strong className="font-medium text-zinc-200">Format:</strong> {item.format}</span><span><strong className="font-medium text-zinc-200">Cost:</strong> {item.cost}</span></div></div>
        <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><Radio size={12} />Curated official-source record</span><div className="flex items-center gap-1"><button onClick={onSave} aria-pressed={saved} className={`focus-ring grid h-8 w-8 place-items-center rounded-md ${saved ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"}`} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /></button><a href={item.officialUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800">Official source <ExternalLink size={11} /></a></div></div>
      </div>
    </div>
  </article>;
}
