import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { HAND_EASE, HAND_LAYOUT_MS } from "../../constants";
import { slotStyle, type HandLayout } from "../../utils/hand-layout";

export type HandItem = {
  pullItemId: string;
  name: string;
  swapValueCents: number;
  faceDown: boolean;
  card: ReactNode;
};

type SwapHandProps = {
  items: readonly HandItem[];
  layout: HandLayout;
  handIdx: number;
  dealt: boolean;
  flipped: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  submittedIds: ReadonlySet<string>;
  swapping: boolean;
  swapProgress: number;
  interactive: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  setCardRef: (id: string) => (el: HTMLElement | null) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, id: string, index: number) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onKeyFlip: (id: string, index: number) => void;
  onToggle: (id: string) => void;
};

/** The fan of cards: face down and draggable while dealing, a selectable grid
 *  once every card has been turned. */
export function SwapHand({
  items,
  layout,
  handIdx,
  dealt,
  flipped,
  selected,
  submittedIds,
  swapping,
  swapProgress,
  interactive,
  stageRef,
  setCardRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyFlip,
  onToggle,
}: SwapHandProps) {
  const n = items.length;

  return (
  <div
    ref={stageRef}
    className={cn("relative", !dealt && "overflow-hidden")}
    style={{
      height: layout.stageH,
      perspective: 1500,
      transition: `height ${HAND_LAYOUT_MS}ms ${HAND_EASE}`,
    }}
  >
    {items.map((item, index) => {
      const id = item.pullItemId;
      const isFlipped = flipped.has(id);
      const isActive = !dealt && index === handIdx && !isFlipped;
      const isSelected = selected.has(id);
      const isBusy = swapping && submittedIds.has(id);
      const slot = slotStyle(index, handIdx, dealt, layout);

      return (
        <div
          key={id}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: layout.cardW,
            zIndex: slot.zIndex,
            transform: slot.transform,
            transition: `transform ${HAND_LAYOUT_MS}ms ${HAND_EASE}`,
          }}
        >
          <button
            type="button"
            ref={setCardRef(id)}
            onPointerDown={(event) => onPointerDown(event, id, index)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => onToggle(id)}
            onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) => {
              if (isActive && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onKeyFlip(id, index);
              }
            }}
            // Once dealt this button is a mouse convenience only: the
            // checkbox over the card and the "Swap for ..." button under
            // it already expose the identical toggle to the keyboard and
            // to a screen reader, and three tab stops per card that all
            // do the same thing is noise, not access. While the hand is
            // still face down it is the *only* control there is, so it
            // stays fully accessible and carries the flip.
            aria-label={dealt ? undefined : `Turn over card ${index + 1} of ${n}`}
            aria-hidden={dealt ? true : undefined}
            tabIndex={dealt ? -1 : undefined}
            disabled={!dealt && !isActive}
            className={cn(
              "block w-full touch-none select-none rounded-lg outline-2 -outline-offset-2 outline-transparent transition-colors",
              dealt && isSelected && "outline-primary",
              isActive ? "cursor-grab active:cursor-grabbing" : dealt ? "cursor-pointer" : "cursor-default",
            )}
          >
            {item.card}
          </button>

          <button
            type="button"
            onClick={() => onToggle(id)}
            disabled={!interactive}
            aria-pressed={isSelected}
            aria-label={isSelected ? `Remove ${item.name} from the swap selection` : `Add ${item.name} to the swap selection`}
            className={cn(
              "absolute right-2.5 top-2.5 z-[5] flex h-7 w-7 items-center justify-center rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-colors disabled:pointer-events-none",
              isSelected
                ? "bg-primary text-primary-foreground ring-2 ring-inset ring-primary"
                : "bg-[rgba(19,19,19,0.72)] ring-2 ring-inset ring-[rgb(124,124,124)] hover:ring-primary",
            )}
            style={{ opacity: dealt ? 1 : 0, transition: "opacity 320ms ease-out" }}
          >
            {isSelected ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : null}
          </button>

          <div
            className="absolute left-0 right-0 top-full flex flex-col gap-2.5 px-0.5 pt-3"
            style={{ opacity: dealt ? 1 : 0, pointerEvents: dealt ? "auto" : "none", transition: "opacity 320ms ease-out" }}
            aria-hidden={!dealt}
          >
            <span className="line-clamp-2 h-9 text-[13px] font-semibold leading-[18px] text-white">{item.name}</span>
            {isBusy ? (
              <div className="relative flex h-9 items-center justify-center overflow-hidden rounded-md bg-primary/20">
                <div
                  className="absolute bottom-0 left-0 top-0 bg-primary/45"
                  style={{ width: `${Math.round(swapProgress * 100)}%` }}
                />
                <span className="relative flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Swap in progress
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onToggle(id)}
                disabled={!interactive}
                aria-pressed={isSelected}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md text-[13px] font-semibold ring-1 ring-inset ring-border-2 transition-colors disabled:pointer-events-none disabled:opacity-50",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
                )}
              >
                {isSelected
                  ? `Selected · ${formatCents(item.swapValueCents, { precision: "auto" })}`
                  : `Swap for ${formatCents(item.swapValueCents, { precision: "auto" })}`}
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
  );
}
