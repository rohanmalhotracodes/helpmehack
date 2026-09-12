import { describe, expect, it } from "vitest";
import { mapDevpost, mapHackerEarth, mapHackerRank, mapUnstop, mapUnstopFeatured, mapYandex, selectUnstopCollections } from "./event-provider";

const checkedAt = "2026-09-12T06:30:00.000Z";
const now = new Date("2026-09-12T06:30:00.000Z");

describe("event source mapping", () => {
  it("maps Devpost artwork and marks a near deadline as closing soon", () => {
    const event = mapDevpost({
      id: 42,
      title: "Public Build Sprint",
      url: "https://example.devpost.com/",
      open_state: "open",
      thumbnail_url: "//cdn.example.com/poster.jpg",
      time_left_to_submission: "8 days left",
      submission_period_dates: "Sep 01 - Sep 20, 2026",
      displayed_location: { location: "Online" },
      themes: [{ name: "Open Source" }],
    }, checkedAt);

    expect(event).toMatchObject({ platform: "Devpost", status: "closing-soon", posterUrl: "https://cdn.example.com/poster.jpg" });
  });

  it("drops finished Unstop listings and keeps exact public team rules", () => {
    expect(mapUnstop({ id: 1, title: "Old", seo_url: "https://unstop.com/hackathons/old", regn_open: 0 }, checkedAt, now)).toBeNull();
    const event = mapUnstop({
      id: 2,
      title: "Current",
      seo_url: "https://unstop.com/hackathons/current",
      regn_open: 1,
      region: "online",
      isPaid: false,
      regnRequirements: { start_regn_dt: "2026-09-01T00:00:00Z", end_regn_dt: "2026-10-01T00:00:00Z", min_team_size: 2, max_team_size: 4 },
    }, checkedAt, now);

    expect(event).toMatchObject({ platform: "Unstop", status: "open", team: "Teams of 2–4", cost: "Free" });
  });

  it("builds honest Unstop featured and top collections", () => {
    const base = {
      regn_open: 1,
      region: "online",
      isPaid: false,
      regnRequirements: { start_regn_dt: "2026-09-01T00:00:00Z", end_regn_dt: "2026-10-01T00:00:00Z" },
    };
    const records = selectUnstopCollections([
      { ...base, id: 1, title: "Small Hackathon", seo_url: "https://unstop.com/hackathons/small", registerCount: 20 },
      { ...base, id: 2, title: "Popular Hackathon", seo_url: "https://unstop.com/hackathons/popular", registerCount: 500 },
    ], [
      { ...base, id: 3, type: "competitions", title: "Data Engineering Challenge", seo_url: "https://unstop.com/competitions/data", registerCount: 80, fullbannerimages: { image_url: "https://cdn.example.com/data.jpg" } },
    ], checkedAt, now);

    expect(records.map((record) => [record.title, record.collection])).toEqual([
      ["Data Engineering Challenge", "Featured on Unstop"],
      ["Popular Hackathon", "Top hackathon"],
      ["Small Hackathon", "Top hackathon"],
    ]);
    expect(records[0].sourceNote).toContain("Unstop's public homepage Featured shelf");
    expect(records[0].posterUrl).toBe("https://cdn.example.com/data.jpg?d=451x676");
  });

  it("keeps developer custom features only when Unstop supplies real artwork", () => {
    expect(mapUnstopFeatured({ id: 7, featured_id: 70, type: "custom", featured_title: "Energy Tech Hackathon", url: "https://example.com/event", fullbannerimages: { image_url: "https://cdn.example.com/poster.png" } }, checkedAt, now)).toMatchObject({
      collection: "Featured on Unstop",
      posterUrl: "https://cdn.example.com/poster.png?d=451x676",
    });
    expect(mapUnstopFeatured({ id: 8, type: "custom", featured_title: "Unstop is hiring", url: "https://unstop.com/p/program-manager" }, checkedAt, now)).toBeNull();
  });

  it("filters expired HackerEarth listings", () => {
    const base = { title: "Challenge", slug: "challenge", type: "Hackathon", url: "/challenges/hackathon/challenge/", start: "2026-09-01T00:00:00Z" };
    expect(mapHackerEarth({ ...base, end: "2026-09-10T00:00:00Z" }, checkedAt, now)).toBeNull();
    expect(mapHackerEarth({ ...base, end: "2026-09-20T00:00:00Z", listing_image: "https://media.example.com/poster.jpg" }, checkedAt, now)).toMatchObject({ platform: "HackerEarth", status: "closing-soon" });
  });

  it("uses HackerRank's official fallback artwork without inventing contest copy", () => {
    const event = mapHackerRank({
      id: 9,
      name: "Weekly Algorithms",
      slug: "weekly-algorithms",
      ended: false,
      get_starttimeiso: "2026-09-13T00:00:00Z",
      get_endtimeiso: "2026-09-14T00:00:00Z",
      description: "Please provide a short description of your contest here!",
    }, checkedAt, now);

    expect(event).toMatchObject({ platform: "HackerRank", status: "upcoming", posterUrl: "https://hrcdn.net/og/default.jpg" });
    expect(event?.summary).not.toContain("Please provide");
  });

  it("only creates the announced 2026 Yandex Cup record", () => {
    expect(mapYandex("<html>Yandex Cup 2025</html>", checkedAt)).toBeNull();
    expect(mapYandex('<meta property="og:image" content="http://yandex.com/cup/poster.png"><main>Yandex Cup 2026</main>', checkedAt)).toMatchObject({
      platform: "Yandex",
      status: "upcoming",
      posterUrl: "https://yandex.com/cup/poster.png",
    });
    expect(mapYandex('{"announce":{"text":"YANDEX\\u0026nbsp;CUP\\u0026nbsp;2026"}}', checkedAt)).toMatchObject({ platform: "Yandex" });
  });
});
