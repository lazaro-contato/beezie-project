import type { Metadata } from "next";
import { SiteChrome } from "@/app/_components/SiteChrome";
import { AboutMe } from "@/app/_components/about/AboutMe";
import { ME } from "@/lib/me";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/resources",
  title: "Resources",
  // Same body as /about on all four, so only one of the five is indexable.
  index: false,
  description: `Resources is out of scope for this build. About ${ME.name} instead.`,
});

export default function ResourcesPage() {
  return (
    <SiteChrome active="resources">
      <AboutMe section="Resources" />
    </SiteChrome>
  );
}
