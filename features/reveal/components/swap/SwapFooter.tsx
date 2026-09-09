import { ChevronsLeftRight, Info, Loader2 } from "lucide-react";
import { formatCountdown } from "@/lib/format";
import { REVEAL_STICKY_FOOTER_HEIGHT } from "../../constants";

type SwapFooterProps = {
  footerRef: React.RefObject<HTMLDivElement | null>;
  dealt: boolean;
  expired: boolean;
  idle: boolean;
  swapping: boolean;
  swapProgress: number;
  remainingMs: number;
  errorMessage: string | null;
  itemCount: number;
  flippedCount: number;
  selectedCount: number;
  swapLabel: string;
  onSelectAll: () => void;
  onSwap: () => void;
  onFlipAll: () => void;
};

/** The panel's sticky bottom bar: the countdown and swap controls once the
 *  hand is dealt, the progress line and "Flip all" before that. */
export function SwapFooter({
  footerRef,
  dealt,
  expired,
  idle,
  swapping,
  swapProgress,
  remainingMs,
  errorMessage,
  itemCount,
  flippedCount,
  selectedCount,
  swapLabel,
  onSelectAll,
  onSwap,
  onFlipAll,
}: SwapFooterProps) {
  return (
  <div
    ref={footerRef}
    className="sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-3 border-t border-border bg-card/90 px-4 py-4 backdrop-blur-[20px] sm:px-8 sm:py-5 sm:flex-row sm:items-center sm:justify-between"
    style={{ minHeight: REVEAL_STICKY_FOOTER_HEIGHT }}
  >
    {errorMessage ? (
      <p role="alert" className="text-sm text-destructive">
        {errorMessage}
      </p>
    ) : null}

    {dealt ? (
      <>
        <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
          {expired ? "This offer has expired." : `Expires in ${formatCountdown(remainingMs)}`}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={expired || !idle || itemCount === 0}
            className="text-sm font-medium text-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          >
            {selectedCount > 0 ? "Clear all" : "Select all"}
          </button>
          {swapping ? (
            <div className="relative flex h-11 w-[288px] max-w-[50vw] items-center justify-center overflow-hidden rounded-lg bg-primary/20">
              <div
                className="absolute bottom-0 left-0 top-0 bg-primary/45"
                style={{ width: `${Math.round(swapProgress * 100)}%` }}
              />
              <span className="relative flex items-center gap-2 text-sm font-semibold text-foreground">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Swap in progress
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSwap}
              disabled={expired || !idle || selectedCount === 0}
              className="inline-flex h-11 max-w-[50vw] items-center justify-center whitespace-nowrap rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {swapLabel}
            </button>
          )}
          <Info size={24} className="shrink-0 text-secondary-foreground" aria-hidden="true" />
        </div>
      </>
    ) : (
      <>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground" aria-live="polite">
            {flippedCount} of {itemCount} revealed
          </p>
          <p className="text-xs font-medium text-muted-foreground">Drag the top card sideways to flip it.</p>
        </div>
        <button
          type="button"
          onClick={onFlipAll}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ChevronsLeftRight size={16} aria-hidden="true" />
          Flip all
        </button>
      </>
    )}
  </div>
  );
}
