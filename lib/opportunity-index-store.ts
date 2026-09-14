import type { OpenSourceOpportunity, OpportunityPayload } from "./types";

export type IndexedRepository = {
  fullName: string;
  tiers: NonNullable<OpenSourceOpportunity["discoveryTiers"]>;
  indexedAt?: string;
  failures?: number;
};

export type OpportunityIndexState = {
  version: 1;
  records: OpenSourceOpportunity[];
  repositories: IndexedRepository[];
  createdAt: string;
  updatedAt: string;
  lastDiscoveryAt?: string;
};

const defaultKey = "helpmehack:opportunity-index:v1";
let memoryState: OpportunityIndexState | null = null;

function redisConfiguration() {
  const url = process.env.UPSTASH_REDIS_REST_URL
    ?? process.env.KV_REST_API_URL
    ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
    ?? process.env.KV_REST_API_TOKEN
    ?? process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function indexKey() {
  return process.env.OPPORTUNITY_INDEX_KEY?.trim() || defaultKey;
}

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  const config = redisConfiguration();
  if (!config) throw new Error("Persistent opportunity index is not configured.");
  const response = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const body = await response.json() as { result?: T; error?: string };
  if (!response.ok || body.error) throw new Error(body.error ?? `Persistent index returned ${response.status}.`);
  return body.result as T;
}

function isIndexState(value: unknown): value is OpportunityIndexState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OpportunityIndexState>;
  return state.version === 1 && Array.isArray(state.records) && Array.isArray(state.repositories) && typeof state.updatedAt === "string";
}

export function isPersistentOpportunityIndexConfigured() {
  return Boolean(redisConfiguration());
}

export async function readOpportunityIndex(): Promise<OpportunityIndexState | null> {
  const config = redisConfiguration();
  if (!config) return memoryState;
  const serialized = await redisCommand<string | null>(["GET", indexKey()]);
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized) as unknown;
    return isIndexState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeOpportunityIndex(state: OpportunityIndexState) {
  memoryState = state;
  if (!redisConfiguration()) return false;
  await redisCommand<string>(["SET", indexKey(), JSON.stringify(state)]);
  return true;
}

export function opportunityPayloadFromIndex(state: OpportunityIndexState): OpportunityPayload {
  const age = Date.now() - Date.parse(state.updatedAt);
  return {
    records: state.records,
    checkedAt: state.updatedAt,
    mode: "live",
    providerLabel: "Persistent GitHub opportunity index",
    refreshIntervalMs: 15 * 60_000,
    warning: age > 6 * 60 * 60_000 ? "The repository index is stale because its scheduled refresh has not completed recently." : undefined,
  };
}
