import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
const metaSortKey = "META";
let memoryState: OpportunityIndexState | null = null;
let documentClient: DynamoDBDocumentClient | null = null;

function dynamoConfiguration() {
  const tableName = process.env.HELPMEHACK_DYNAMODB_TABLE?.trim();
  const region = process.env.HELPMEHACK_DYNAMODB_REGION?.trim();
  return tableName ? { tableName, region: region || undefined } : null;
}

function indexKey() {
  return process.env.OPPORTUNITY_INDEX_KEY?.trim() || defaultKey;
}

function partitionKey() {
  return `INDEX#${indexKey()}`;
}

function repositoryKey(fullName: string) {
  return `REPO#${fullName.toLowerCase()}`;
}

function recordKey(record: OpenSourceOpportunity) {
  return `RECORD#${record.owner}/${record.repo}`.toLowerCase();
}

function cloneState(state: OpportunityIndexState) {
  return JSON.parse(JSON.stringify(state)) as OpportunityIndexState;
}

function client() {
  const config = dynamoConfiguration();
  if (!config) throw new Error("Persistent opportunity index is not configured.");
  if (!documentClient) {
    const base = new DynamoDBClient(config.region ? { region: config.region } : {});
    documentClient = DynamoDBDocumentClient.from(base, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return documentClient;
}

function isIndexState(value: unknown): value is OpportunityIndexState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OpportunityIndexState>;
  return state.version === 1 && Array.isArray(state.records) && Array.isArray(state.repositories) && typeof state.updatedAt === "string";
}

function recordMap(records: OpenSourceOpportunity[]) {
  return new Map(records.map((record) => [`${record.owner}/${record.repo}`.toLowerCase(), record]));
}

function repositoryMap(repositories: IndexedRepository[]) {
  return new Map(repositories.map((repository) => [repository.fullName.toLowerCase(), repository]));
}

function changed(left: unknown, right: unknown) {
  return JSON.stringify(left) !== JSON.stringify(right);
}

async function batchWrite(requests: Array<Record<string, unknown>>) {
  const config = dynamoConfiguration();
  if (!config || !requests.length) return;
  let pending = requests;

  for (let attempt = 0; pending.length && attempt < 6; attempt += 1) {
    const next: Array<Record<string, unknown>> = [];
    for (let offset = 0; offset < pending.length; offset += 25) {
      const chunk = pending.slice(offset, offset + 25);
      const response = await client().send(new BatchWriteCommand({
        RequestItems: { [config.tableName]: chunk },
      }));
      next.push(...(response.UnprocessedItems?.[config.tableName] ?? []));
    }
    pending = next;
    if (pending.length) await new Promise((resolve) => setTimeout(resolve, 75 * (attempt + 1)));
  }

  if (pending.length) throw new Error(`DynamoDB left ${pending.length} opportunity-index writes unprocessed.`);
}

export function isPersistentOpportunityIndexConfigured() {
  return Boolean(dynamoConfiguration());
}

export async function readOpportunityIndex(): Promise<OpportunityIndexState | null> {
  const config = dynamoConfiguration();
  if (!config) return memoryState;

  const items: Array<Record<string, unknown>> = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const response = await client().send(new QueryCommand({
      TableName: config.tableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": "pk" },
      ExpressionAttributeValues: { ":pk": partitionKey() },
      ConsistentRead: true,
      ExclusiveStartKey: exclusiveStartKey,
    }));
    items.push(...((response.Items ?? []) as Array<Record<string, unknown>>));
    exclusiveStartKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  const meta = items.find((item) => item.sk === metaSortKey);
  if (!meta) return null;

  const state: OpportunityIndexState = {
    version: 1,
    records: items
      .filter((item) => typeof item.sk === "string" && item.sk.startsWith("RECORD#") && item.payload)
      .map((item) => item.payload as OpenSourceOpportunity),
    repositories: items
      .filter((item) => typeof item.sk === "string" && item.sk.startsWith("REPO#") && item.payload)
      .map((item) => item.payload as IndexedRepository),
    createdAt: String(meta.createdAt ?? ""),
    updatedAt: String(meta.updatedAt ?? ""),
    lastDiscoveryAt: typeof meta.lastDiscoveryAt === "string" ? meta.lastDiscoveryAt : undefined,
  };

  if (!isIndexState(state)) return null;
  memoryState = cloneState(state);
  return state;
}

export async function writeOpportunityIndex(state: OpportunityIndexState) {
  const config = dynamoConfiguration();
  const previous = memoryState ? cloneState(memoryState) : null;
  memoryState = cloneState(state);
  if (!config) return false;

  const pk = partitionKey();
  const requests: Array<Record<string, unknown>> = [{
    PutRequest: {
      Item: {
        pk,
        sk: metaSortKey,
        version: state.version,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        lastDiscoveryAt: state.lastDiscoveryAt,
      },
    },
  }];

  const previousRepositories = repositoryMap(previous?.repositories ?? []);
  const nextRepositories = repositoryMap(state.repositories);
  for (const [key, repository] of nextRepositories) {
    if (!previousRepositories.has(key) || changed(previousRepositories.get(key), repository)) {
      requests.push({ PutRequest: { Item: { pk, sk: repositoryKey(repository.fullName), payload: repository } } });
    }
  }
  for (const [key, repository] of previousRepositories) {
    if (!nextRepositories.has(key)) {
      requests.push({ DeleteRequest: { Key: { pk, sk: repositoryKey(repository.fullName) } } });
    }
  }

  const previousRecords = recordMap(previous?.records ?? []);
  const nextRecords = recordMap(state.records);
  for (const [key, record] of nextRecords) {
    if (!previousRecords.has(key) || changed(previousRecords.get(key), record)) {
      requests.push({ PutRequest: { Item: { pk, sk: recordKey(record), payload: record } } });
    }
  }
  for (const [key, record] of previousRecords) {
    if (!nextRecords.has(key)) {
      requests.push({ DeleteRequest: { Key: { pk, sk: recordKey(record) } } });
    }
  }

  await batchWrite(requests);
  return true;
}

export function opportunityPayloadFromIndex(state: OpportunityIndexState): OpportunityPayload {
  const age = Date.now() - Date.parse(state.updatedAt);
  return {
    records: state.records,
    checkedAt: state.updatedAt,
    mode: "live",
    providerLabel: "Persistent GitHub opportunity index · Amazon DynamoDB",
    refreshIntervalMs: 15 * 60_000,
    warning: age > 6 * 60 * 60_000 ? "The repository index is stale because its scheduled refresh has not completed recently." : undefined,
  };
}
