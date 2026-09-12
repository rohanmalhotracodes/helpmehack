import { demoOpportunities } from "./data";
import { GitHubOpportunityProvider } from "./github-provider";
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
  try {
    return await githubProvider.getAll(force);
  } catch (error) {
    if (!fallbackToDemo) throw error;
    const demo = await demoProvider.getAll();
    return {
      ...demo,
      warning: error instanceof Error ? `GitHub is unavailable: ${error.message} Showing demo records instead.` : "GitHub is unavailable. Showing demo records instead.",
    };
  }
}
