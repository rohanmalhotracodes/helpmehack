import type { EventDiscoveryPayload, EventDiscoverySource, EventOpportunity, EventPlatform } from "./types";

export const EVENT_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
export const EVENT_PLATFORMS: EventPlatform[] = ["Unstop", "Devpost", "HackerEarth", "HackerRank", "Yandex"];

const SOURCE_URLS: Record<EventPlatform, string> = {
  Unstop: "https://unstop.com/hackathons",
  Devpost: "https://devpost.com/hackathons",
  HackerEarth: "https://www.hackerearth.com/challenges/hackathon/",
  HackerRank: "https://www.hackerrank.com/contests",
  Yandex: "https://yandex.com/cup/",
};

type FetchOptions = { force?: boolean; now?: Date };

const requestInit = (force = false): RequestInit => ({
  headers: {
    Accept: "application/json, text/html;q=0.9",
    "User-Agent": "helpmehack.com event index (+https://helpmehack.com)",
  },
  signal: AbortSignal.timeout(8_000),
  ...(force ? { cache: "no-store" as const } : { next: { revalidate: 3600, tags: ["event-opportunities"] } }),
});

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asString = (value: unknown): string => typeof value === "string" ? value : "";
const asNumber = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const asNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
};
const validDate = (value: string) => Number.isFinite(Date.parse(value));
const absoluteUrl = (value: string, base: string) => {
  if (!value.trim()) return "";
  try {
    if (value.startsWith("//")) return `https:${value}`;
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};
const stripHtml = (value: string) => value
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/\s+/g, " ")
  .trim();
const concise = (value: string, fallback: string, max = 190) => {
  const clean = stripHtml(value);
  return clean ? `${clean.slice(0, max).trim()}${clean.length > max ? "…" : ""}` : fallback;
};
const uniqueStrings = (values: string[]) => [...new Set(values.filter(Boolean))];
const formatUtc = (value: string) => validDate(value)
  ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
  : "Deadline not published";
const eventStatus = (start: string | undefined, end: string | undefined, now: Date, explicitlyOpen = true): EventOpportunity["status"] => {
  const current = now.getTime();
  const starts = start && validDate(start) ? Date.parse(start) : undefined;
  const ends = end && validDate(end) ? Date.parse(end) : undefined;
  if (ends && ends <= current) return "closed";
  if (starts && starts > current) return "upcoming";
  if (!explicitlyOpen) return "unknown";
  if (ends && ends - current <= 14 * 24 * 60 * 60 * 1000) return "closing-soon";
  return "open";
};

export function mapDevpost(value: unknown, checkedAt: string): EventOpportunity | null {
  const item = asRecord(value);
  const id = asNumber(item.id);
  const title = asString(item.title);
  const url = absoluteUrl(asString(item.url), SOURCE_URLS.Devpost);
  if (!id || !title || !url) return null;
  const themes = asArray(item.themes).map((theme) => asString(asRecord(theme).name));
  const location = asString(asRecord(item.displayed_location).location) || "Location not published";
  const dateText = asString(item.submission_period_dates);
  const timeLeft = asString(item.time_left_to_submission);
  const daysLeft = Number(timeLeft.match(/(\d+)\s+days?/i)?.[1]);
  const prize = stripHtml(asString(item.prize_amount));
  return {
    id: `event-devpost-${id}`,
    category: "hackathon",
    platform: "Devpost",
    organizer: asString(item.organization_name) || "Organizer not published",
    title,
    summary: `A ${themes.slice(0, 2).join(" and ") || "developer"} event listed on Devpost. Open the official page for its rules, judging criteria, and submission requirements.`,
    status: asString(item.open_state) === "open" ? (Number.isFinite(daysLeft) && daysLeft <= 14 ? "closing-soon" : "open") : "unknown",
    deadline: [dateText, timeLeft].filter(Boolean).join(" · ") || "Deadline not published",
    eligibility: "See the official rules for eligibility and regional restrictions.",
    format: location,
    team: "Team requirements not exposed by the public listing.",
    cost: "Cost not stated in the public listing.",
    checkedAt,
    updatedAt: checkedAt,
    experience: "Beginner",
    tags: uniqueStrings(themes).slice(0, 4),
    officialUrl: url,
    sourceNote: "Discovered from Devpost's public hackathon index.",
    posterUrl: absoluteUrl(asString(item.thumbnail_url), "https://devpost.com"),
    posterFit: "cover",
    prize: prize || undefined,
    registrationCount: asNumber(item.registrations_count),
  };
}

