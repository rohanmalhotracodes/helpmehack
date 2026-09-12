"use client";

import type { ReactNode } from "react";
import { Check, CircleHelp, CircleX, Clock3, GitPullRequest, Hand, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { statusMeta } from "@/lib/status";
import type { AvailabilityStatus } from "@/lib/types";

export function StatusPill({ status, label }: { status: AvailabilityStatus; label?: string }) {
  const meta = statusMeta[status];
  const Icon = status === "unassigned" ? Check : status === "ask-first" ? Hand : status === "possibly-claimed" ? CircleHelp : status === "linked-pr" ? GitPullRequest : status === "blocked" ? LockKeyhole : status === "closed" ? CircleX : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${meta.tone}`}><Icon size={12} aria-hidden="true" />{label ?? meta.label}</span>;
}

export function Avatar({ initials, fallback = "GH", size = "md" }: { initials: string; fallback?: string; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? 28 : 40;
  if (initials.startsWith("https://")) {
    const source = `/api/github-avatar?url=${encodeURIComponent(initials)}&name=${encodeURIComponent(fallback)}`;
    return <span className={`${size === "sm" ? "h-7 w-7 text-[9px]" : "h-10 w-10 text-xs"} x-raised x-border relative grid shrink-0 place-items-center overflow-hidden rounded-full border font-semibold`} aria-hidden="true"><span>{fallback.slice(0, 2).toUpperCase()}</span><Image unoptimized src={source} width={dimension} height={dimension} alt="" className="absolute inset-0 h-full w-full bg-white object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span>;
  }
  return <span aria-hidden="true" className={`${size === "sm" ? "h-7 w-7 text-[9px]" : "h-10 w-10 text-xs"} grid shrink-0 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 font-semibold text-zinc-200`}>{initials}</span>;
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xs font-semibold uppercase tracking-[.12em] text-zinc-500">{children}</h2>{action}</div>;
}
