import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://main.d27aveplt50hl3.amplifyapp.com/sitemap.xml",
    host: "https://main.d27aveplt50hl3.amplifyapp.com",
  };
}
