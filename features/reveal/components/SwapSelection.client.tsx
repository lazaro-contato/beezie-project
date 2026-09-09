"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { forgetQuantities } from "@/lib/quantity-memory";
import { beginNavProgress } from "@/lib/nav-progress";
import { publishSwapOutcome } from "@/lib/swap-outcome";
import { formatCents } from "@/lib/money";
import { swapPullItems } from "../actions";
import {
  REVEAL_PANEL_HEADER_HEIGHT,
  SWAP_PROGRESS_MS,
  SWAP_PROGRESS_TICK_MS,
} from "../constants";
import { handLayout } from "../utils/hand-layout";
import { useCountdown } from "../hooks/useCountdown";
import { useHandFlip } from "../hooks/useHandFlip";
import { useHandMeasurements } from "../hooks/useHandMeasurements";
import { SwapFooter } from "./swap/SwapFooter";
import { SwapHand, type HandItem } from "./swap/SwapHand";
import type { SwapErrorCode, SwapResult } from "../types";

export { SwapPendingButton } from "./swap/SwapPendingButton.client";

const ERROR_MESSAGES: Record<SwapErrorCode, string> = {
  INVALID_INPUT: "Something about that selection wasn't valid. Try again.",
  NOT_FOUND: "This pull couldn't be found.",
  QUOTE_EXPIRED: "This offer has expired.",
  STALE_SELECTION: "One of the selected cards already changed. Nothing was swapped — try selecting again.",
  INTERNAL: "Something went wrong. Try again.",
};

type SwapSelectionProps = {
  pullId: string;
  expiresInMs: number;
  items: HandItem[];
  /** Where the panel's close X goes. A `Route` rather than a rendered node so
   *  the back navigation stays client-side and `<Activity>` restores the
   *  machine page instead of refetching it. */
  closeHref: Route;
  /**
   * Server-rendered markup that belongs inside the panel's scroll region,
   * below the stage: already-resolved items on a revisit, and the fairness
   * block. A `ReactNode` for the same reason each card is, so `CardTile` and
   * `next/image` never enter this island's bundle.
   */
  children: ReactNode;
  clearPullQuantity: () => Promise<void>;
};

