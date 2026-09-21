import { afterEach, describe, expect, it, vi } from "vitest";
import { detectAssignmentPolicySignal, findLinkedContributionDocuments, GitHubOpportunityProvider, getRepositoryOpportunityData, getRepositoryIndexRecords, isClaimedWorkLabel, isStaleWorkLabel, referencesIssueWithClosingKeyword, summarizeRepositoryGuidance } from "./github-provider";

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
      body: "Improve the error copy.",
      labels: [{ name: "good first issue", color: "00ff00" }],
      assignee: null,
      user: { login: "reporter", avatar_url: "https://avatars.githubusercontent.com/u/1" },
      comments: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: recent,
    };
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/search/issues")) return json({ items: [issue, { ...issue, id: 43, number: 8, title: "Document another widget state" }] }, { headers: { "x-ratelimit-remaining": "29", "x-ratelimit-limit": "30", "x-ratelimit-reset": "1800000000" } });
      if (url.endsWith("/repos/oppia/oppia")) return json({ full_name: "oppia/oppia", name: "oppia", description: "Free learning platform", html_url: "https://github.com/oppia/oppia", language: "TypeScript", topics: ["react", "education"], owner: { login: "oppia", avatar_url: "https://avatars.githubusercontent.com/u/2" }, archived: false });
      if (url.includes("/comments?")) return json([{ html_url: "https://github.com/oppia/oppia/issues/7#issuecomment-1", body: "I would like to work on this", created_at: recent, user: { login: "contributor", avatar_url: "https://avatars.githubusercontent.com/u/3" }, author_association: "NONE" }]);
      if (url.includes("/timeline?")) return json([]);
      if (url.includes("/contents/CONTRIBUTING.md")) return json({
        html_url: "https://github.com/oppia/oppia/blob/develop/CONTRIBUTING.md",
        encoding: "base64",
        content: Buffer.from("See the [coding contribution guide](https://github.com/oppia/oppia/wiki/Contributing-code-to-Oppia).").toString("base64"),
      });
      if (url === "https://raw.githubusercontent.com/wiki/oppia/oppia/Contributing-code-to-Oppia.md") return new Response("To claim an issue, comment `@widgetbot claim` and wait for assignment.");
      return json({ message: "Unexpected request" }, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const payload = await new GitHubOpportunityProvider().getAll(true);

    expect(payload.mode).toBe("live");
    expect(payload.records).toHaveLength(1);
    expect(payload.records[0]).toMatchObject({ status: "possibly-claimed", issueUrl: issue.html_url, technologies: ["TypeScript", "React"], matchingIssueCount: 2 });
    expect(payload.records[0].category === "open-source" ? payload.records[0].repositoryGuidance?.assignment : "").toContain("@widgetbot claim");
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/community/profile"))).toBe(true);
  });

  it("does not treat a bare PR reference as proof of competing implementation work", () => {
    expect(referencesIssueWithClosingKeyword("Related to #7", "acme", "widgets", 7)).toBe(false);
    expect(referencesIssueWithClosingKeyword("Fixes #7", "acme", "widgets", 7)).toBe(true);
    expect(referencesIssueWithClosingKeyword("Closes acme/widgets#7", "acme", "widgets", 7)).toBe(true);
    expect(referencesIssueWithClosingKeyword("Fixes: https://github.com/acme/widgets/issues/7", "acme", "widgets", 7)).toBe(true);
    expect(referencesIssueWithClosingKeyword("Fixes: https://github.com/other/widgets/issues/7", "acme", "widgets", 7)).toBe(false);
  });

  it("distinguishes documented assignment policies", () => {
    expect(detectAssignmentPolicySignal("Please request assignment before starting")).toBe("assignment-required");
    expect(detectAssignmentPolicySignal("Ask for the issue to be assigned to you by leaving a comment.")).toBe("assignment-required");
    expect(detectAssignmentPolicySignal("Discuss your approach before implementation")).toBe("approval-required");
    expect(detectAssignmentPolicySignal("An issue with your proposal must be submitted first.")).toBe("approval-required");
    expect(detectAssignmentPolicySignal("No need for assignment; feel free to submit a PR")).toBe("direct");
    expect(detectAssignmentPolicySignal("Before starting the development server, install dependencies.")).toBeNull();
    expect(detectAssignmentPolicySignal("Pull requests are welcome.")).toBeNull();
  });

  it("keeps bot commands and repository claim limits from a contribution guide", () => {
    const guidance = summarizeRepositoryGuidance("zulip/zulip", "https://github.com/zulip/zulip", [{
      source: { label: "CONTRIBUTING.md", href: "https://github.com/zulip/zulip/blob/main/CONTRIBUTING.md", kind: "guide" },
      text: `### Claiming an issue
Find an issue tagged with the "help wanted" label that is unassigned.
To claim an issue, post a comment that says \`@zulipbot claim\` to the issue thread.
New contributors can only claim one issue until their first pull request is merged.`,
    }], "2026-09-13T00:00:00Z");

    expect(guidance.assignment).toContain("@zulipbot claim");
    expect(guidance.assignmentSteps).toContain("Post `@zulipbot claim` in the issue thread and wait for the assignment to appear.");
    expect(guidance.assignmentSteps).toContain("Claim only one issue until your first pull request is merged.");
    expect(guidance.assignmentEvidence).toBe("documented");
  });

  it("treats an extracted contribution prerequisite as documented evidence", () => {
    const guidance = summarizeRepositoryGuidance("acme/widgets", "https://github.com/acme/widgets", [{
      source: { label: "Contribution guide", href: "https://github.com/acme/widgets/blob/main/CONTRIBUTING.md", kind: "guide" },
      text: "In your issue comment, describe your approach and the files you expect to change.",
    }], "2026-09-13T00:00:00Z");

    expect(guidance.assignmentSteps).toContain("Describe your approach and the files you expect to change.");
    expect(guidance.assignmentEvidence).toBe("documented");
    expect(guidance.assignment).not.toContain("No assignment rule was confirmed");
  });

  it("follows a same-repository contribution wiki and extracts its prerequisites", () => {
    const source = { label: "Contribution guide", href: "https://github.com/oppia/oppia/blob/develop/.github/CONTRIBUTING.md", kind: "guide" as const };
    const [candidate] = findLinkedContributionDocuments("oppia/oppia", [{
      source,
      text: "See the [Coders](https://github.com/oppia/oppia/wiki/Contributing-code-to-Oppia) guide.",
    }]);
    expect(candidate).toMatchObject({
      href: "https://github.com/oppia/oppia/wiki/Contributing-code-to-Oppia",
      rawUrl: "https://raw.githubusercontent.com/wiki/oppia/oppia/Contributing-code-to-Oppia.md",
    });

    const guidance = summarizeRepositoryGuidance("oppia/oppia", "https://github.com/oppia/oppia", [{
      source: { label: "Contributing code to Oppia", href: candidate.href, kind: "guide" },
      text: `## Finding something to do
Please only work on issues that are labelled **"Impact: High"** or **"Impact: Medium"**, and that have no assignee.
Do not work on "Impact: Low" or "Backlog" issues.
Do not work on issues with the "triage needed" label.
Try to reproduce the issue and get a fix working on your local dev server.
Once you understand it, ask for it to be assigned to you by leaving a comment:
- Show a video of the fix working correctly on your local machine.
- If fixing a bug, explain the root cause.
- Explain which files you modified and describe the changes.
- @-mention the corresponding project leads and say when you can submit a PR.
If your proof looks good, we'll assign the issue to you. Once assigned, submit a PR.`,
    }], "2026-09-13T00:00:00Z");

    expect(guidance.assignmentEvidence).toBe("documented");
    expect(guidance.assignmentSteps).toEqual(expect.arrayContaining([
      "Include the requested video showing the fix working locally.",
      "For a bug, explain the root cause and point to the relevant code.",
      "Describe your approach and the files you expect to change.",
      "Mention the relevant project lead and state when you can submit the pull request.",
    ]));
    expect(guidance.avoid).toEqual(expect.arrayContaining([
      "Do not choose issues labeled “Impact: Low” or “Backlog”.",
      "Do not choose issues labeled “triage needed”.",
    ]));
    expect(guidance.source?.href).toBe(candidate.href);
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


describe("repository directory detail eligibility", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("keeps a maintained small indexed repository eligible when opening its details", async () => {
    const recent = new Date().toISOString();
    const base = "https://api.github.com/repos/journey-fixture/widgets";
    const issue = { id: 9876, number: 7, html_url: "https://github.com/journey-fixture/widgets/issues/7", repository_url: base, comments_url: `${base}/issues/7/comments`, title: "Improve error message", body: "Improve validation errors", labels: [{name: "good first issue"}], assignee: null, user: {login: "reporter"}, comments: 0, created_at: recent, updated_at: recent };
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/issues?")) return json([issue]);
      if (url === base) return json({ full_name: "journey-fixture/widgets", name: "widgets", description: "A useful widget engine", html_url: "https://github.com/journey-fixture/widgets", language: "TypeScript", topics: [], owner: {login: "journey-fixture", type: "Organization"}, archived: false, disabled: false, stargazers_count: 1300, forks_count: 100, created_at: "2020-01-01T00:00:00Z", pushed_at: recent });
      if (url.includes("/contents/CONTRIBUTING.md")) return json({ html_url: "https://github.com/journey-fixture/widgets/blob/main/CONTRIBUTING.md", encoding: "base64", content: Buffer.from("No need for assignment. Contributions welcome.").toString("base64") });
      if (url.includes("/timeline?") || url.includes("/pulls?")) return json([]);
      return json({}, {status: 404});
    }));
    expect(await getRepositoryIndexRecords("journey-fixture", "widgets")).toHaveLength(1);
    const details = await getRepositoryOpportunityData("journey-fixture", "widgets");
    expect(details.records).toHaveLength(1);
  });
});
