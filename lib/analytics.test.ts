import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import posthog from "posthog-js";

vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn() } }));

beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); });
afterEach(() => { vi.unstubAllGlobals(); });

function production() {
  vi.stubGlobal("window", { location: { hostname: "www.helpmehack.tech" } });
}

describe("product analytics", () => {
  it("does not send local or preview traffic into production analytics", async () => {
    const { trackFunnel } = await import("./analytics");
    trackFunnel("app_viewed", { view: "home" });
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("uses one anonymous client and strips private URL parameters", async () => {
    production();
    const { trackFunnel } = await import("./analytics");
    trackFunnel("app_viewed", { view: "open-source" });
    trackFunnel("repository_opened", { repository: "acme/project" });
    trackFunnel("contribution_issue_clicked", { repository: "acme/project", issue_number: 12 });
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledTimes(3);
    const config = vi.mocked(posthog.init).mock.calls[0][1]!;
    expect(config).toMatchObject({ autocapture: false, disable_session_recording: true, person_profiles: "never", respect_dnt: true });
    const sanitize = config.before_send as (event: unknown) => { properties: Record<string, string> };
    const result = sanitize({ properties: { $current_url: "https://www.helpmehack.tech/?email=private#token", $referrer: "https://example.com/?secret=yes" } });
    expect(result.properties).toEqual({ $current_url: "https://www.helpmehack.tech/", $referrer: "https://example.com/", is_test_traffic: false, referral_domain: "unknown" });
  });

  it("tracks the chosen Amplify host and labels test traffic without search terms", async () => {
    const storage = new Map<string, string>([["helpmehack:analytics-test", "true"]]);
    vi.stubGlobal("window", {
      location: { hostname: "main.d27aveplt50hl3.amplifyapp.com" },
      sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    });
    vi.stubGlobal("document", { referrer: "https://www.google.com/search?q=private" });
    const { initAnalytics, trackFunnel } = await import("./analytics");
    initAnalytics();
    trackFunnel("contribution_issue_clicked", { repository: "acme/project", issue_number: 12 });
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith("contribution_issue_clicked", { repository: "acme/project", issue_number: 12 });
    const config = vi.mocked(posthog.init).mock.calls[0][1]!;
    const sanitize = config.before_send as (event: unknown) => { properties: Record<string, unknown> };
    expect(sanitize({ properties: { ph_keyword: "private", $current_url: "https://main.d27aveplt50hl3.amplifyapp.com/?email=private#secret" } }).properties)
      .toEqual({ $current_url: "https://main.d27aveplt50hl3.amplifyapp.com/", is_test_traffic: true, referral_domain: "www.google.com" });
    expect(storage.get("helpmehack:referral-domain")).toBe("www.google.com");
  });

  it("does not break product actions if analytics throws", async () => {
    production();
    const { trackFunnel } = await import("./analytics");
    vi.mocked(posthog.init).mockImplementationOnce(() => { throw new Error("blocked"); });
    expect(() => trackFunnel("app_viewed", { view: "home" })).not.toThrow();
    vi.mocked(posthog.capture).mockImplementationOnce(() => { throw new Error("blocked"); });
    expect(() => trackFunnel("repository_opened", { repository: "acme/project" })).not.toThrow();
  });
});
