import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { demoOpportunities } from "@/lib/data";
import type { OpenSourceOpportunity } from "@/lib/types";
import { RepositoryPanel } from "./repository-panel";

vi.mock("@/lib/analytics", () => ({ trackFunnel: vi.fn() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
let sequence = 0;
const guidance = {
  assignment: "Ask the maintainer first.", assignmentEvidence: "not-found" as const,
  beforeStarting: ["Complete the documented development setup first."], avoid: ["Do not duplicate work."],
  source: { label: "Contribution guide", href: "https://github.com/test/repo/blob/main/CONTRIBUTING.md", kind: "guide" as const },
  checkedAt: "2026-09-21T00:00:00Z",
};
function mount(beforeStarting: string[] | undefined, response: "ready" | "empty" | "error" | "loading" = "ready") {
  const seed = demoOpportunities.find((item): item is OpenSourceOpportunity => item.category === "open-source")!;
  const item = { ...seed, repo: `preparation-${++sequence}`, repositoryGuidance: beforeStarting === undefined ? undefined : { ...guidance, beforeStarting } };
  vi.stubGlobal("fetch", vi.fn(() => response === "loading" ? new Promise(() => {}) : response === "error" ? Promise.reject(new Error("offline")) : Promise.resolve({ ok: true, json: async () => ({ records: response === "empty" ? [] : [item] }) })));
  render(<RepositoryPanel initialItems={[item]} savedIds={[]} repositorySaved={false} onSave={vi.fn()} onSaveRepository={vi.fn()} onClose={vi.fn()} />);
}
it("keeps preparation collapsed beside visible sources after loading", async () => {
  mount(guidance.beforeStarting);
  const summary = await screen.findByText("Before you start");
  expect(summary.closest("details")).not.toHaveAttribute("open");
  expect(screen.getByText(guidance.beforeStarting[0])).not.toBeVisible();
  expect(screen.getByRole("link", { name: "Contribution guide" })).toHaveAttribute("href", guidance.source.href);
  expect(screen.getByText(/checked Sep 21, 2026/)).toBeVisible();
});
it.each([undefined, [], [" "]])("uses honest fallback for absent preparation: %s", async (points) => {
  mount(points);
  await screen.findByText("Before you start");
  expect(screen.getByText(/No preparation guidance was confirmed/)).toBeInTheDocument();
  expect(screen.queryByText(guidance.beforeStarting[0])).not.toBeInTheDocument();
});
it.each(["loading", "error", "empty"] as const)("does not show preparation during %s details", async (state) => {
  mount(guidance.beforeStarting, state);
  if (state === "error") await screen.findByText("Showing the last available snapshot");
  if (state === "empty") await screen.findByText("No matching issues were found for this repository.");
  await waitFor(() => expect(screen.queryByText("Before you start")).not.toBeInTheDocument());
});
