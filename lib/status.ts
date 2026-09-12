import type { AvailabilityStatus } from "./types";

export const statusMeta: Record<AvailabilityStatus, { label: string; tone: string; dot: string }> = {
  unassigned: { label: "Unassigned", tone: "border-emerald-900/70 bg-emerald-950/50 text-emerald-300", dot: "bg-emerald-400" },
  "ask-first": { label: "Ask before starting", tone: "border-amber-900/70 bg-amber-950/40 text-amber-300", dot: "bg-amber-400" },
  "possibly-claimed": { label: "Possibly claimed", tone: "border-orange-900/70 bg-orange-950/40 text-orange-300", dot: "bg-orange-400" },
  "linked-pr": { label: "Linked PR exists", tone: "border-zinc-700 bg-zinc-900 text-zinc-300", dot: "bg-zinc-400" },
  blocked: { label: "Blocked", tone: "border-red-900/70 bg-red-950/40 text-red-300", dot: "bg-red-400" },
  closed: { label: "Closed", tone: "border-zinc-700 bg-zinc-900 text-zinc-400", dot: "bg-zinc-500" },
  unknown: { label: "Status unknown", tone: "border-zinc-700 bg-zinc-900 text-zinc-300", dot: "bg-zinc-400" },
};

export function isPotentiallyStartable(status: AvailabilityStatus) {
  return status === "unassigned" || status === "ask-first";
}
