"use client";

import { Bookmark, Compass, GitFork, GraduationCap, RotateCcw, SlidersHorizontal, Trophy, X } from "lucide-react";
import type { AvailabilityStatus, Experience, Filters, OpportunityView } from "@/lib/types";
import { statusMeta } from "@/lib/status";
import { PanelTitle } from "./ui";

const fallbackLanguages = ["TypeScript", "Python", "Rust", "Go", "JavaScript", "Java"];
const experiences: Experience[] = ["Beginner", "Intermediate", "Advanced"];

export function Sidebar({ filters, setFilters, availableLanguages, mobile = false, onClose }: { filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; availableLanguages?: string[]; mobile?: boolean; onClose?: () => void }) {
  const languages = availableLanguages?.length ? availableLanguages : fallbackLanguages;
  const setCategory = (category: OpportunityView) => setFilters((value) => ({ ...value, category, savedOnly: false }));
  const toggleArray = <T extends string>(field: "languages" | "statuses" | "experience", value: T) => setFilters((current) => {
    const list = current[field] as T[];
    return { ...current, [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
  });
  const reset = () => setFilters((current) => ({ ...current, languages: [], statuses: [], experience: [] }));

  return (
    <aside className={mobile ? "h-full overflow-y-auto bg-[#0d0d0f] p-4" : "sticky top-[77px] hidden h-[calc(100vh-92px)] w-[232px] shrink-0 overflow-y-auto pb-8 lg:block"} aria-label="Opportunity filters">
      {mobile && <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={16} />Filters</h2><button onClick={onClose} className="focus-ring grid h-10 w-10 place-items-center rounded-lg text-zinc-400" aria-label="Close filters"><X size={18} /></button></div>}
      {mobile && <div className="card mb-3 p-2" aria-label="Primary navigation">
        <SideNav icon={Compass} label="Discover" active={filters.category === "all" && !filters.savedOnly} onClick={() => setCategory("all")} />
        <SideNav icon={GitFork} label="Open source" active={filters.category === "open-source" && !filters.savedOnly} onClick={() => setCategory("open-source")} />
        <SideNav icon={Trophy} label="Hackathons" active={filters.category === "hackathon" && !filters.savedOnly} onClick={() => setCategory("hackathon")} />
        <SideNav icon={GraduationCap} label="Programs" active={filters.category === "program" && !filters.savedOnly} onClick={() => setCategory("program")} />
        <SideNav icon={Bookmark} label="Saved" active={filters.savedOnly} onClick={() => setFilters((f) => ({ ...f, savedOnly: true, category: "all" }))} />
      </div>}

      <div className="card p-4">
        <PanelTitle action={<button onClick={reset} className="focus-ring flex items-center gap-1 rounded text-[10px] text-zinc-500 hover:text-zinc-200"><RotateCcw size={10} />Reset</button>}>Preferences</PanelTitle>
        <FilterGroup title="Languages">{languages.map((language) => <Checkbox key={language} label={language} checked={filters.languages.includes(language)} onChange={() => toggleArray("languages", language)} />)}</FilterGroup>
        <FilterGroup title="Experience">{experiences.map((level) => <Checkbox key={level} label={level} checked={filters.experience.includes(level)} onChange={() => toggleArray("experience", level)} />)}</FilterGroup>
        <FilterGroup title="Availability">{(["unassigned", "ask-first", "possibly-claimed", "linked-pr", "blocked", "unknown"] as AvailabilityStatus[]).map((status) => <Checkbox key={status} label={statusMeta[status].label} checked={filters.statuses.includes(status)} onChange={() => toggleArray("statuses", status)} />)}</FilterGroup>
      </div>
    </aside>
  );
}

function SideNav({ icon: Icon, label, active, onClick, count }: { icon: typeof Compass; label: string; active: boolean; onClick: () => void; count?: number }) {
  return <button onClick={onClick} className={`focus-ring flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs transition-colors ${active ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}><Icon size={14} className={active ? "text-zinc-100" : "text-zinc-600"} /><span className="flex-1">{label}</span>{count !== undefined && <span className="rounded-full bg-zinc-800 px-1.5 text-[10px] text-zinc-500">{count}</span>}</button>;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="mb-4 last:mb-0"><legend className="mb-1.5 text-[11px] font-medium text-zinc-300">{title}</legend><div className="space-y-0.5">{children}</div></fieldset>;
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className="flex min-h-7 cursor-pointer items-center gap-2 rounded px-1 text-[11px] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"><input type="checkbox" checked={checked} onChange={onChange} className="theme-checkbox h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900" />{label}</label>;
}
