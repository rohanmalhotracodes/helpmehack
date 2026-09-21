import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.helpmehack.tech/sitemap.xml",
    host: "https://www.helpmehack.tech",
  };
}
