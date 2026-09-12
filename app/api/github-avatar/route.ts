import { NextResponse } from "next/server";

const AVATAR_HOST = "avatars.githubusercontent.com";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get("url");
  const name = params.get("name") ?? "GH";

  if (source) {
    try {
      const url = new URL(source);
      if (url.protocol !== "https:" || url.hostname !== AVATAR_HOST) throw new Error("Unsupported avatar host");
      url.searchParams.set("s", "160");
      const response = await fetch(url, {
        headers: { Accept: "image/avif,image/webp,image/png,image/jpeg", "User-Agent": "helpmehack.com" },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(8_000),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && contentType.startsWith("image/")) {
        return new NextResponse(response.body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch {
      // The SVG below is a stable fallback when GitHub's avatar CDN is unavailable.
    }
  }

  const initials = name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "GH";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#16181c"/><text x="40" y="48" fill="#e7e9ea" font-family="ui-monospace,monospace" font-size="25" font-weight="700" text-anchor="middle">${initials}</text></svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
