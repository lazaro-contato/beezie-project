import type { Route } from "next";
import Link from "next/link";
import { ArrowRightLeft, MoveRight, X } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { SWAP_DIALOG_Z } from "../constants";
import { SWAP_EXAMPLE_ITEM_VALUE_CENTS, swapQuoteCents } from "../swap-rate";

type SwapRateDialogProps = {
  closeHref: Route;
};

/**
 * Every figure here derives from `SWAP_RATE_BPS`, so the title, the body and
 * the worked example can never disagree with what a swap actually credits.
 *
 * The backdrop stays light (45% black, 2px blur) so the odds and the price
 * the dialog is explaining are still visible behind it, and both it and the
 * panel animate in through `@keyframes` in `app/globals.css`.
 *
 * Zero interactive state and no island: the backdrop and the X are both
 * `<Link>`s that drop `?swap=1`, and the whole dialog is server-rendered by
 * the `@swap` slot. Escape-to-close and a focus trap would each need a
 * client component; close is reachable through the X, the backdrop and the
 * browser's Back button instead.
 */
export function SwapRateDialog({ closeHref }: SwapRateDialogProps) {
  const youGetCents = swapQuoteCents(SWAP_EXAMPLE_ITEM_VALUE_CENTS);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-auto p-4 sm:p-6"
      style={{ zIndex: SWAP_DIALOG_Z }}
      data-scroll-lock
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-rate-title"
    >
      <Link
        href={closeHref}
        scroll={false}
        aria-label="Close"
        // Light enough to keep the machine and the panel behind it readable:
        // this dialog explains a rate you are reading off that page, so
        // hiding the page defeats it.
        className="fixed inset-0 animate-[overlay-in_180ms_ease-out] bg-black/45 backdrop-blur-[2px]"
      />

      <div className="relative m-auto flex w-[440px] max-w-full animate-[dialog-in_240ms_cubic-bezier(0.22,1,0.36,1)] flex-col gap-5 rounded-xl border border-border-2 bg-card p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ArrowRightLeft size={20} aria-hidden="true" />
          </span>
          <h2 id="swap-rate-title" className="flex-1 pt-2 text-lg font-semibold text-foreground">
            SWAP Rate
          </h2>
          <Link
            href={closeHref}
            scroll={false}
            aria-label="Close"
            className="tap-target flex size-8 items-center justify-center rounded-md text-secondary-foreground transition-colors hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </Link>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          Not feeling your pull? SWAP it instantly for USDC based on the displayed SWAP rate. Your balance is
          credited the moment you confirm.
        </p>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-secondary-foreground">Example</span>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-fill-subtle px-4 py-3">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Item value</span>
              <Money cents={SWAP_EXAMPLE_ITEM_VALUE_CENTS} className="text-xl font-semibold text-foreground" />
            </div>
            <MoveRight size={36} strokeWidth={1.5} className="shrink-0 text-secondary-foreground" aria-hidden="true" />
            <div className="flex flex-1 flex-col items-end gap-1">
              <span className="text-xs font-medium text-muted-foreground">You get</span>
              <Money cents={youGetCents} className="text-xl font-semibold text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