export function mapUnstop(value: unknown, checkedAt: string, now = new Date()): EventOpportunity | null {
  const item = asRecord(value);
  const requirements = asRecord(item.regnRequirements);
  const id = asNumber(item.id);
  const title = asString(item.title);
  const url = absoluteUrl(asString(item.seo_url) || asString(item.public_url), SOURCE_URLS.Unstop);
  const registrationEnd = asString(requirements.end_regn_dt);
  const isOpen = item.regn_open === 1 || asString(requirements.reg_status) === "STARTED";
  if (!id || !title || !url || !isOpen || (validDate(registrationEnd) && Date.parse(registrationEnd) <= now.getTime())) return null;
  const filters = asArray(item.filters).map((entry) => asString(asRecord(entry).name));
  const skills = asArray(item.required_skills).map((entry) => asString(asRecord(entry).skill_name) || asString(asRecord(entry).skill));
  const minTeam = asNumber(requirements.min_team_size);
  const maxTeam = asNumber(requirements.max_team_size);
  const location = asRecord(item.address_with_country_logo);
  const city = asString(location.city);
  const region = asString(item.region);
  const payment = asRecord(asArray(item.payment_services)[0]);
  const amount = asNumber(payment.amount);
  const paid = item.isPaid === true || item.paid === 1;
  const deadline = registrationEnd || asString(item.end_date);
  const fullBanner = asString(asRecord(item.fullbannerimages).image_url);
  const listingArtwork = fullBanner || asString(item.thumb) || asString(item.logoUrl2);
  const posterUrl = absoluteUrl(listingArtwork, "https://unstop.com");
  const highResolutionPoster = posterUrl && fullBanner && !posterUrl.includes("?d=") ? `${posterUrl}${posterUrl.includes("?") ? "&" : "?"}d=451x676` : posterUrl;
  return {
    id: `event-unstop-${id}`,
    category: "hackathon",
    platform: "Unstop",
    organizer: asString(asRecord(item.organisation).name) || "Organizer not published",
    title,
    summary: concise(asString(item.details), "A hackathon listed on Unstop. Open the official page for the full brief and rules."),
    status: eventStatus(asString(requirements.start_regn_dt), deadline, now, isOpen),
    deadline: deadline ? `Registration closes ${formatUtc(deadline)}` : "Registration deadline not published",
    deadlineAt: validDate(deadline) ? new Date(deadline).toISOString() : undefined,
    eligibility: filters.slice(0, 3).join(", ") || "Eligibility not stated in the public listing.",
    format: region === "online" ? "Online" : city ? `In person · ${city}` : region === "offline" ? "In person · location on official page" : "Format not published",
    team: minTeam && maxTeam ? (minTeam === maxTeam ? `${minTeam} per team` : `Teams of ${minTeam}–${maxTeam}`) : "Team requirements not published",
    cost: paid ? amount ? `₹${amount.toLocaleString("en-IN")} (verify stage and terms)` : "Paid; amount on official page" : "Free",
    checkedAt,
    updatedAt: validDate(asString(item.updated_at)) ? new Date(asString(item.updated_at)).toISOString() : checkedAt,
    experience: "Beginner",
    tags: uniqueStrings([...skills, ...filters]).slice(0, 4),
    officialUrl: url,
    sourceNote: "Discovered from Unstop's public opportunity index.",
    posterUrl: highResolutionPoster,
    posterFit: fullBanner || asString(item.thumb) ? "cover" : "contain",
    registrationCount: asNumeric(item.registerCount),
  };
}

