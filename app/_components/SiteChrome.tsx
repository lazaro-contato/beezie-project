import { Suspense } from "react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/app/_components/SiteHeader";
import type { NavActive } from "@/app/_components/Nav";
import { WalletBadgeSlot } from "@/features/checkout/components/WalletBadgeSlot";
import { WalletBadgeSkeleton } from "@/features/machine/components/skeletons";
import { WALLET_BADGE_HEIGHT, WALLET_BADGE_WIDTH } from "@/features/machine/constants";
import { DEFAULT_MACHINE_SLUG } from "@/lib/machines";

type SiteChromeProps = {
  active: NavActive;
  children: ReactNode;
};

export function SiteChrome({ active, children }: SiteChromeProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader
        active={active}
        clawSlug={DEFAULT_MACHINE_SLUG}
        wallet={
          <div style={{ minWidth: WALLET_BADGE_WIDTH, minHeight: WALLET_BADGE_HEIGHT }}>
            <Suspense fallback={<WalletBadgeSkeleton />}>
              <WalletBadgeSlot />
            </Suspense>
          </div>
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
