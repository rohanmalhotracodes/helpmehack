"use client";

import Image from "next/image";
import { trackFunnel } from "@/lib/analytics";
import { HomeLanding } from "./home-landing";
import { SiteFooter } from "./site-footer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, GitFork, Menu, Moon, Sun, X } from "lucide-react";
import { useLocalList } from "@/hooks/use-local-list";
import { useTheme } from "@/hooks/use-theme";
import { isDisplayableOpportunityStatus } from "@/lib/open-source-tiers";
import type { OpenSourceOpportunity, OpportunityPayload } from "@/lib/types";
import { OpenSourceDirectory } from "./open-source-directory";
import { OverlookedFeed } from "./overlooked-feed";
import { RepositoryPanel } from "./repository-panel";

type View = "home" | "overlooked" | "open-source";
export function OpportunityApp({ initialPayload }: { initialPayload: OpportunityPayload }) {
  const { theme, toggleTheme } = useTheme();
  const lastReportedView = useRef<View | null>(null);
  const reportView = useCallback((next: View) => {
    if (lastReportedView.current === next) return;
    lastReportedView.current = next;
    trackFunnel("app_viewed", { view: next });
  }, []);
  const [view, setView] = useState<View>("home");
  const [payload, setPayload] = useState(initialPayload);
  const [activeRepository, setActiveRepository] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const saved = useLocalList("helpmehack:saved");
  const savedRepositories = useLocalList("helpmehack:saved-repositories");
  const records = useMemo(() => payload.records.filter((item): item is OpenSourceOpportunity => item.category === "open-source"), [payload.records]);
  const activeItems = useMemo(() => records.filter((item) => `${item.owner}/${item.repo}` === activeRepository && isDisplayableOpportunityStatus(item.status)), [activeRepository, records]);
  const closeRepository = useCallback(() => setActiveRepository(null), []);

  useEffect(() => {
    const syncView = () => {
      const next = window.location.hash === "#open-source" ? "open-source" : window.location.hash === "#feed" ? "overlooked" : "home";
      setView(next);
      reportView(next);
    };
    syncView();
    window.addEventListener("hashchange", syncView);
    window.addEventListener("popstate", syncView);
    return () => { window.removeEventListener("hashchange", syncView); window.removeEventListener("popstate", syncView); };
  }, [reportView]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/opportunities", { cache: "no-store" });
      const body = await response.json() as OpportunityPayload & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "GitHub check failed.");
      setPayload(body);
    } catch {
      setPayload((current) => ({ ...current, warning: "Automatic GitHub refresh failed. Previous results are preserved and marked stale." }));
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), payload.refreshIntervalMs ?? 3_600_000);
    return () => window.clearInterval(interval);
  }, [payload.refreshIntervalMs, refresh]);

  const navigate = (next: View) => {
    setView(next);
    setMenuOpen(false);
    window.history.pushState(null, "", next === "open-source" ? "#open-source" : next === "overlooked" ? "#feed" : window.location.pathname);
    reportView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-theme min-h-screen" data-theme={theme}>
      <TopNav view={view} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} onMenu={() => setMenuOpen(true)} />
      {view === "home"
        ? <HomeLanding onNavigate={navigate} />
        : view === "overlooked"
        ? <OverlookedFeed onOpenSource={() => navigate("open-source")} />
        : <OpenSourceDirectory dataNotice={payload.mode === "demo" ? "Showing sample repositories. Current GitHub availability has not been confirmed." : payload.warning ? "Repository data may be out of date. Check the latest issue discussion on GitHub before starting." : undefined} records={records} savedRepositoryIds={savedRepositories.items} savedIssueIds={saved.items} onSaveRepository={savedRepositories.toggle} onOpenRepository={(repository) => {
          setActiveRepository(repository);
          trackFunnel("repository_opened", { repository });
        }} />}

      <SiteFooter onNavigate={navigate} />

      {menuOpen && <MobileNav view={view} onNavigate={navigate} onClose={() => setMenuOpen(false)} />}
      {activeRepository && activeItems.length > 0 && <RepositoryPanel key={activeRepository} initialItems={activeItems} savedIds={saved.items} repositorySaved={savedRepositories.items.includes(activeRepository)} onSave={(id) => {
        const addingIssue = !saved.items.includes(id);
        saved.toggle(id);
        if (addingIssue && !savedRepositories.items.includes(activeRepository)) savedRepositories.toggle(activeRepository);
      }} onSaveRepository={() => savedRepositories.toggle(activeRepository)} onClose={closeRepository} />}
    </div>
  );
}


