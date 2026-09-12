import { describe, expect, it } from "vitest";
import { buildCatalogSearchGroups, isCatalogRepository, labelsForCatalogRepository, REPOSITORY_CATALOG } from "./repository-catalog";

describe("repository catalog", () => {
  it("builds small GitHub search groups without mixing tiers or labels", () => {
    const groups = buildCatalogSearchGroups(REPOSITORY_CATALOG, 5);
    expect(groups.length).toBeGreaterThan(10);
    expect(groups.every((group) => group.repositories.length > 0 && group.repositories.length <= 5)).toBe(true);
    for (const group of groups) {
      for (const repo of group.repositories) {
        expect(REPOSITORY_CATALOG).toContainEqual(expect.objectContaining({ repo, tier: group.tier, label: group.label }));
      }
    }
  });

  it("recognizes catalog repositories case-insensitively", () => {
    expect(isCatalogRepository("OPPIA/OPPIA")).toBe(true);
    expect(isCatalogRepository("random-owner/random-repo")).toBe(false);
    expect(labelsForCatalogRepository("apache/airflow")).toContain("good first issue");
  });
});
