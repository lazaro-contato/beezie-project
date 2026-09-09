/** The canonical origin, used by `metadataBase`, the sitemap and robots.
 *
 * Set `NEXT_PUBLIC_SITE_URL` in the deploy. On Vercel the project URL is used
 * automatically, so a preview links to itself rather than to production; the
 * localhost fallback is what makes a fresh clone work with no `.env`. */
export const SITE_URL =
  // `||`, not `??`: a host panel stores an unset variable as an empty string,
  // which would otherwise become the origin.
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "Beezie";

export const SITE_DESCRIPTION =
  "Pull a claw machine, watch the reveal, and swap what you got for credit. Graded collectible cards on Beezie.";

/** The share card, served by `app/opengraph-image.png` through Next's file
 *  convention. Referenced explicitly as well, because a segment that declares
 *  its own `openGraph` replaces the parent's and would otherwise lose it. */
export const SITE_OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Beezie Claw: pull the claw, reveal the card.",
} as const;

/** Canonical, Open Graph and Twitter for one page, in one call.
 *
 * A segment that declares its own `openGraph` replaces the parent's outright,
 * so every page that wants its own `og:url` has to restate the image and the
 * site name too. This is that boilerplate, once. */
export function pageMetadata({
  path,
  title,
  description,
  index = true,
}: {
  path: string;
  title: string;
  description: string;
  index?: boolean;
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    // Spread, not `robots: undefined`: the key being present at all overrides
    // the root layout's value with nothing, and the page loses its robots tag.
    ...(index ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      locale: "en_US",
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [SITE_OG_IMAGE.url],
    },
  };
}