const developerSignal = /\b(ai|tech|technology|hackathon|code|coding|programming|software|developer|api|frontend|backend|full[ -]?stack|web application|mobile application|android|ios|machine learning|artificial intelligence|generative ai|cloud computing|cybersecurity|ethical hacking|devops|data structures|algorithm|python|javascript|typescript|java|sql|tableau|robotics?|arduino|embedded systems?|internet of things|iot|blockchain|quantum computing|data visualization|data analytics|data engineering|data science|predictive analytics|computational)\b|c\+\+|ui\/ux/i;

const byVisibleRegistrations = (a: EventOpportunity, b: EventOpportunity) =>
  (b.registrationCount ?? -1) - (a.registrationCount ?? -1) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);

export function selectUnstopCollections(hackathonValues: unknown[], featuredValues: unknown[], checkedAt: string, now = new Date()) {
  const featuredEvents = featuredValues
    .map((item) => mapUnstopFeatured(item, checkedAt, now))
    .filter((item): item is EventOpportunity => Boolean(item))
    .slice(0, 10);
  const featuredIds = new Set(featuredEvents.map((item) => item.id));

  const topHackathons = hackathonValues
    .map((item) => mapUnstop(item, checkedAt, now))
    .filter((item): item is EventOpportunity => Boolean(item))
    .filter((item) => !featuredIds.has(item.id))
    .sort(byVisibleRegistrations)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      collection: "Top hackathon" as const,
      sourceNote: "Ranked by visible registration count among active Unstop hackathons checked in this refresh.",
    }));

  return [...featuredEvents, ...topHackathons];
}

