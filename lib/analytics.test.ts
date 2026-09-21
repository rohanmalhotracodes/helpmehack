import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import posthog from "posthog-js";

vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn(), has_opted_out_capturing: vi.fn() } }));

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
    expect(config).toMatchObject({
      autocapture: { dom_event_allowlist: ["click"] }, mask_all_text: true, mask_all_element_attributes: true,
      disable_session_recording: false, person_profiles: "never", respect_dnt: true,
      enable_recording_console_log: false,
      session_recording: { maskAllInputs: true, blockSelector: ".ph-no-capture, input[type=hidden], input[type=file]", recordHeaders: false, recordBody: false },
    });
    expect(config.session_recording?.maskCapturedNetworkRequestFn?.({ name: "https://example.com/?secret=yes", method: "POST" } as never)).toBeNull();
    const sanitize = config.before_send as (event: unknown) => { properties: Record<string, string> };
    const result = sanitize({ properties: { $current_url: "https://www.helpmehack.tech/?email=private#token", $referrer: "https://example.com/?secret=yes" } });
    expect(result.properties).toEqual({ $current_url: "https://www.helpmehack.tech/", $referrer: "https://example.com/", is_test_traffic: false, referral_domain: "direct", referrer_channel: "direct", referrer_attribution_version: 1 });
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
      .toEqual({ $current_url: "https://main.d27aveplt50hl3.amplifyapp.com/", is_test_traffic: true, referral_domain: "www.google.com", referrer_channel: "search", referrer_attribution_version: 1 });
    expect(storage.get("helpmehack:referral-domain")).toBe("www.google.com");
  });

  it("keeps the AI entry channel across routes and on both event types", async () => {
    const storage = new Map<string, string>([["helpmehack:referrer-channel:v1", "ai"], ["helpmehack:analytics-test", "true"]]);
    vi.stubGlobal("window", {
      location: { hostname: "main.d27aveplt50hl3.amplifyapp.com", search: "" },
      sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    });
    vi.stubGlobal("document", { referrer: "https://main.d27aveplt50hl3.amplifyapp.com/contribute" });
    const { initAnalytics } = await import("./analytics");
    initAnalytics();
    const sanitize = vi.mocked(posthog.init).mock.calls[0][1]!.before_send as (event: unknown) => { properties: Record<string, unknown> };
    for (const event of ["$pageview", "contribution_issue_clicked"]) {
      expect(sanitize({ event, properties: {} }).properties).toMatchObject({ referrer_channel: "ai", is_test_traffic: true });
    }
  });

  it("classifies AI referrals even when session storage is blocked", async () => {
    vi.stubGlobal("window", { location: { hostname: "main.d27aveplt50hl3.amplifyapp.com", search: "" },
      sessionStorage: { getItem: () => { throw new Error("blocked"); } } });
    vi.stubGlobal("document", { referrer: "https://claude.ai/private" });
    const { initAnalytics } = await import("./analytics");
    initAnalytics();
    const sanitize = vi.mocked(posthog.init).mock.calls[0][1]!.before_send as (event: unknown) => { properties: Record<string, unknown> };
    expect(sanitize({ properties: {} }).properties.referrer_channel).toBe("ai");
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
