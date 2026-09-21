import { describe, expect, it } from "vitest";
import { isHumanMaintainerEvent, passesRepositoryQualityGate, scoreIssue, scoreRepository, type PullObservation } from "./ranking";

const checkedAt = "2026-09-12T00:00:00.000Z";

function pull(overrides: Partial<PullObservation> = {}): PullObservation {
  return { createdAt: "2026-09-01T00:00:00.000Z", merged: true, newcomer: true, external: true, responded: true, firstResponseHours: 12, ...overrides };
}

describe("repository quality scoring", () => {
  it("uses all five weighted factors when behavioral samples are sufficient", () => {
    const quality = scoreRepository({
      checkedAt,
      stars: 10_000,
      forks: 2_000,
      pushedAt: "2026-09-10T00:00:00.000Z",
      latestReleaseAt: "2026-08-20T00:00:00.000Z",
      recentPulls: [pull(), pull({ createdAt: "2026-08-15T00:00:00.000Z" }), pull({ newcomer: false, firstResponseHours: 36 })],
      hasContributionGuide: true,
      hasSetupInstructions: true,
      hasTestInstructions: true,
      hasBeginnerIssues: true,
    });
    expect(quality.coverage).toBe(100);
    expect(quality.score).not.toBeNull();
    expect(quality.factors.map((factor) => factor.weight)).toEqual([30, 25, 20, 15, 10]);
  });

  it("withholds the overall score when newcomer or response samples are sparse", () => {
    const quality = scoreRepository({ checkedAt, stars: 100_000, forks: 20_000, pushedAt: checkedAt, latestReleaseAt: null, recentPulls: [pull()], hasContributionGuide: true, hasSetupInstructions: true, hasTestInstructions: true, hasBeginnerIssues: true });
    expect(quality.score).toBeNull();
    expect(quality.coverage).toBe(45);
    expect(quality.label).toBe("Insufficient quality evidence");
  });


  it("requires meaningful maintenance and onboarding for auto-discovered repositories", () => {
    const healthy = scoreRepository({
      checkedAt,
      stars: 2_000,
      forks: 300,
      pushedAt: "2026-09-10T00:00:00.000Z",
      latestReleaseAt: null,
      recentPulls: [pull()],
      hasContributionGuide: true,
      hasSetupInstructions: true,
      hasTestInstructions: false,
      hasBeginnerIssues: true,
    });
    expect(healthy.score).toBeNull();
    expect(passesRepositoryQualityGate(healthy)).toBe(true);

    const poorlyDocumented = scoreRepository({
      checkedAt,
      stars: 20_000,
      forks: 3_000,
      pushedAt: "2026-09-10T00:00:00.000Z",
      latestReleaseAt: null,
      recentPulls: [pull()],
      hasContributionGuide: true,
      hasSetupInstructions: false,
      hasTestInstructions: false,
      hasBeginnerIssues: false,
    });
    expect(passesRepositoryQualityGate(poorlyDocumented)).toBe(false);
  });

  it("rejects fully measured repositories with weak contributor experience", () => {
    const weak = scoreRepository({
      checkedAt,
      stars: 10,
      forks: 2,
      pushedAt: "2026-09-10T00:00:00.000Z",
      latestReleaseAt: null,
      recentPulls: [
        pull({ merged: false, responded: false, firstResponseHours: undefined }),
        pull({ createdAt: "2026-08-15T00:00:00.000Z", merged: false, responded: false, firstResponseHours: undefined }),
        pull({ newcomer: false, merged: false, responded: false, firstResponseHours: undefined }),
      ],
      hasContributionGuide: true,
      hasSetupInstructions: true,
      hasTestInstructions: true,
      hasBeginnerIssues: true,
    });
    expect(weak.coverage).toBe(100);
    expect(weak.score).not.toBeNull();
    expect(weak.score!).toBeLessThan(45);
    expect(passesRepositoryQualityGate(weak)).toBe(false);
  });

  it("caps fame and uses the documented 60/25/15 issue formula", () => {
    const issue = scoreIssue({ body: "Expected behavior and tests are clearly documented in CONTRIBUTING documentation.", title: "Improve the clear error message", labels: ["good first issue"], language: "TypeScript", onboardingPoints: 10, hasMaintainerDirection: true, blocked: false, repositoryScore: 80 });
    expect(issue.feedScore).toBe(Math.round(80 * 0.6 + issue.beginnerSuitability * 0.25 + issue.clarityReadiness * 0.15));
  });

  it("excludes bot acknowledgements from maintainer response evidence", () => {
    expect(isHumanMaintainerEvent({ event: "commented", author_association: "MEMBER", user: { login: "triage[bot]", type: "Bot" } })).toBe(false);
    expect(isHumanMaintainerEvent({ event: "reviewed", author_association: "COLLABORATOR", user: { login: "maintainer", type: "User" } })).toBe(true);
  });
});
