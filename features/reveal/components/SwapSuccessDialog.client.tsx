"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { SWAP_SUCCESS_OVERLAY_CLASS, SwapSuccessPanel } from "./SwapSuccessPanel";
import {
  clearSwapOutcome,
  readSwapOutcome,
  serverSwapOutcome,
  subscribeSwapOutcome,
} from "@/lib/swap-outcome";

export function SwapSuccessDialog() {
  const outcome = useSyncExternalStore(subscribeSwapOutcome, readSwapOutcome, serverSwapOutcome);

  if (!outcome) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-success-title"
      className={SWAP_SUCCESS_OVERLAY_CLASS}
    >
      <SwapSuccessPanel
        creditedCents={outcome.creditedCents}
        pointsAwarded={outcome.pointsAwarded}
        close={
          <button
            type="button"
            onClick={clearSwapOutcome}
            aria-label="Close"
            className="tap-target flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            autoFocus
          >
            <X size={16} aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}
