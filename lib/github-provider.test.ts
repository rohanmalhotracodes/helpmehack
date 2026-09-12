import { afterEach, describe, expect, it, vi } from "vitest";
import { detectAssignmentPolicySignal, GitHubOpportunityProvider, isClaimedWorkLabel, isStaleWorkLabel, referencesIssueWithClosingKeyword } from "./github-provider";

const json = (value: unknown, init?: ResponseInit) => new Response(JSON.stringify(value), {
  status: 200,
  headers: { "Content-Type": "application/json", ...init?.headers },
  ...init,
});

describe("GitHubOpportunityProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("derives a possible claim from public GitHub issue comments", async () => {
    const recent = new Date().toISOString();
    const issue = {
      id: 42,
      html_url: "https://github.com/oppia/oppia/issues/7",
      repository_url: "https://api.github.com/repos/oppia/oppia",
      comments_url: "https://api.github.com/repos/oppia/oppia/issues/7/comments",
      number: 7,
      title: "Clarify widget errors",
      body: "Improve the error copy. To claim the issue, comment @widgetbot claim.",
      labels: [{ name: "good first issue", color: "00ff00" }],
      assignee: null,
      user: { login: "reporter", avatar_url: "https://avatars.githubusercontent.com/u/1" },
      comments: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: recent,
    };
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/search/issues")) return json({ items: [issue] }, { headers: { "x-ratelimit-remaining": "29", "x-ratelimit-limit": "30", "x-ratelimit-reset": "1800000000" } });
      if (url.endsWith("/repos/oppia/oppia")) return json({ full_name: "oppia/oppia", name: "oppia", description: "Free learning platform", html_url: "https://github.com/oppia/oppia", language: "TypeScript", owner: { login: "oppia", avatar_url: "https://avatars.githubusercontent.com/u/2" }, archived: false });
      if (url.includes("/comments?")) return json([{ html_url: "https://github.com/oppia/oppia/issues/7#issuecomment-1", body: "I would like to work on this", created_at: recent, user: { login: "contributor", avatar_url: "https://avatars.githubusercontent.com/u/3" }, author_association: "NONE" }]);
      if (url.includes("/timeline?")) return json([]);
      if (url.includes("/contents/CONTRIBUTING.md")) return json({ message: "Not found" }, { status: 404 });
      return json({ message: "Unexpected request" }, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const payload = await new GitHubOpportunityProvider().getAll(true);

    expect(payload.mode).toBe("live");
    expect(payload.records).toHaveLength(1);
    expect(payload.records[0]).toMatchObject({ status: "possibly-claimed", issueUrl: issue.html_url });
    expect(payload.records[0].category === "open-source" ? payload.records[0].repositoryGuidance?.assignment : "").toContain("@widgetbot claim");
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/community/profile"))).toBe(true);
  });

  it("does not treat a bare PR reference as proof of competing implementation work", () => {
    expect(referencesIssueWithClosingKeyword("Related to #7", "acme", "widgets", 7)).toBe(false);
    expect(referencesIssueWithClosingKeyword("Fixes #7", "acme", "widgets", 7)).toBe(true);
    expect(referencesIssueWithClosingKeyword("Closes acme/widgets#7", "acme", "widgets", 7)).toBe(true);
  });

  it("distinguishes documented assignment policies", () => {
    expect(detectAssignmentPolicySignal("Please request assignment before starting")).toBe("assignment-required");
    expect(detectAssignmentPolicySignal("Discuss your approach before implementation")).toBe("approval-required");
    expect(detectAssignmentPolicySignal("No need for assignment; feel free to submit a PR")).toBe("direct");
  });

  it("treats explicit work-state labels as claimed, without matching unrelated labels", () => {
    expect(isClaimedWorkLabel("in progress")).toBe(true);
    expect(isClaimedWorkLabel("claimed")).toBe(true);
    expect(isClaimedWorkLabel("progressive enhancement")).toBe(false);
    expect(isStaleWorkLabel("stale")).toBe(true);
    expect(isStaleWorkLabel("priority/awaiting-more-evidence")).toBe(true);
    expect(isStaleWorkLabel("fresh install")).toBe(false);
  });
});
