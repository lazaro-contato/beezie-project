import type { MetadataRoute } from "next";
import { MACHINE_SLUGS } from "@/lib/machines";
import { SITE_URL } from "@/lib/site";

/** The pages worth indexing. The four out-of-scope routes are left out on
 *  purpose: they render the same about page, and listing five URLs with one
 *  body is the duplicate content their `robots: { index: false }` already
 *  declares. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...MACHINE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/claw/${slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "monthly" as const, priority: 0.5 },
  ];
}