export function mapUnstopFeatured(value: unknown, checkedAt: string, now = new Date()): EventOpportunity | null {
  const item = asRecord(value);
  const type = asString(item.type);
  if (type === "competitions" || type === "hackathons") {
    const mapped = mapUnstop(item, checkedAt, now);
    return mapped ? {
      ...mapped,
      collection: "Featured on Unstop",
      sourceNote: "Listed in Unstop's public homepage Featured shelf at the last hourly check.",
    } : null;
  }

  if (type !== "custom") return null;
  const title = asString(item.featured_title) || asString(item.title);
  const url = absoluteUrl(asString(item.url), "https://unstop.com");
  const isUnstopEventLink = item.unstop_link === 1 && !/\/mario_game|\/jobs?|\/internships?/i.test(url);
  if (!title || !url || (!isUnstopEventLink && !developerSignal.test(title))) return null;
  const poster = absoluteUrl(asString(asRecord(item.fullbannerimages).image_url), "https://unstop.com");
  if (!poster) return null;
  const updatedAt = asString(item.updated_at);
  return {
    id: `event-unstop-featured-${asNumber(item.featured_id) ?? asNumber(item.id) ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    category: "hackathon",
    platform: "Unstop",
    organizer: "Organizer details on the official page",
    title,
    summary: "A developer-relevant event currently included in Unstop's official homepage Featured shelf.",
    status: "unknown",
    deadline: "Registration deadline not exposed in the Featured listing",
    eligibility: "See the official listing for eligibility.",
    format: "Format available on the official listing",
    team: "Team requirements available on the official listing",
    cost: "Cost available on the official listing",
    checkedAt,
    updatedAt: validDate(updatedAt) ? new Date(updatedAt).toISOString() : checkedAt,
    experience: "Beginner",
    tags: ["featured"],
    officialUrl: url,
    sourceNote: "Listed in Unstop's public homepage Featured shelf at the last hourly check.",
    posterUrl: `${poster}${poster.includes("?") ? "&" : "?"}d=451x676`,
    posterFit: "cover",
    collection: "Featured on Unstop",
  };
}

export function mapHackerEarth(value: unknown, checkedAt: string, now = new Date()): EventOpportunity | null {
  const item = asRecord(value);
  const title = asString(item.title);
  const slug = asString(item.slug);
  const end = asString(item.end);
  const type = asString(item.type);
  const url = absoluteUrl(asString(item.url), SOURCE_URLS.HackerEarth);
  if (!slug || !title || !url || type !== "Hackathon" || !validDate(end) || Date.parse(end) <= now.getTime()) return null;
  const minTeam = asNumber(item.min_team_size);
  const maxTeam = asNumber(item.max_team_size);
  return {
    id: `event-hackerearth-${slug}`,
    category: "hackathon",
    platform: "HackerEarth",
    organizer: asString(item.company_name) || "Organizer not published",
    title,
    summary: "A public HackerEarth hackathon. Review the official challenge page for problem statements, eligibility, and submission rules.",
    status: eventStatus(asString(item.start), end, now),
    deadline: `Ends ${formatUtc(end)}`,
    deadlineAt: new Date(end).toISOString(),
    eligibility: "Eligibility is available on the official challenge page.",
    format: "Online unless the official challenge page says otherwise",
    team: minTeam && maxTeam ? (minTeam === maxTeam ? `${minTeam === 1 ? "Individual" : `${minTeam} per team`}` : `Teams of ${minTeam}–${maxTeam}`) : "Team requirements not published",
    cost: "Cost not stated in the public listing.",
    checkedAt,
    updatedAt: checkedAt,
    experience: "Intermediate",
    tags: ["hackathon", "coding"],
    officialUrl: url,
    sourceNote: "Discovered from HackerEarth's public competition endpoint.",
    posterUrl: absoluteUrl(asString(item.listing_image) || asString(item.image_url), SOURCE_URLS.HackerEarth),
    posterFit: "cover",
  };
}

export function mapHackerRank(value: unknown, checkedAt: string, now = new Date()): EventOpportunity | null {
  const item = asRecord(value);
  const id = asNumber(item.id);
  const title = asString(item.name);
  const slug = asString(item.slug);
  const start = asString(item.get_starttimeiso);
  const end = asString(item.get_endtimeiso);
  if (!id || !title || !slug || item.ended === true || !validDate(end) || Date.parse(end) <= now.getTime()) return null;
  const description = asString(item.description);
  const placeholder = /provide a short description/i.test(description);
  return {
    id: `event-hackerrank-${id}`,
    category: "hackathon",
    platform: "HackerRank",
    organizer: asString(item.organization_name) || "HackerRank",
    title,
    summary: placeholder ? "A coding competition published on HackerRank. Check the contest page for its challenge rules and participation details." : concise(description, "A coding competition published on HackerRank."),
    status: eventStatus(start, end, now),
    deadline: `Ends ${formatUtc(end)}`,
    deadlineAt: new Date(end).toISOString(),
    eligibility: "Eligibility is not exposed by the public contest index.",
    format: "Online",
    team: "Participation rules are available on the official contest page.",
    cost: "Cost not stated in the public contest index.",
    checkedAt,
    updatedAt: validDate(asString(item.created_at)) ? new Date(asString(item.created_at)).toISOString() : checkedAt,
    experience: "Intermediate",
    tags: uniqueStrings(asArray(item.categories).map((entry) => asString(entry))).slice(0, 4),
    officialUrl: `https://www.hackerrank.com/contests/${encodeURIComponent(slug)}`,
    sourceNote: "Discovered from HackerRank's public upcoming-contests endpoint.",
    posterUrl: "https://hrcdn.net/og/default.jpg",
    posterFit: "cover",
  };
}

const metaContent = (html: string, property: string) => {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, "i"))?.[1]
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"))?.[1]
    ?? "";
};

export function mapYandex(html: string, checkedAt: string): EventOpportunity | null {
  const clean = stripHtml(html);
  const hasAnnouncement = /Yandex Cup 2026/i.test(clean) || /YANDEX CUP 2026/i.test(html) || /CUP\\u0026nbsp;2026/i.test(html);
  if (!hasAnnouncement) return null;
  const poster = absoluteUrl(metaContent(html, "og:image"), SOURCE_URLS.Yandex).replace(/^http:/, "https:");
  return {
    id: "event-yandex-cup-2026",
    category: "hackathon",
    platform: "Yandex",
    organizer: "Yandex",
    title: "Yandex Cup 2026",
    summary: "Yandex's international programming championship across front-end, back-end, mobile, analytics, algorithms, machine learning, and junior tracks.",
    status: "upcoming",
    deadline: "Registration opens September 2026 · exact date and time not yet published",
    eligibility: "Current 2026 eligibility details are not yet published.",
    format: "Online rounds · final location not yet confirmed for 2026",
    team: "Individual competition",
    cost: "Cost not stated",
    checkedAt,
    updatedAt: checkedAt,
    experience: "Intermediate",
    tags: ["algorithms", "machine learning", "frontend", "backend"],
    officialUrl: SOURCE_URLS.Yandex,
    sourceNote: "Read from the official Yandex Cup 2026 announcement page. Exact dates remain unpublished.",
    posterUrl: poster || undefined,
    posterFit: "cover",
  };
}

