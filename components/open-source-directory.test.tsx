import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OpenSourceOpportunity, RepositoryQuality } from "@/lib/types";
import { OpenSourceDirectory } from "./open-source-directory";

const quality: RepositoryQuality = {
  score: 72,
  coverage: 100,
  label: "Strong repository evidence",
  windowDays: 90,
  checkedAt: "2026-09-13T00:00:00Z",
  stars: 2_000,
  factors: [
    { key: "newcomers", label: "Newcomers", weight: 30, earned: 20, evidence: "Newcomer merges" },
    { key: "responsiveness", label: "Responsiveness", weight: 25, earned: 18, evidence: "Maintainer replies" },
    { key: "reputation", label: "Reputation", weight: 20, earned: 12, evidence: "Public adoption" },
    { key: "maintenance", label: "Maintenance", weight: 15, earned: 12, evidence: "Recently pushed" },
    { key: "onboarding", label: "Onboarding", weight: 10, earned: 8, evidence: "Guide and tests" },
  ],
};

function opportunity(id: string, repo: string, technologies: string[]): OpenSourceOpportunity {
  return {
    id,
    category: "open-source",
    owner: "acme",
    repo,
    avatar: "AC",
    issueNumber: 1,
    title: "Improve a focused behavior",
    summary: "A clearly scoped contribution.",
    language: technologies[0],
    languageColor: "#3178c6",
    technologies,
    matchingIssueCount: 3,
    labels: ["good first issue"],
    experience: "Beginner",
    status: "unassigned",
    statusDetail: "No competing work found.",
    checkedAt: "2026-09-13T00:00:00Z",
    updatedAt: "2026-09-13T00:00:00Z",
    caution: "Recheck before starting.",
    assignment: "No rule confirmed.",
    visibleClaims: "None found.",
    linkedPrs: "None found.",
    blockers: "None found.",
    startSteps: [],
    setup: [],
    avoid: [],
    sources: [],
    repositoryQuality: quality,
    beginnerSuitability: 80,
    clarityReadiness: 75,
  };
}

describe("OpenSourceDirectory filters", () => {
  it("builds technology filters from current repository data and supports saved-only view", () => {
    const records = [
      opportunity("react-issue", "react-tool", ["TypeScript", "React"]),
      opportunity("django-issue", "django-tool", ["Python", "Django"]),
    ];
    render(<OpenSourceDirectory records={records} savedRepositoryIds={["acme/react-tool"]} savedIssueIds={[]} onSaveRepository={vi.fn()} onOpenRepository={vi.fn()} />);

    expect(screen.getByRole("button", { name: "React 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Django 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Saved 1" }));
    expect(screen.getByText("react-tool")).toBeInTheDocument();
    expect(screen.queryByText("django-tool")).not.toBeInTheDocument();
  });
});
