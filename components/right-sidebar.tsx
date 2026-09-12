import { CalendarClock } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import { PanelTitle } from "./ui";

export function RightSidebar({ records }: { records: Opportunity[] }) {
  const closing = records.filter((item) => item.category !== "open-source" && item.status === "closing-soon").slice(0, 2);
  return <aside className="sticky top-[77px] hidden h-[calc(100vh-92px)] w-[288px] shrink-0 overflow-y-auto pb-8 xl:block" aria-label="Updates and tips">
    <section className="card p-4"><PanelTitle>Closing soon</PanelTitle>{closing.length ? closing.map((item) => item.category !== "open-source" && <div key={item.id} className="border-b border-zinc-800 py-3 first:pt-0 last:border-0 last:pb-0"><p className="text-xs font-medium text-zinc-200">{item.title}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300"><CalendarClock size={11} />{item.deadline}</p></div>) : <p className="text-xs text-zinc-500">No verified deadlines are closing soon.</p>}</section>
  </aside>;
}
