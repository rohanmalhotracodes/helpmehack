import { demoOpportunities } from "./data";
import { GitHubOpportunityProvider } from "./github-provider";
import { getIndexedOpportunityData, seedOpportunityIndex } from "./opportunity-indexer";
import { isPersistentOpportunityIndexConfigured } from "./opportunity-index-store";
import type { OpportunityPayload } from "./types";

export interface OpportunityProvider {
  readonly label: string;
  getAll(force?: boolean): Promise<OpportunityPayload>;
}

class DemoOpportunityProvider implements OpportunityProvider {
  readonly label = "Curated demo snapshot";

  async getAll(): Promise<OpportunityPayload> {
    return {
      records: demoOpportunities.filter((item) => item.category === "open-source"),
      checkedAt: "2026-09-12T05:40:00.000Z",
      mode: "demo",
      providerLabel: this.label,
      refreshIntervalMs: 60 * 60_000,
    };
  }
}

const githubProvider: OpportunityProvider = new GitHubOpportunityProvider();
const demoProvider: OpportunityProvider = new DemoOpportunityProvider();

export async function getOpportunityData(options: { force?: boolean; fallbackToDemo?: boolean } = {}) {
  const { force = false, fallbackToDemo = true } = options;

  if (!force && isPersistentOpportunityIndexConfigured()) {
    try {
      const indexed = await getIndexedOpportunityData();
      if (indexed) return indexed;

      const demo = await demoProvider.getAll();
      return {
        ...demo,
        warning: "The repository index is warming up in the background. Live results will appear as the scheduled GitHub refresh populates DynamoDB.",
      };
    } catch (error) {
      if (!fallbackToDemo) throw error;
      const demo = await demoProvider.getAll();
      return {
        ...demo,
        warning: error instanceof Error
          ? `The repository index is temporarily unavailable: ${error.message}`
          : "The repository index is temporarily unavailable.",
      };
    }
  }

  if (!force) {
    const indexed = await getIndexedOpportunityData().catch(() => null);
    if (indexed) return indexed;
  }

  try {
    const payload = await githubProvider.getAll(force);
    await seedOpportunityIndex(payload).catch(() => false);
    return payload;
  } catch (error) {
    if (!fallbackToDemo) throw error;
    const demo = await demoProvider.getAll();
    return {
      ...demo,
      warning: error instanceof Error ? `GitHub is unavailable: ${error.message} Showing demo records instead.` : "GitHub is unavailable. Showing demo records instead.",
    };
  }
}
