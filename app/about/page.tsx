import type { Metadata } from "next";
import { SiteChrome } from "@/app/_components/SiteChrome";
import { AboutMe } from "@/app/_components/about/AboutMe";
import { ME } from "@/lib/me";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: `About ${ME.name}`,
  description: ME.role,
});

export default function AboutPage() {
  return (
    <SiteChrome active="about">
      <AboutMe />
    </SiteChrome>
  );
}
