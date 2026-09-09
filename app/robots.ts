import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A pull belongs to one viewer and is owner-scoped in SQL, so a crawler
      // gets nothing from it; the API routes are streams, not pages.
      disallow: ["/api/", "/claw/*/pull/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
