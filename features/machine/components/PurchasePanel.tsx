import { Suspense, type ReactNode } from "react";
import { Separator } from "@/components/ui/Separator";
import { MobileActionBar } from "@/components/ui/MobileActionBar";
import { MachineSummary } from "./MachineSummary";
import { ActionRow } from "./ActionRow";
import { OddsPanel } from "./OddsPanel";
import { MoreMachines } from "./MoreMachines";
import { ActionRowSkeleton, OddsPanelSkeleton } from "./skeletons";
import { ARTWORK_PANEL_HEIGHT } from "../constants";
import type { MachineDTO } from "../types";

type PurchasePanelProps = {
  machine: MachineDTO;
  openCheckout: (formData: FormData) => Promise<void>;
  /** `SwapRateBadge`, already wrapped in its own Suspense boundary. */
  swapBadge: ReactNode;
  /** `PromoCodeForm`. Passed as a slot because it lives in
   * `features/checkout`, which `features/machine` may not import. */
  promo: ReactNode;
};

const PANEL_BACKGROUND =
  "linear-gradient(134.643deg, rgb(35,35,35) 1.04%, rgb(27,27,27) 50.26%, rgb(26,26,26) 99.49%)";
const PANEL_SHADOW =
  "0 0 0 1px rgb(47,47,47), 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)";

export function PurchasePanel({ machine, openCheckout, swapBadge, promo }: PurchasePanelProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[20px] p-5"
      style={{
        minHeight: ARTWORK_PANEL_HEIGHT,
        background: PANEL_BACKGROUND,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <MachineSummary machine={machine} swapBadge={swapBadge} className="order-1" />

      <MobileActionBar className="order-7 nav:order-2">
        <Suspense fallback={<ActionRowSkeleton />}>
          <ActionRow
            slug={machine.slug}
            unitPriceCents={machine.unitPriceCents}
            openCheckout={openCheckout}
          />
        </Suspense>
      </MobileActionBar>

      {promo}

      <Separator className="order-3 nav:order-4" />

      <Suspense fallback={<OddsPanelSkeleton />}>
        <OddsPanel slug={machine.slug} className="order-4 nav:order-5" />
      </Suspense>

      <Separator className="order-5 nav:order-6" />

      <MoreMachines currentSlug={machine.slug} className="order-6 nav:order-7" />
    </div>
  );
}
