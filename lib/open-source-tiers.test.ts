import { describe, expect, it } from "vitest";
import { rankOpenSourceTiers } from "./open-source-tiers";
import type { OpenSourceOpportunity, RepositoryQuality } from "./types";

const quality = (stars: number, reputation: number, onboarding: number): RepositoryQuality => ({
  score: 75,
  coverage: 100,
  label: "Strong repository evidence",
  windowDays: 90,
  checkedAt: "2026-09-12T00:00:00Z",
  stars,
  factors: [
    { key: "newcomers", label: "Newcomers", weight: 30, earned: 20, evidence: "2 of 3 merged", sampleSize: 3 },
    { key: "responsiveness", label: "Response", weight: 25, earned: 18, evidence: "3 replies", sampleSize: 3 },
    { key: "reputation", label: "Reputation", weight: 20, earned: reputation, evidence: "Public adoption" },
    { key: "maintenance", label: "Maintenance", weight: 15, earned: 12, evidence: "Recently pushed" },
    { key: "onboarding", label: "Onboarding", weight: 10, earned: onboarding, evidence: "Guide and tests" },
  ],
});

const item = (id: string, overrides: Partial<OpenSourceOpportunity> = {}): OpenSourceOpportunity => ({
  id, category: "open-source", owner: "acme", repo: id, avatar: "AC", issueNumber: 1, title: "Improve a focused behavior", summary: "Clear issue summary", language: "TypeScript", languageColor: "#3178c6", labels: ["good first issue"], experience: "Beginner", status: "unassigned", statusDetail: "Available", checkedAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z", caution: "Verify first", assignment: "Optional", visibleClaims: "None", linkedPrs: "None", blockers: "None", startSteps: ["Read guide"], setup: ["npm test"], avoid: [], sources: [], beginnerSuitability: 80, clarityReadiness: 75, repositoryQuality: quality(500, 10, 8), ...overrides,
});

describe("open-source tier ranking", () => {
  it("separates beginner-ready, moderate, and high-impact work", () => {
    const tiers = rankOpenSourceTiers([
      item("beginner"),
      item("moderate", { experience: "Intermediate", labels: ["help wanted"], beginnerSuitability: 45 }),
      item("impact", { repositoryQuality: quality(120_000, 19, 8) }),
      item("claimed", { status: "possibly-claimed" }),
    ]);
    expect(tiers.map((tier) => [tier.id, tier.items.map(({ item: entry }) => entry.id)])).toEqual([
      ["beginner", ["beginner", "impact"]],
      ["moderate", ["moderate"]],
      ["high-impact", ["impact"]],
    ]);
  });
});
