import { describe, expect, it } from "vitest";
import { demoOpportunities } from "./data";
import { defaultFilters, filterOpportunities } from "./filter";

describe("filterOpportunities", () => {
  it("combines category, language, experience, status, and search", () => {
    const results = filterOpportunities(demoOpportunities, {
      ...defaultFilters,
      category: "open-source",
      languages: ["TypeScript"],
      experience: ["Beginner"],
      statuses: ["unassigned"],
      query: "session",
    }, []);
    expect(results.map((item) => item.id)).toEqual(["os-ember-auth-214"]);
  });

  it("shows only saved records when requested", () => {
    const results = filterOpportunities(demoOpportunities, { ...defaultFilters, savedOnly: true }, ["os-pixel-cache-88", "event-oss-weekend"]);
    expect(results.map((item) => item.id).sort()).toEqual(["event-oss-weekend", "os-pixel-cache-88"]);
  });

  it("sorts known event deadlines ahead of issues for closing soon", () => {
    const results = filterOpportunities(demoOpportunities, { ...defaultFilters, sort: "closing" }, []);
    expect(results[0].id).toBe("event-oss-weekend");
  });

  it("ranks startable work ahead of unavailable issues by default", () => {
    const results = filterOpportunities(demoOpportunities, defaultFilters, []);
    expect(results[0].category).toBe("open-source");
    if (results[0].category === "open-source") expect(results[0].status).toBe("unassigned");
  });

  it("uses feed score for equally available issues and repository quality in repository view", () => {
    const source = demoOpportunities.find((item) => item.category === "open-source" && item.status === "unassigned");
    if (!source || source.category !== "open-source") throw new Error("Missing fixture");
    const quality = (score: number) => ({ score, coverage: 100, label: "Evidence", windowDays: 90 as const, checkedAt: source.checkedAt, stars: 100, factors: [] });
    const low = { ...source, id: "low", repo: "low", feedScore: 40, repositoryQuality: quality(90) };
    const high = { ...source, id: "high", repo: "high", feedScore: 80, repositoryQuality: quality(70) };
    expect(filterOpportunities([low, high], { ...defaultFilters, category: "open-source" }, [])[0].id).toBe("high");
    expect(filterOpportunities([low, high], { ...defaultFilters, category: "repositories" }, [])[0].id).toBe("low");
  });
});