export function SwapSelection({ pullId, expiresInMs, items, closeHref, children, clearPullQuantity }: SwapSelectionProps) {
  const router = useRouter();

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const remainingMs = useCountdown(expiresInMs);

  // The hand is initialised from props once. Every later render reads this
  // state, so a `router.refresh()` that shrinks `items` after a swap cannot
  // re-deal a hand the viewer already turned.
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(
    () => new Set(items.filter((item) => !item.faceDown).map((item) => item.pullItemId)),
  );
  const [handIdx, setHandIdx] = useState(() => Math.max(0, items.findIndex((item) => item.faceDown)));
  const [dealt, setDealt] = useState(() => items.every((item) => !item.faceDown));
  const [finished, setFinished] = useState(false);

  const [stage, setStage] = useState<"reveal" | "swapping">("reveal");
  const [swapProgress, setSwapProgress] = useState(0);
  const [submittedIds, setSubmittedIds] = useState<ReadonlySet<string>>(new Set());

  const { stageRef, scrollRef, extrasRef, footerRef, stageW, viewportH, extrasH, footerH } =
    useHandMeasurements();

  const swapStartedAtRef = useRef(0);
  const outcomeRef = useRef<SwapResult | null>(null);

  const { setCardRef, handDown, handMove, handUp, keyFlip, flipAll } = useHandFlip({
    items,
    flipped,
    setFlipped,
    handIdx,
    setHandIdx,
    dealt,
    setDealt,
  });

  const n = items.length;
  const layout = handLayout(n, stageW, viewportH, dealt, extrasH, footerH);
  const flippedCount = items.filter((item) => flipped.has(item.pullItemId)).length;

  const endFlow = useCallback(() => {
    // Nothing is awaited before the panel goes: `router.replace` cannot commit
    // until the machine's payload arrives, and the confirmation must not wait
    // for it.
    setFinished(true);
    beginNavProgress();
    forgetQuantities();
    router.replace(closeHref, { scroll: false });
    // `replace` alone would serve the payload the router already holds,
    // rendered while the cookie still said what was just bought.
    router.refresh();
    void clearPullQuantity();
  }, [router, closeHref, clearPullQuantity]);

  useEffect(() => {
    if (stage !== "swapping") {
      return;
    }

    const interval = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - swapStartedAtRef.current) / SWAP_PROGRESS_MS);
      setSwapProgress(t);
      if (t < 1) {
        return;
      }
      const outcome = outcomeRef.current;
      if (!outcome) {
        return;
      }
      window.clearInterval(interval);
      if (outcome.ok) {
        publishSwapOutcome({
          creditedCents: outcome.creditedCents,
          pointsAwarded: outcome.pointsAwarded,
          count: outcome.count,
        });
        setStage("reveal");
        endFlow();
      } else {
        setErrorMessage(ERROR_MESSAGES[outcome.code]);
        setStage("reveal");
      }
      setSubmittedIds(new Set());
      setSelected(new Set());
    }, SWAP_PROGRESS_TICK_MS);

    return () => window.clearInterval(interval);
  }, [stage, endFlow]);

  const expired = remainingMs <= 0;
  const idle = stage === "reveal";
  const allSelected = items.length > 0 && selected.size === items.length;
  const selectedTotalCents = items
    .filter((item) => selected.has(item.pullItemId))
    .reduce((sum, item) => sum + item.swapValueCents, 0);

  function toggle(pullItemId: string) {
    if (!dealt || !idle || expired) {
      return;
    }
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(pullItemId)) {
        next.delete(pullItemId);
      } else {
        next.add(pullItemId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.pullItemId)));
  }

  function startSwap() {
    if (items.length > 1 && (!dealt || selected.size === 0)) {
      return;
    }
    const pullItemIds = Array.from(selected);
    if (pullItemIds.length === 0 || !idle || expired) {
      return;
    }

    setErrorMessage(null);
    setSubmittedIds(new Set(pullItemIds));
    setSwapProgress(0);
    swapStartedAtRef.current = Date.now();
    outcomeRef.current = null;
    setStage("swapping");

    startTransition(async () => {
      outcomeRef.current = await swapPullItems({ pullId, pullItemIds });
    });
  }

  const swapLabel =
    selected.size === 0
      ? "Swap now"
      : selected.size > 1
        ? `Swap now · ${selected.size} items · ${formatCents(selectedTotalCents, { precision: "auto" })}`
        : `Swap now · ${formatCents(selectedTotalCents, { precision: "auto" })}`;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-inset ring-border",
        finished && "hidden",
      )}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6"
        style={{ minHeight: REVEAL_PANEL_HEADER_HEIGHT }}
      >
        <h2 className="text-base font-semibold text-foreground">{dealt ? "Your pulls" : "Flip your cards"}</h2>
        <Link
          href={closeHref}
          aria-label="Close the reveal"
          className="tap-target flex h-6 w-6 items-center justify-center text-secondary-foreground transition-colors hover:text-white"
        >
          <X size={24} aria-hidden="true" />
        </Link>
      </div>

      {/* `scrollbar-gutter: stable`: the grid is sized to fit, so no scrollbar
          appears, but reserving the gutter unconditionally stops a borderline
          case oscillating, where removing the scrollbar widens the stage,
          which grows the cards, which brings the scrollbar back. */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="shrink-0 px-4 pb-7 pt-5 sm:px-8">
          <SwapHand
            items={items}
            layout={layout}
            handIdx={handIdx}
            dealt={dealt}
            flipped={flipped}
            selected={selected}
            submittedIds={submittedIds}
            swapping={stage === "swapping"}
            swapProgress={swapProgress}
            interactive={dealt && idle && !expired}
            stageRef={stageRef}
            setCardRef={setCardRef}
            onPointerDown={handDown}
            onPointerMove={handMove}
            onPointerUp={handUp}
            onKeyFlip={keyFlip}
            onToggle={toggle}
          />

          <div ref={extrasRef}>{children}</div>
        </div>

        <SwapFooter
          footerRef={footerRef}
          dealt={dealt}
          expired={expired}
          idle={idle}
          swapping={stage === "swapping"}
          swapProgress={swapProgress}
          remainingMs={remainingMs}
          errorMessage={errorMessage}
          itemCount={n}
          flippedCount={flippedCount}
          selectedCount={selected.size}
          swapLabel={swapLabel}
          onSelectAll={toggleSelectAll}
          onSwap={startSwap}
          onFlipAll={flipAll}
        />
      </div>
    </div>
  );
}
