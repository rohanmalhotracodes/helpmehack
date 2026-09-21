import { describe, expect, it } from "vitest";
import type { OpenSourceOpportunity } from "./types";
import { mergeRepositorySeeds, reconcileRepositoryUniverse, replaceRepositoryRecords } from "./opportunity-indexer";

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


  it("lets newly discovered repositories replace stale universe entries", () => {
    const current = [
      { fullName: "old/one", tiers: ["moderate"] as const, indexedAt: "2026-09-10T00:00:00Z" },
      { fullName: "old/two", tiers: ["beginner"] as const, indexedAt: "2026-09-11T00:00:00Z" },
    ];
    const next = reconcileRepositoryUniverse(current, [
      { fullName: "new/repo", tiers: ["moderate"] },
      { fullName: "old/two", tiers: ["high-impact"] },
    ], 2);

    expect(next.map((entry) => entry.fullName)).toEqual(["new/repo", "old/two"]);
    expect(next[1]).toMatchObject({
      indexedAt: "2026-09-11T00:00:00Z",
      tiers: ["beginner", "high-impact"],
    });
  });


  it("keeps the active universe bounded when discovery rotates", () => {
    const current = [
      { fullName: "old/one", tiers: ["moderate"] as const },
      { fullName: "old/two", tiers: ["beginner"] as const },
    ];
    const next = reconcileRepositoryUniverse(current, [
      { fullName: "new/repo", tiers: ["moderate"] },
      { fullName: "old/two", tiers: ["beginner"] },
    ], 2);
    const activeKeys = new Set(next.map((entry) => entry.fullName.toLowerCase()));
    const records = [
      { id: "stale", owner: "old", repo: "one", category: "open-source" },
      { id: "keep", owner: "old", repo: "two", category: "open-source" },
    ] as OpenSourceOpportunity[];

    expect(records.filter((record) => activeKeys.has(`${record.owner}/${record.repo}`.toLowerCase())).map((record) => record.id)).toEqual(["keep"]);
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
