import { discoverRepositoryUniverse, getRepositoryIndexRecords, type RepositoryDiscoverySeed } from "./github-provider";
import { REPOSITORY_CATALOG } from "./repository-catalog";
import { isPersistentOpportunityIndexConfigured, opportunityPayloadFromIndex, readOpportunityIndex, writeOpportunityIndex, type IndexedRepository, type OpportunityIndexState } from "./opportunity-index-store";
import type { OpenSourceOpportunity, OpportunityPayload } from "./types";

const dayMs = 86_400_000;

function configuredNumber(name: string, fallback: number, minimum: number, maximum: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.round(value))) : fallback;
}

function catalogSeeds(): RepositoryDiscoverySeed[] {
  const seeds = new Map<string, RepositoryDiscoverySeed>();
  for (const entry of REPOSITORY_CATALOG) {
    const key = entry.repo.toLowerCase();
    const existing = seeds.get(key);
    seeds.set(key, { fullName: entry.repo, tiers: [...new Set([...(existing?.tiers ?? []), entry.tier])] });
  }
  return [...seeds.values()];
}

export function mergeRepositorySeeds(current: IndexedRepository[], incoming: RepositoryDiscoverySeed[]) {
  const merged = new Map(current.map((entry) => [entry.fullName.toLowerCase(), entry]));
  for (const seed of incoming) {
    const key = seed.fullName.toLowerCase();
    const existing = merged.get(key);
    merged.set(key, {
      ...existing,
      fullName: existing?.fullName ?? seed.fullName,
      tiers: [...new Set([...(existing?.tiers ?? []), ...seed.tiers])],
    });
  }
  return [...merged.values()];
}

export function reconcileRepositoryUniverse(current: IndexedRepository[], discovered: RepositoryDiscoverySeed[], target: number) {
  const previous = new Map(current.map((entry) => [entry.fullName.toLowerCase(), entry]));
  return discovered.slice(0, target).map((seed) => {
    const existing = previous.get(seed.fullName.toLowerCase());
    return {
      ...existing,
      fullName: existing?.fullName ?? seed.fullName,
      tiers: [...new Set([...(existing?.tiers ?? []), ...seed.tiers])],
    };
  });
}

export function replaceRepositoryRecords(current: OpenSourceOpportunity[], repository: string, incoming: OpenSourceOpportunity[]) {
  const key = repository.toLowerCase();
  return [...current.filter((record) => `${record.owner}/${record.repo}`.toLowerCase() !== key), ...incoming];
}

function emptyState(now: string): OpportunityIndexState {
  return {
    version: 1,
    records: [],
    repositories: mergeRepositorySeeds([], catalogSeeds()),
    createdAt: now,
    updatedAt: now,
  };
}

export async function getIndexedOpportunityData() {
  const state = await readOpportunityIndex();
  return state?.records.length ? opportunityPayloadFromIndex(state) : null;
}

export async function seedOpportunityIndex(payload: OpportunityPayload) {
  const incoming = payload.records.filter((record): record is OpenSourceOpportunity => record.category === "open-source");
  if (!incoming.length) return false;
  const now = payload.checkedAt || new Date().toISOString();
  const state = await readOpportunityIndex().catch(() => null) ?? emptyState(now);
  const repositories = new Map(state.repositories.map((entry) => [entry.fullName.toLowerCase(), entry]));
  for (const record of incoming) {
    const fullName = `${record.owner}/${record.repo}`;
    const key = fullName.toLowerCase();
    const existing = repositories.get(key);
    repositories.set(key, {
      ...existing,
      fullName: existing?.fullName ?? fullName,
      tiers: [...new Set([...(existing?.tiers ?? []), ...(record.discoveryTiers ?? [])])],
      indexedAt: record.checkedAt,
      failures: 0,
    });
  }
  const replacedRepositories = new Set(incoming.map((record) => `${record.owner}/${record.repo}`.toLowerCase()));
  state.records = [...state.records.filter((record) => !replacedRepositories.has(`${record.owner}/${record.repo}`.toLowerCase())), ...incoming];
  state.repositories = mergeRepositorySeeds([...repositories.values()], catalogSeeds());
  state.updatedAt = now;
  return writeOpportunityIndex(state);
}

