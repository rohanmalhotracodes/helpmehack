import posthog from "posthog-js";

let initialized = false;
let referralDomain = "unknown";

// Public ingestion credentials for this project's Tin-hosted PostHog project.
export function initAnalytics() {
  if (typeof window === "undefined" || !["helpmehack.tech", "www.helpmehack.tech", "main.d27aveplt50hl3.amplifyapp.com"].includes(window.location.hostname)) return false;
  if (initialized) return true;
  try {
    referralDomain = window.sessionStorage.getItem("helpmehack:referral-domain")
      ?? (document.referrer ? new URL(document.referrer).hostname : "direct");
    window.sessionStorage.setItem("helpmehack:referral-domain", referralDomain);
  } catch {
    // Blocked storage or an invalid referrer must not interrupt browsing.
  }
  try {
    posthog.init("phc_wRfmTNxMrSjtAjzprffF63z6pgpTVyneKMTPAniXzkdS", {
      api_host: "https://us.i.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: false,
      autocapture: { dom_event_allowlist: ["click"] },
      mask_all_text: true,
      mask_all_element_attributes: true,
      rageclick: true,
      capture_dead_clicks: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        blockSelector: ".ph-no-capture, input[type=hidden], input[type=file]",
        maskTextSelector: "[data-private]",
        recordHeaders: false,
        recordBody: false,
        maskCapturedNetworkRequestFn: (request) => {
          // Replay metadata needs a page URL, but never its query or fragment.
          if (request.method) return null;
          try { const url = new URL(request.name); return { ...request, name: url.origin + url.pathname }; }
          catch { return null; }
        },
        maskAttributeFn: (name, value) => {
          if (name === "value") return "***";
          if (["href", "src", "action"].includes(name)) {
            try { const url = new URL(value, window.location.origin); return url.origin + url.pathname; }
            catch { return ""; }
          }
          return value;
        },
      },
      enable_recording_console_log: false,
      disable_surveys: true,
      disable_external_dependency_loading: false,
      advanced_disable_feature_flags: true,
      person_profiles: "never",
      persistence: "sessionStorage",
      respect_dnt: true,
      save_referrer: false,
      save_campaign_params: false,
      before_send: (event) => {
        if (!event) return null;
        // A tester opts in before navigation; unmarked traffic is not proof of real users.
        try {
          event.properties.is_test_traffic = window.sessionStorage.getItem("helpmehack:analytics-test") === "true";
        } catch {
          event.properties.is_test_traffic = false;
        }
        // Referring domains support search attribution without retaining search terms.
        delete event.properties.ph_keyword;
        event.properties.referral_domain = referralDomain;
        // Keep route context, never query strings or arbitrary URL fragments.
        for (const [key, value] of Object.entries(event.properties)) {
          if (typeof value === "string" && /^https?:\/\//.test(value)) {
            try {
              const url = new URL(value);
              event.properties[key] = url.origin + url.pathname;
            } catch {
              delete event.properties[key];
            }
          }
        }
        return event;
      },
    });
    initialized = true;
    return true;
  } catch {
    // Analytics must never prevent browsing or opening a contribution issue.
    return false;
  }
}

type FunnelEvent = "app_viewed" | "repository_opened" | "contribution_issue_clicked" | "repository_clicked" | "feed_to_repos_clicked" | "product_error" | "empty_results" | "feedback_submitted";
type FunnelProperties = { view?: "home" | "overlooked" | "open-source"; repository?: string; issue_number?: number; surface?: "directory" | "repository_panel"; has_query?: boolean; has_filter?: boolean; helpful?: boolean; comment?: string };

export function trackFunnel(event: FunnelEvent, properties: FunnelProperties) {
  try {
    if (!initAnalytics() || posthog.has_opted_out_capturing()) return false;
    return Boolean(posthog.capture(event, properties));
  } catch {
    // The product remains usable if analytics is blocked or unavailable.
    return false;
  }
}
