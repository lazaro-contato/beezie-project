import type { Metadata } from "next";
import { SiteChrome } from "@/app/_components/SiteChrome";
import { AboutMe } from "@/app/_components/about/AboutMe";
import { ME } from "@/lib/me";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/marketplace",
  title: "Marketplace",
  // Same body as /about on all four, so only one of the five is indexable.
  index: false,
  description: `Marketplace is out of scope for this build. About ${ME.name} instead.`,
});

export default function MarketplacePage() {
  return (
    <SiteChrome active="marketplace">
      <AboutMe section="Marketplace" />
    </SiteChrome>
  );
}
