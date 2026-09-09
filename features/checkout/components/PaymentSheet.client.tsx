"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {X} from "lucide-react";
import { cn } from "@/lib/cn";
import { beginNavProgress } from "@/lib/nav-progress";
import {
  PULL_STAGE_DURATION_MS,
  PULL_STAGE_TICK_MS,
  progressWidth,
  pullStageCardIndex,
  pullStageProgress,
} from "@/lib/progress";
import { createPull } from "../actions";
import { armRevealVideo, cancelRevealVideo, playRevealVideoSync } from "@/lib/video-gesture";
import type { CreatePullErrorCode, PaymentMethod } from "../types";
import { PullStage } from "./sheet/PullStage";

const ERROR_MESSAGES: Record<CreatePullErrorCode, string> = {
  INVALID_INPUT: "Something about that request wasn't valid. Try again.",
  MACHINE_UNAVAILABLE: "This machine is temporarily unavailable.",
  INSUFFICIENT_FUNDS: "That wallet doesn't have enough balance for this total.",
  PRICE_CHANGED: "The price changed. Review the total and confirm again.",
  CONFLICT: "Another pull was already in progress. Try again.",
  INTERNAL: "Something went wrong. Try again.",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** How far the sheet has to be dragged down, in pixels, before release
 * counts as "dismiss" rather than "snap back." */
const DRAG_CLOSE_THRESHOLD_PX = 96;

type PaymentSheetProps = {
  defaultOpen: boolean;
  slug: string;
  /** Needed to build `createPull`'s payload, not to display anything — the
   * quantity the user sees is `children`'s own `PaymentSummary`. */
  quantity: number;
  /** The default-checked radio, decided server-side in `@sheet/page.tsx`
   * from the viewer's real balances. Also this handler's fallback if, for
   * any reason, no radio can be read off the form at confirm time. */
  paymentMethod: PaymentMethod;
  expectedTotalCents: number;
  confirmDisabled: boolean;
  disabledReason?: string;
  /**
   * The pull stage's frames — normally four, each one a `PullPreviewCard`
   * this machine's own top items already rendered on the server
   * (`app/claw/[slug]/@sheet/page.tsx`). Crossing as `ReactNode`s rather
   * than as `CardDTO`s is what keeps `CardArt`, `next/image` and every price
   * string out of this island's bundle — the identical contract
   * `SwapSelection.client`'s `card` prop has, for the identical reason.
   *
   * The array can be shorter (a machine with fewer than four items) or empty
   * (an unknown slug, where the sheet renders closed and disabled);
   * `pullStageCardIndex` takes the real length and the stage renders without
   * frames in the empty case rather than special-casing it.
   */
  pullPreview: ReactNode[];
  children: ReactNode;
};

export function PaymentSheet({
  defaultOpen,
  slug,
  quantity,
  paymentMethod,
  expectedTotalCents,
  confirmDisabled,
  disabledReason,
  pullPreview,
  children,
}: PaymentSheetProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Previous-prop-in-state sync — React's own documented pattern for
  // adjusting state during render when a prop changes — not `useEffect`.
  // An effect would run one frame after paint; this lands in the same
  // render as the prop change, which matters for a Back navigation that
  // must close the sheet immediately rather than flash it open first.
  const [prevDefaultOpen, setPrevDefaultOpen] = useState(defaultOpen);
  if (defaultOpen !== prevDefaultOpen) {
    setPrevDefaultOpen(defaultOpen);
    setOpen(defaultOpen);
  }

  const [isPending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<CreatePullErrorCode | null>(null);

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const clientSeedRef = useRef<string | null>(null);
  const dragStartYRef = useRef(0);

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  // The `pull` stage. `isPending` from the transition above *is* the stage
  // flag — the plan's own instruction was to give this stage to the sheet's
  // existing pending state rather than to a ninth island — so there is no
  // second "stage" variable that could disagree with it. These two only
  // describe what the panel draws while that flag is up.
  const [pullProgress, setPullProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const pullStartedAtRef = useRef(0);

  // `useCallback`, so the focus-trap effect below can depend on it rather
  // than omit it: `close` now closes over `router` and `slug`.
  const close = useCallback(() => {
    setOpen(false);
    setErrorCode(null);

    beginNavProgress();
    router.replace(`/claw/${slug}` as Route, { scroll: false });
  }, [router, slug]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function focusables(): HTMLElement[] {
      return panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
    }
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  // The pull stage's one timer. Both the bar and which of the four cards is
  // showing are pure functions of elapsed wall time (`lib/progress.ts`), so
  // there is a single 80ms tick rather than a clock per thing being
  // animated — and no second interval that could drift out of phase with
  // the first. Neither value decides anything: the stage ends when the
  // transition does, and `handleConfirm` below is what holds the push until
  // the eight seconds are up.
  useEffect(() => {
    if (!isPending) {
      return;
    }

    const frames = pullPreview.length;
    const tick = window.setInterval(() => {
      const now = Date.now();
      // Both read the *same* frame count, and that is load-bearing rather
      // than tidy: `lib/progress.ts` derives the bar's knees from the very
      // schedule that advances the carousel, so the bar rushes exactly as
      // the cards start flicking past. Handing the two functions different
      // counts would put the bar's knees off the card boundaries and the
      // two motions would visibly disagree.
      setPullProgress(pullStageProgress(pullStartedAtRef.current, now, frames));
      setPreviewIndex(pullStageCardIndex(pullStartedAtRef.current, now, frames));
    }, PULL_STAGE_TICK_MS);

    return () => window.clearInterval(tick);
  }, [isPending, pullPreview.length]);


  function onDragPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragStartYRef.current = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDragPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) {
      return;
    }
    setDragY(Math.max(0, event.clientY - dragStartYRef.current));
  }

  function onDragPointerUp() {
    setDragging(false);
    if (dragY > DRAG_CLOSE_THRESHOLD_PX) {
      close();
    }
    setDragY(0);
  }

  function readSelectedPaymentMethod(): PaymentMethod {
    const value = formRef.current ? new FormData(formRef.current).get("paymentMethod") : null;
    return value === "beezie_wallet" || value === "external_wallet" ? value : paymentMethod;
  }

  function getClientSeed(): string {
    if (!clientSeedRef.current) {
      clientSeedRef.current = crypto.randomUUID();
    }
    return clientSeedRef.current;
  }

  function handleConfirm() {
    playRevealVideoSync();

    const selectedMethod = readSelectedPaymentMethod();
    const clientSeed = getClientSeed();
    setErrorCode(null);

    // The pull stage's clock starts here, in the handler, alongside the
    // gesture — never during render, and never from inside an effect that
    // would already be a frame late.
    const startedAt = Date.now();
    pullStartedAtRef.current = startedAt;
    setPullProgress(0);
    setPreviewIndex(0);

    startTransition(async () => {
      const result = await createPull({
        slug,
        quantity,
        paymentMethod: selectedMethod,
        clientSeed,
        expectedTotalCents,
      });

      if (result.ok) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < PULL_STAGE_DURATION_MS) {
          await new Promise((resolve) => window.setTimeout(resolve, PULL_STAGE_DURATION_MS - elapsed));
        }

        armRevealVideo();
        router.push(`/claw/${slug}/pull/${result.pullId}`);
      } else {
        cancelRevealVideo();
        setErrorCode(result.code);
      }
    });
  }

  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : disabledReason;

  return (
    <div aria-hidden={!open}>
      <div
        className={cn(
          "fixed inset-0 z-50 cursor-pointer bg-black/60 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-sheet-title"
        inert={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col gap-6 overflow-y-auto rounded-t-2xl border border-border bg-background p-6 transition-transform",
          "nav:inset-0 nav:m-auto nav:h-fit nav:max-w-3xl nav:rounded-2xl nav:transition-opacity",
          open
            ? "translate-y-0 nav:opacity-100"
            : "pointer-events-none translate-y-full nav:translate-y-0 nav:opacity-0",
        )}
        style={dragging ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
      >
        <div
          className="-mt-2 flex h-6 shrink-0 cursor-grab touch-none items-center justify-center nav:hidden"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          aria-hidden="true"
        >
          <div className="h-1.5 w-10 rounded-full bg-fill-subtle" />
        </div>

        <div className="flex items-center justify-between">
          <h2 id="payment-sheet-title" className="text-lg font-bold text-foreground">
            Review &amp; pay
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close payment sheet"
            className="tap-target flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-fill-subtle hover:text-foreground"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Wraps `{children}` only as a container for `PayMethodList`'s
            native radios, so `handleConfirm` can read whichever one is
            checked via `FormData` — it renders no price, name, image or
            balance of its own. */}
        <form ref={formRef} onSubmit={(event) => event.preventDefault()}>
          {children}
        </form>

        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmDisabled || isPending}
          className="inline-flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Confirming…" : "Confirm"}
        </button>
      </div>

      {isPending ? (
        <PullStage
          pullPreview={pullPreview}
          previewIndex={previewIndex}
          pullProgress={pullProgress}
          progressWidth={progressWidth}
        />
      ) : null}
    </div>
  );
}
