import type { Metadata } from "next";
import { SiteChrome } from "@/app/_components/SiteChrome";
import { AboutMe } from "@/app/_components/about/AboutMe";
import { ME } from "@/lib/me";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/more",
  title: "More",
  // Same body as /about on all four, so only one of the five is indexable.
  index: false,
  description: `More is out of scope for this build. About ${ME.name} instead.`,
});

export default function MorePage() {
  return (
    <SiteChrome active="more">
      <AboutMe section="More" />
    </SiteChrome>
  );
}
