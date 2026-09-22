import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackFunnel } from "@/lib/analytics";
import { OpportunityApp } from "./opportunity-app";
import { demoOpportunities } from "@/lib/data";
import type { OpportunityPayload } from "@/lib/types";

vi.mock("@/lib/analytics", () => ({ trackFunnel: vi.fn() }));

vi.mock("./overlooked-feed", () => ({ OverlookedFeed: () => <main><h1>Overlooked feed</h1></main> }));
vi.mock("./open-source-directory", () => ({ OpenSourceDirectory: ({ onOpenRepository }: { onOpenRepository: (repository: string) => void }) => <main><h1>Repository directory</h1><button onClick={() => onOpenRepository("Northstar Labs/ember-auth")}>Open test repository</button></main> }));
const payload: OpportunityPayload = { records: [], checkedAt: "2026-09-20T00:00:00Z", mode: "demo", providerLabel: "Test" };

beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

describe("homepage navigation", () => {
  it("starts at the landing page and opens both destinations, with a return home", () => {
    render(<OpportunityApp initialPayload={payload} />);
    const landing = screen.getByRole("region", { name: /Open source worth starting/i });
    fireEvent.click(within(landing).getByRole("link", { name: "Feed" }));
    expect(screen.getByRole("heading", { name: "Overlooked feed" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#feed");
    fireEvent.click(screen.getByRole("button", { name: "helpmehack home" }));
    expect(window.location.hash).toBe("");
    fireEvent.click(within(screen.getByRole("region", { name: /Open source worth starting/i })).getByRole("link", { name: "Repos" }));
    expect(screen.getByRole("heading", { name: "Repository directory" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#open-source");
    expect(vi.mocked(trackFunnel).mock.calls).toEqual([
      ["app_viewed", { view: "home" }],
      ["app_viewed", { view: "overlooked" }],
      ["app_viewed", { view: "home" }],
      ["app_viewed", { view: "open-source" }],
    ]);
  });

  it("keeps existing repository links and browser history navigation working", async () => {
    window.history.replaceState(null, "", "/#open-source");
    render(<OpportunityApp initialPayload={payload} />);
    expect(screen.getByRole("heading", { name: "Repository directory" })).toBeInTheDocument();
    expect(trackFunnel).toHaveBeenCalledExactlyOnceWith("app_viewed", { view: "open-source" });
    window.history.replaceState(null, "", "/#feed");
    fireEvent(window, new PopStateEvent("popstate"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Overlooked feed" })).toBeInTheDocument());
    window.history.replaceState(null, "", "/");
    fireEvent(window, new HashChangeEvent("hashchange"));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Open source worth starting/i })).toBeInTheDocument());
  });
});


describe("repository details during navigation", () => {
  it.each(["popstate", "hashchange"])("closes details and releases scrolling on %s", async (eventName) => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    window.history.replaceState(null, "", "/#open-source");
    render(<OpportunityApp initialPayload={{ ...payload, records: demoOpportunities }} />);
    fireEvent.click(screen.getByRole("button", { name: "Open test repository" }));
    expect(screen.getByRole("dialog", { name: "ember-auth" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    window.history.replaceState(null, "", "/#feed");
    fireEvent(window, new Event(eventName));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Overlooked feed" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");

    window.history.replaceState(null, "", "/#open-source");
    fireEvent(window, new Event(eventName));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open test repository" }));
    expect(screen.getByRole("dialog", { name: "ember-auth" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close repository" })[1]);
    expect(document.body.style.overflow).toBe("");
  });
});
