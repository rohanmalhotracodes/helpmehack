import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgramOrganizationSummary } from "@/lib/program-directory";
import { ProgramsDirectory } from "./programs-directory";

const organization: ProgramOrganizationSummary = {
  id: "test", slug: "test-org", name: "Test organization", description: "Test projects",
  category: "Science", technologies: [], topics: [], latestRepositories: [],
  years: [{ year: 2026, projectCount: 1, programUrl: "https://example.org/2026" }],
};
const directory = () => <ProgramsDirectory gsoc={[organization]} summerOfBitcoin={[]} summerOfBitcoinYears={[]} />;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("GSoC detail discovery", () => {
  it("includes a crawlable organization URL in server HTML", () => {
    expect(renderToStaticMarkup(directory())).toContain('href="/programs/gsoc/test-org"');
  });
  it("keeps ordinary title clicks in the instant details panel", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(directory());
    expect(fireEvent.click(screen.getByRole("link", { name: "Test organization" }))).toBe(false);
    expect(screen.getByRole("button", { name: "Close organization details" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("preserves modified link clicks without opening the panel", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(directory());
    expect(fireEvent.click(screen.getByRole("link", { name: "Test organization" }), { ctrlKey: true })).toBe(true);
    expect(screen.queryByRole("button", { name: "Close organization details" })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
