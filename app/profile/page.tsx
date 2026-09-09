import type { Metadata } from "next";
import { SiteChrome } from "@/app/_components/SiteChrome";
import { ProfileCard } from "@/app/_components/about/ProfileCard";
import { DEFAULT_MACHINE_SLUG } from "@/lib/machines";
import { ME } from "@/lib/me";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/profile",
  title: `${ME.name} · profile`,
  description: ME.note,
});

export default function ProfilePage() {
  return (
    <SiteChrome active="profile">
      <ProfileCard clawSlug={DEFAULT_MACHINE_SLUG} />
    </SiteChrome>
  );
}