async function json(url: string, force: boolean) {
  const response = await fetch(url, requestInit(force));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function discoverPlatform(platform: EventPlatform, options: FetchOptions): Promise<EventOpportunity[]> {
  const checkedAt = new Date().toISOString();
  const now = options.now ?? new Date();
  if (platform === "Devpost") {
    const body = asRecord(await json("https://devpost.com/api/hackathons?status%5B%5D=open&page=1", Boolean(options.force)));
    return asArray(body.hackathons).map((item) => mapDevpost(item, checkedAt)).filter((item): item is EventOpportunity => Boolean(item));
  }
  if (platform === "Unstop") {
    const [hackathonResult, featuredResult] = await Promise.allSettled([
      json("https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&oppstatus=open&per_page=50&page=1", Boolean(options.force)),
      json("https://unstop.com/api/public/get-all-featured?page=homepage&custom=true", Boolean(options.force)),
    ]);
    if (hackathonResult.status === "rejected" && featuredResult.status === "rejected") throw hackathonResult.reason;
    const hackathons = hackathonResult.status === "fulfilled" ? asArray(asRecord(asRecord(hackathonResult.value).data).data) : [];
    const featured = featuredResult.status === "fulfilled" ? asArray(asRecord(featuredResult.value).data) : [];
    return selectUnstopCollections(hackathons, featured, checkedAt, now);
  }
  if (platform === "HackerEarth") {
    const body = asRecord(await json("https://www.hackerearth.com/api/community/challenges/compete/", Boolean(options.force)));
    return asArray(body.data).map((item) => mapHackerEarth(item, checkedAt, now)).filter((item): item is EventOpportunity => Boolean(item));
  }
  if (platform === "HackerRank") {
    const body = asRecord(await json("https://www.hackerrank.com/rest/contests/upcoming?offset=0&limit=20", Boolean(options.force)));
    return asArray(body.models).map((item) => mapHackerRank(item, checkedAt, now)).filter((item): item is EventOpportunity => Boolean(item));
  }
  const response = await fetch(SOURCE_URLS.Yandex, requestInit(Boolean(options.force)));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const item = mapYandex(await response.text(), checkedAt);
  return item ? [item] : [];
}

export async function getEventDiscovery(options: FetchOptions = {}): Promise<EventDiscoveryPayload> {
  const checkedAt = new Date().toISOString();
  const settled = await Promise.allSettled(EVENT_PLATFORMS.map((platform) => discoverPlatform(platform, options)));
  const records: EventOpportunity[] = [];
  const sources: EventDiscoverySource[] = settled.map((result, index) => {
    const platform = EVENT_PLATFORMS[index];
    if (result.status === "rejected") return {
      platform,
      state: "unavailable",
      count: 0,
      checkedAt,
      sourceUrl: SOURCE_URLS[platform],
      message: result.reason instanceof Error ? result.reason.message : "Source request failed",
    };
    records.push(...result.value);
    return {
      platform,
      state: result.value.length ? "live" : "empty",
      count: result.value.length,
      checkedAt,
      sourceUrl: SOURCE_URLS[platform],
      message: result.value.length ? undefined : "No currently available events were returned by this source.",
    };
  });
  const liveCount = sources.filter((source) => source.state === "live").length;
  return {
    records,
    checkedAt,
    refreshIntervalMs: EVENT_REFRESH_INTERVAL_MS,
    mode: liveCount === EVENT_PLATFORMS.length ? "live" : liveCount ? "partial" : "unavailable",
    sources,
  };
}
