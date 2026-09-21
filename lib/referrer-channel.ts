export type ReferrerChannel = "ai" | "search" | "referral" | "direct" | "unknown";
const aiHosts = ["chatgpt.com", "chat.openai.com", "claude.ai", "perplexity.ai", "gemini.google.com", "copilot.microsoft.com"];
const searchHosts = ["google.com", "google.co.uk", "google.co.in", "bing.com", "duckduckgo.com", "search.yahoo.com", "search.brave.com", "ecosia.org"];
const matches = (host: string, domains: string[]) => domains.some(domain => host === domain || host.endsWith(`.${domain}`));

// Accept only known campaign values. Never retain arbitrary campaign text or URLs.
export function classifyReferrer(referrer: string, search: string, ownHost: string): ReferrerChannel {
  if (new URLSearchParams(search).get("utm_source")?.toLowerCase() === "chatgpt.com") return "ai";
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    if (!["http:", "https:"].includes(url.protocol)) return "unknown";
    const host = url.hostname.toLowerCase();
    if (host === ownHost) return "direct";
    if (matches(host, aiHosts)) return "ai";
    if (matches(host, searchHosts)) return "search";
    return "referral";
  } catch { return "unknown"; }
}

export function isReferrerChannel(value: string | null): value is ReferrerChannel {
  return ["ai", "search", "referral", "direct", "unknown"].includes(value ?? "");
}
