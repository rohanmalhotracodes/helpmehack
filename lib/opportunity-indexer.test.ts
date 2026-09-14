import { describe, expect, it } from "vitest";
import type { OpenSourceOpportunity } from "./types";
import { mergeRepositorySeeds, replaceRepositoryRecords } from "./opportunity-indexer";

describe("persistent opportunity index", () => {
  it("merges discovered tiers without losing indexing progress", () => {
    const merged = mergeRepositorySeeds([
      { fullName: "acme/widgets", tiers: ["beginner"], indexedAt: "2026-09-14T00:00:00Z", failures: 1 },
    ], [
      { fullName: "Acme/Widgets", tiers: ["moderate", "high-impact"] },
      { fullName: "tools/parser", tiers: ["moderate"] },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      fullName: "acme/widgets",
      tiers: ["beginner", "moderate", "high-impact"],
      indexedAt: "2026-09-14T00:00:00Z",
      failures: 1,
    });
  });

  it("replaces one repository snapshot without removing other repositories", () => {
    const record = (id: string, owner: string, repo: string) => ({ id, owner, repo, category: "open-source" }) as OpenSourceOpportunity;
    const result = replaceRepositoryRecords(
      [record("old", "acme", "widgets"), record("keep", "tools", "parser")],
      "ACME/WIDGETS",
      [record("new", "acme", "widgets")],
    );

    expect(result.map((item) => item.id)).toEqual(["keep", "new"]);
  });
});
