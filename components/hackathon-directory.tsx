"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Search, X } from "lucide-react";
import { EVENT_PLATFORMS, EVENT_REFRESH_INTERVAL_MS } from "@/lib/event-provider";
import type { EventDiscoveryPayload, EventDiscoverySource, EventOpportunity, EventPlatform } from "@/lib/types";

type DirectoryFilter = "all" | "open" | "closing-soon" | "remote";
type RefreshState = "idle" | "loading" | "success" | "error";

type DirectoryProps = {
  items: EventOpportunity[];
  query: string;
  onQueryChange: (query: string) => void;
  savedIds: string[];
  onSave: (id: string) => void;
  discovery?: EventDiscoveryPayload;
  onEventsRefresh: (items: EventOpportunity[], discovery: EventDiscoveryPayload) => void;
};

export function HackathonDirectory({ items, query, onQueryChange, savedIds, onSave, discovery: initialDiscovery, onEventsRefresh }: DirectoryProps) {
  const [filter, setFilter] = useState<DirectoryFilter>("all");
  const [platformView, setPlatformView] = useState<EventPlatform | null>(null);
  const [discovery, setDiscovery] = useState(initialDiscovery);
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [refreshMessage, setRefreshMessage] = useState("");

  const refresh = useCallback(async (force = false) => {
    setRefreshState("loading");
    setRefreshMessage("");
    try {
      const response = await fetch(`/api/events${force ? "?force=1" : ""}`, { cache: "no-store" });
      const body = await response.json() as EventDiscoveryPayload & { error?: string };
      if (!response.ok) throw new Error(body.error || "Event refresh failed");
      if (!Array.isArray(body.records) || !Array.isArray(body.sources)) throw new Error("The event source returned an invalid response");
      setDiscovery(body);
      onEventsRefresh(body.records, body);
      setRefreshState("success");
      setRefreshMessage(body.mode === "live" ? "All sources refreshed" : "Available sources refreshed");
    } catch (error) {
      setRefreshState("error");
      setRefreshMessage(error instanceof Error ? `${error.message}. Showing the previous snapshot.` : "Refresh failed. Showing the previous snapshot.");
    }
  }, [onEventsRefresh]);

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(false), discovery?.refreshIntervalMs ?? EVENT_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [discovery?.refreshIntervalMs, refresh]);

  const visible = useMemo(() => items.filter((item) => {
    if (filter === "open" && item.status !== "open") return false;
    if (filter === "closing-soon" && item.status !== "closing-soon") return false;
    if (filter === "remote" && !/remote|online/i.test(item.format)) return false;
    const normalized = query.trim().toLowerCase();
    return !normalized || [item.title, item.organizer, item.summary, item.eligibility, item.format, item.platform, ...item.tags].join(" ").toLowerCase().includes(normalized);
  }), [filter, items, query]);

  const sourceFor = (platform: EventPlatform) => discovery?.sources.find((source) => source.platform === platform);
  const checkedAt = discovery?.checkedAt;

  return <main id="main-content" className="min-w-0 flex-1 pb-16">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Events &amp; Competitions</h1>
        <p className="mt-1 text-sm text-slate-500">Public listings from five developer-event platforms, refreshed hourly.</p>
      </div>
      <div className="flex items-center gap-3">
        <span aria-live="polite" className={`hidden text-xs sm:block ${refreshState === "error" ? "text-amber-700" : "text-slate-500"}`}>{refreshMessage || (checkedAt ? `Checked ${relativeTime(checkedAt)}` : "Waiting for source check")}</span>
        <button onClick={() => void refresh(true)} disabled={refreshState === "loading"} className="focus-ring inline-flex h-9 items-center gap-2 rounded-full border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60">
          <RefreshCw size={13} className={refreshState === "loading" ? "animate-spin" : ""} />Refresh
        </button>
      </div>
    </header>

    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="focus-ring h-11 w-full rounded-full border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400" placeholder="Search events, organizers, or skills" aria-label="Search events and competitions" />
        {query && <button onClick={() => onQueryChange("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Clear event search"><X size={14} /></button>}
      </div>
      <div className="event-carousel flex gap-2 overflow-x-auto pb-1" aria-label="Event filters">{([ ["all", "All"], ["open", "Registration open"], ["closing-soon", "Closing soon"], ["remote", "Online"] ] as const).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`focus-ring h-9 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors ${filter === value ? "x-primary border-transparent" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>{label}</button>)}</div>
    </div>

    {refreshState === "error" && <p role="status" className="mt-3 text-xs text-amber-700 sm:hidden">{refreshMessage}</p>}

    {platformView ? <PlatformFilteredView platform={platformView} items={visible.filter((item) => item.platform === platformView)} source={sourceFor(platformView)} savedIds={savedIds} onSave={onSave} onBack={() => setPlatformView(null)} onReset={() => { setFilter("all"); onQueryChange(""); }} /> : <div className="mt-9 space-y-12">
      {EVENT_PLATFORMS.map((platform) => <PlatformEventSection key={platform} platform={platform} items={visible.filter((item) => item.platform === platform)} source={sourceFor(platform)} savedIds={savedIds} onSave={onSave} onViewAll={() => setPlatformView(platform)} />)}
    </div>}
  </main>;
}

function PlatformFilteredView({ platform, items, source, savedIds, onSave, onBack, onReset }: { platform: EventPlatform; items: EventOpportunity[]; source?: EventDiscoverySource; savedIds: string[]; onSave: (id: string) => void; onBack: () => void; onReset: () => void }) {
  return <section className="mt-8" aria-labelledby={`all-${platform}`}>
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <button onClick={onBack} className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100" aria-label="Back to all event platforms"><ChevronLeft size={17} /></button>
      <div><p className="text-xs text-slate-500">All current listings</p><h2 id={`all-${platform}`} className="text-xl font-bold text-slate-950">{platform}</h2></div>
    </div>
    {items.length ? <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{items.map((item) => <EventCard key={item.id} item={item} saved={savedIds.includes(item.id)} onSave={() => onSave(item.id)} />)}</div> : <PlatformEmpty platform={platform} source={source} onReset={onReset} />}
  </section>;
}

export function PlatformEventSection({ platform, items, source, savedIds, onSave, onViewAll }: { platform: EventPlatform; items: EventOpportunity[]; source?: EventDiscoverySource; savedIds: string[]; onSave: (id: string) => void; onViewAll: () => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(items.length > 1);
  const [autoPaused, setAutoPaused] = useState(false);

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanBack(rail.scrollLeft > 4);
    setCanForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateControls);
    window.addEventListener("resize", updateControls);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", updateControls); };
  }, [items.length, updateControls]);

  useEffect(() => {
    if (items.length < 2 || autoPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail || document.hidden) return;
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      const cardWidth = rail.firstElementChild?.getBoundingClientRect().width ?? 224;
      rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + cardWidth + 16, behavior: "smooth" });
    }, 6_500);
    return () => window.clearInterval(interval);
  }, [autoPaused, items.length]);

  const scroll = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(240, rail.clientWidth * 0.78), behavior: "smooth" });
  };

  return <section aria-labelledby={`platform-${platform}`}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="h-7 w-1 rounded-full bg-slate-950" /><div><h2 id={`platform-${platform}`} className="text-xl font-bold tracking-tight text-slate-950">{platform}</h2><p className="mt-0.5 text-[11px] text-slate-500">{sourceLabel(source)}</p></div></div>
      <button onClick={onViewAll} className="focus-ring inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100">View all <ChevronRight size={14} /></button>
    </div>
    {items.length ? <div className="relative" onMouseEnter={() => setAutoPaused(true)} onMouseLeave={() => setAutoPaused(false)} onFocusCapture={() => setAutoPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setAutoPaused(false); }}>
      <div ref={railRef} onScroll={updateControls} className="event-carousel flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2" tabIndex={0} aria-label={`${platform} event carousel`}>
        {items.map((item) => <div key={item.id} className="w-[72vw] max-w-[224px] shrink-0 snap-start sm:w-[224px]"><EventCard item={item} saved={savedIds.includes(item.id)} onSave={() => onSave(item.id)} /></div>)}
      </div>
      <CarouselButton direction="back" disabled={!canBack} onClick={() => scroll(-1)} label={`Previous ${platform} events`} />
      <CarouselButton direction="forward" disabled={!canForward} onClick={() => scroll(1)} label={`Next ${platform} events`} />
    </div> : <PlatformEmpty platform={platform} source={source} />}
  </section>;
}

export function EventCard({ item, saved, onSave }: { item: EventOpportunity; saved: boolean; onSave: () => void }) {
  const status = statusLabel(item.status);
  const posterStyle = item.posterUrl ? {
    backgroundImage: `url("${item.posterUrl.replaceAll('"', "%22")}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: item.posterFit === "contain" ? "64% auto" : "cover",
  } : undefined;
  return <article className="group min-w-0">
    <a href={item.officialUrl} target="_blank" rel="noreferrer" className="focus-ring relative block aspect-[224/337] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" aria-label={`Open the official listing for ${item.title}`}>
      {item.posterUrl ? <><span role="img" aria-label={`${item.title} event artwork`} className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.015]" style={posterStyle} />{item.posterFit === "contain" && <span className="absolute inset-x-2.5 bottom-2.5 rounded-xl bg-slate-950/90 p-2.5 text-white shadow-sm backdrop-blur"><span className="block text-[8px] font-semibold uppercase tracking-[.16em] text-slate-400">{item.platform}</span><span className="mt-1 block text-xs font-bold leading-4">{item.title}</span></span>}</> : <span className="absolute inset-0 flex flex-col justify-between bg-slate-950 p-4 text-white"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">{item.platform}</span><span className="text-xl font-bold leading-tight">{item.title}</span><span className="text-[10px] text-slate-400">Official artwork unavailable</span></span>}
      <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur" aria-hidden="true"><ExternalLink size={13} /></span>
    </a>
    <div className="mt-3 flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-wrap gap-1.5">{item.collection && <span className="rounded-full border border-slate-400 bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700">{item.collection}</span>}<span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${status.className}`}>{status.label}</span><span className="max-w-[105px] truncate rounded-full border border-slate-300 px-2 py-1 text-[9px] font-medium text-slate-600">{shortFormat(item.format)}</span>{item.cost === "Free" && <span className="rounded-full border border-slate-300 px-2 py-1 text-[9px] font-medium text-slate-600">Free</span>}</div>
      <button onClick={onSave} aria-pressed={saved} className={`focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full ${saved ? "x-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button>
    </div>
    <a href={item.officialUrl} target="_blank" rel="noreferrer" className="focus-ring mt-2 block rounded-sm"><h3 className="line-clamp-2 text-sm font-bold leading-[1.2rem] text-slate-950 group-hover:underline">{item.title}</h3></a>
    <p className="mt-1 truncate text-xs text-slate-500">{item.organizer}</p>
    <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">{item.deadline}</p>
    {(item.prize || item.registrationCount !== undefined) && <p className="mt-2 truncate text-[11px] font-medium text-slate-700">{[item.prize, item.registrationCount !== undefined ? `${item.registrationCount.toLocaleString()} registered` : ""].filter(Boolean).join(" · ")}</p>}
  </article>;
}

function CarouselButton({ direction, disabled, onClick, label }: { direction: "back" | "forward"; disabled: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} disabled={disabled} aria-label={label} className={`focus-ring absolute top-[38%] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-md transition-opacity ${direction === "back" ? "left-2" : "right-2"} ${disabled ? "pointer-events-none opacity-0" : "opacity-95 hover:bg-slate-100"}`}>{direction === "back" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>;
}

function PlatformEmpty({ platform, source, onReset }: { platform: EventPlatform; source?: EventDiscoverySource; onReset?: () => void }) {
  const unavailable = source?.state === "unavailable";
  return <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center">
    <p className="text-sm font-semibold text-slate-800">{unavailable ? `${platform} could not be checked` : `No matching ${platform} events`}</p>
    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{unavailable ? "The previous snapshot is preserved when available. You can still browse the official platform." : "The current source snapshot returned no available events for these filters."}</p>
    <div className="mt-3 flex justify-center gap-2">{onReset && <button onClick={onReset} className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">Clear filters</button>}<a href={source?.sourceUrl || platformUrl(platform)} target="_blank" rel="noreferrer" className="focus-ring rounded-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Open {platform} <ExternalLink size={11} className="ml-1 inline" /></a></div>
  </div>;
}

function statusLabel(status: EventOpportunity["status"]) {
  if (status === "closing-soon") return { label: "Closing soon", className: "border-amber-300 bg-amber-100 text-amber-800" };
  if (status === "open") return { label: "Registration open", className: "border-emerald-300 bg-emerald-100 text-emerald-800" };
  if (status === "upcoming") return { label: "Upcoming", className: "border-slate-300 bg-white text-slate-700" };
  if (status === "closed") return { label: "Closed", className: "border-slate-300 bg-slate-100 text-slate-500" };
  return { label: "Status unknown", className: "border-slate-300 bg-white text-slate-600" };
}

function sourceLabel(source?: EventDiscoverySource) {
  if (!source) return "Source status unavailable";
  if (source.state === "unavailable") return "Refresh delayed · previous snapshot retained";
  if (source.state === "empty") return "Checked · no current listings returned";
  return `${source.count} ${source.count === 1 ? "listing" : "listings"} · checked ${relativeTime(source.checkedAt)}`;
}

function shortFormat(format: string) {
  if (/online|remote/i.test(format)) return "Online";
  if (/in person|offline/i.test(format)) return "In person";
  return format || "Format unknown";
}

function relativeTime(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1_440)}d ago`;
}

function platformUrl(platform: EventPlatform) {
  return ({ Unstop: "https://unstop.com/hackathons", Devpost: "https://devpost.com/hackathons", HackerEarth: "https://www.hackerearth.com/challenges/hackathon/", HackerRank: "https://www.hackerrank.com/contests", Yandex: "https://yandex.com/cup/" } as const)[platform];
}
