import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { formatCents } from "@/lib/money";

type SwapSuccessPanelProps = {
  creditedCents: number;
  pointsAwarded: number;
  /** The close control, which is the one thing the two callers disagree
   * about: the layout's island closes by clearing a store, the URL-driven
   * slot by following a `<Link>` back to the bare machine URL. */
  close: ReactNode;
};

export function SwapSuccessPanel({ creditedCents, pointsAwarded, close }: SwapSuccessPanelProps) {
  return (
    <div className="m-auto flex w-[420px] max-w-full flex-col gap-3 rounded-xl border border-border-2 bg-card px-6 pb-8 pt-5">
      <div className="flex justify-end">{close}</div>
      <div className="flex flex-col items-center gap-3.5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
          <Check size={30} strokeWidth={2.6} className="text-primary-foreground" aria-hidden="true" />
        </div>
        <h3 id="swap-success-title" className="text-xl font-semibold text-white">
          Swap success
        </h3>
        <p className="text-center text-sm font-medium text-muted-foreground">
          {formatCents(creditedCents, { precision: "auto" })} will be credited to your wallet shortly.
        </p>
        <p className="rounded-sm bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
          +{pointsAwarded} points
        </p>
      </div>
    </div>
  );
}

/** The shared shell too: both callers position the panel identically, and
 * the backdrop is part of what "the confirmation" means. */
export const SWAP_SUCCESS_OVERLAY_CLASS =
  "fixed inset-0 z-[70] flex items-start justify-center overflow-auto bg-background/75 p-6 backdrop-blur-md";
