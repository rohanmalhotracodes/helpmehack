import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpenSourceOpportunity, RepositoryQuality } from "@/lib/types";
import { OpenSourceDirectory } from "./open-source-directory";

vi.mock("@/lib/analytics", () => ({ trackFunnel: vi.fn() }));
import { trackFunnel } from "@/lib/analytics";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  cleanup();
  vi.unstubAllGlobals();
});

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
    repositoryLastCommitAt: "2026-09-23T10:03:00Z",
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

  it("labels sorting clearly and shows latest commit freshness on cards", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T10:15:00Z"));
    render(<OpenSourceDirectory records={[opportunity("react-issue", "react-tool", ["TypeScript", "React"])]} savedRepositoryIds={[]} savedIssueIds={[]} onSaveRepository={vi.fn()} onOpenRepository={vi.fn()} />);

    expect(screen.getByRole("combobox", { name: "Sort repositories" })).toHaveValue("recommended");
    expect(screen.getByRole("option", { name: "Recommended" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Latest commits" })).toBeInTheDocument();
    expect(screen.getAllByText("Last commit 12 min ago").length).toBeGreaterThan(0);
  });

  it("opens a repository from the full-card target without opening when saving", () => {
    const onOpenRepository = vi.fn();
    const onSaveRepository = vi.fn();
    const view = render(<OpenSourceDirectory records={[opportunity("react-issue", "react-tool", ["TypeScript", "React"])]} savedRepositoryIds={[]} savedIssueIds={[]} onSaveRepository={onSaveRepository} onOpenRepository={onOpenRepository} />);

    fireEvent.click(view.getAllByRole("button", { name: "View acme/react-tool contribution guide and open issues" })[0]);
    expect(onOpenRepository).toHaveBeenCalledWith("acme/react-tool");

    fireEvent.click(view.getAllByRole("button", { name: "Save acme/react-tool" })[0]);
    expect(onSaveRepository).toHaveBeenCalledWith("acme/react-tool");
    expect(onOpenRepository).toHaveBeenCalledTimes(1);
  });

  it("prefetches current issues and repository rules when a card receives intent", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ records: [], mode: "live", checkedAt: "2026-09-13T00:00:00Z" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<OpenSourceDirectory records={[opportunity("prefetch-issue", "prefetch-tool", ["TypeScript"])]} savedRepositoryIds={[]} savedIssueIds={[]} onSaveRepository={vi.fn()} onOpenRepository={vi.fn()} />);

    const openButton = view.getAllByRole("button", { name: "View acme/prefetch-tool contribution guide and open issues" })[0];
    fireEvent.mouseEnter(openButton.closest("article")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/repository-opportunities?owner=acme&repo=prefetch-tool"),
      { cache: "no-store" },
    ));
  });
});


describe("empty-result signals", () => {
  it("debounces typing, omits raw queries, and reports once per empty episode", () => {
    vi.useFakeTimers();
    render(<OpenSourceDirectory records={[opportunity("react", "react-tool", ["React"])]} savedRepositoryIds={[]} savedIssueIds={[]} onSaveRepository={vi.fn()} onOpenRepository={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Search open-source repositories" });
    fireEvent.change(input, { target: { value: "private-first" } });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.change(input, { target: { value: "private-second" } });
    act(() => vi.advanceTimersByTime(800));
    expect(trackFunnel).toHaveBeenCalledExactlyOnceWith("empty_results", { surface: "directory", has_query: true, has_filter: false });
    fireEvent.change(input, { target: { value: "private-third" } });
    act(() => vi.advanceTimersByTime(900));
    expect(trackFunnel).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "missing" } });
    act(() => vi.advanceTimersByTime(800));
    expect(trackFunnel).toHaveBeenCalledTimes(2);
  });
});