function TopNav({ view, onNavigate, theme, onToggleTheme, onMenu }: { view: View; onNavigate: (view: View) => void; theme: "light" | "dark"; onToggleTheme: () => void; onMenu: () => void }) {
  return (
    <header className="x-border sticky top-0 z-30 border-b bg-[color:var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex h-[61px] max-w-[1240px] items-center gap-4 px-3 sm:px-5">
        <button onClick={() => onNavigate("home")} className="focus-ring flex shrink-0 items-center gap-2 rounded-lg" aria-label="HelpMeHack home">
          <Image src="/helpmehack-mark.png" width={34} height={34} priority alt="" className="logo-mark h-[34px] w-[34px] rounded-lg" />
          <span className="x-text hidden text-sm font-bold tracking-tight sm:block">helpmehack</span>
        </button>
        <nav className="ml-auto hidden h-full items-center gap-1 sm:flex" aria-label="Primary navigation">
          <NavButton active={view === "overlooked"} onClick={() => onNavigate("overlooked")} icon={BookOpenText}>Feed</NavButton>
          <NavButton active={view === "open-source"} onClick={() => onNavigate("open-source")} icon={GitFork}>Repos</NavButton>
        </nav>
        <button onClick={onToggleTheme} className="focus-ring x-muted ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-raised)] sm:ml-0" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button onClick={onMenu} className="focus-ring x-border x-text grid h-10 w-10 place-items-center rounded-full border sm:hidden" aria-label="Open navigation"><Menu size={18} /></button>
      </div>
    </header>
  );
}

function NavButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof GitFork; children: React.ReactNode }) {
  return <button onClick={onClick} aria-current={active ? "page" : undefined} className={`focus-ring relative flex h-full items-center gap-2 px-4 text-sm font-semibold ${active ? "x-text" : "x-muted hover:text-[var(--text)]"}`}><Icon size={16} />{children}{active && <span className="absolute inset-x-3 bottom-0 h-1 rounded-full bg-current" />}</button>;
}

function MobileNav({ view, onNavigate, onClose }: { view: View; onNavigate: (view: View) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 sm:hidden" role="dialog" aria-modal="true" aria-label="Navigation" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <button className="absolute inset-0 h-full w-full bg-black/60" aria-label="Close navigation" onClick={onClose} />
      <aside className="x-border absolute inset-y-0 right-0 w-[min(82vw,300px)] border-l bg-[var(--background)] p-4 shadow-2xl">
        <div className="flex items-center justify-between"><p className="x-text text-sm font-bold">Navigate</p><button autoFocus onClick={onClose} className="focus-ring x-muted grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-raised)]" aria-label="Close navigation"><X size={18} /></button></div>
        <nav className="mt-5 space-y-1" aria-label="Mobile navigation">
          <button onClick={() => onNavigate("overlooked")} className={`focus-ring flex h-12 w-full items-center gap-3 rounded-full px-4 text-sm font-bold ${view === "overlooked" ? "x-primary" : "x-text hover:bg-[var(--surface-raised)]"}`}><BookOpenText size={18} />Feed</button>
          <button onClick={() => onNavigate("open-source")} className={`focus-ring flex h-12 w-full items-center gap-3 rounded-full px-4 text-sm font-bold ${view === "open-source" ? "x-primary" : "x-text hover:bg-[var(--surface-raised)]"}`}><GitFork size={18} />Repos</button>
        </nav>
      </aside>
    </div>
  );
}