export async function refreshOpportunityIndex(options: { batchSizeOverride?: number; discoveryOnly?: boolean } = {}) {
  const startedAt = new Date().toISOString();
  const target = configuredNumber("OPPORTUNITY_INDEX_TARGET", 500, 100, 1_000);
  const configuredBatchSize = configuredNumber("OPPORTUNITY_INDEX_BATCH_SIZE", 24, 1, 30);
  const batchSizeOverride = options.batchSizeOverride == null
    ? undefined
    : Math.min(6, Math.max(1, Math.round(options.batchSizeOverride)));
  const concurrency = configuredNumber("OPPORTUNITY_INDEX_CONCURRENCY", 4, 1, 6);
  const state = await readOpportunityIndex().catch(() => null) ?? emptyState(startedAt);
  let discoveryError: string | undefined;
  let discoveryChanged = false;

  if (!state.lastDiscoveryAt || Date.now() - Date.parse(state.lastDiscoveryAt) >= dayMs || state.repositories.length < Math.min(100, target)) {
    try {
      const discovered = await discoverRepositoryUniverse(false, target);
      state.repositories = reconcileRepositoryUniverse(state.repositories, discovered, target);
      const activeRepositoryKeys = new Set(state.repositories.map((entry) => entry.fullName.toLowerCase()));
      state.records = state.records.filter((record) => activeRepositoryKeys.has(`${record.owner}/${record.repo}`.toLowerCase()));
      state.lastDiscoveryAt = startedAt;
      discoveryChanged = true;
    } catch (error) {
      discoveryError = error instanceof Error ? error.message : "Repository discovery failed.";
    }
  }

  const availableRepositories = new Set(state.records.map((record) => `${record.owner}/${record.repo}`.toLowerCase())).size;

  if (options.discoveryOnly) {
    if (discoveryChanged) {
      state.updatedAt = startedAt;
      await writeOpportunityIndex(state);
    }
    return {
      persistent: isPersistentOpportunityIndexConfigured(),
      discovered: state.repositories.length,
      indexed: state.repositories.filter((entry) => entry.indexedAt).length,
      available: availableRepositories,
      refreshed: 0,
      failed: 0,
      checkedAt: state.updatedAt,
      discoveryError,
    };
  }

  const effectiveBatchSize = batchSizeOverride ?? (availableRepositories < 60 ? Math.max(configuredBatchSize, 30) : configuredBatchSize);
  const selected = [...state.repositories]
    .sort((a, b) => Date.parse(a.indexedAt ?? "1970-01-01") - Date.parse(b.indexedAt ?? "1970-01-01"))
    .slice(0, effectiveBatchSize);
  let refreshed = 0;
  let failed = 0;

  for (let index = 0; index < selected.length; index += concurrency) {
    const group = selected.slice(index, index + concurrency);
    const results = await Promise.all(group.map(async (entry) => {
      const [owner, repo] = entry.fullName.split("/");
      if (!owner || !repo) return { entry, records: [] as OpenSourceOpportunity[], error: "Invalid repository name." };
      try {
        return { entry, records: await getRepositoryIndexRecords(owner, repo, entry.tiers) };
      } catch (error) {
        return { entry, records: [] as OpenSourceOpportunity[], error: error instanceof Error ? error.message : "Repository refresh failed." };
      }
    }));

    for (const result of results) {
      const repository = state.repositories.find((entry) => entry.fullName.toLowerCase() === result.entry.fullName.toLowerCase());
      if (!repository) continue;
      repository.indexedAt = new Date().toISOString();
      if (result.error) {
        repository.failures = (repository.failures ?? 0) + 1;
        failed += 1;
        continue;
      }
      repository.failures = 0;
      state.records = replaceRepositoryRecords(state.records, repository.fullName, result.records);
      refreshed += 1;
    }
    if (results.some((result) => !result.error)) state.updatedAt = new Date().toISOString();
    await writeOpportunityIndex(state);
  }

  return {
    persistent: isPersistentOpportunityIndexConfigured(),
    discovered: state.repositories.length,
    indexed: state.repositories.filter((entry) => entry.indexedAt).length,
    available: new Set(state.records.map((record) => `${record.owner}/${record.repo}`.toLowerCase())).size,
    refreshed,
    failed,
    checkedAt: state.updatedAt,
    discoveryError,
  };
}
