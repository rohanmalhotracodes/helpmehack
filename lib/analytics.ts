import posthog from "posthog-js";

let initialized = false;

// Public ingestion credentials for this project's Tin-hosted PostHog project.
export function initAnalytics() {
  if (typeof window === "undefined" || !["helpmehack.tech", "www.helpmehack.tech"].includes(window.location.hostname)) return false;
  if (initialized) return true;
  try {
    posthog.init("phc_wRfmTNxMrSjtAjzprffF63z6pgpTVyneKMTPAniXzkdS", {
      api_host: "https://us.i.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_feature_flags: true,
      person_profiles: "never",
      persistence: "sessionStorage",
      respect_dnt: true,
      save_referrer: false,
      save_campaign_params: false,
      before_send: (event) => {
        if (!event) return null;
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

type FunnelEvent = "app_viewed" | "repository_opened" | "contribution_issue_clicked";
type FunnelProperties = { view?: "home" | "overlooked" | "open-source"; repository?: string; issue_number?: number };

export function trackFunnel(event: FunnelEvent, properties: FunnelProperties) {
  try {
    if (initAnalytics()) posthog.capture(event, properties);
  } catch {
    // The product remains usable if analytics is blocked or unavailable.
  }
}
