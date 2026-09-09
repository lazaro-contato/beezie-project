import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import {
  HAND_ADVANCE_MS,
  HAND_DEGREES_PER_PIXEL,
  HAND_FLIP_ALL_MS,
  HAND_LAYOUT_MS,
  HAND_SETTLE_MS,
  HAND_SNAP_MS,
  HAND_TAP_THRESHOLD_PX,
} from "../constants";
import { FACE_DOWN_DEGREES } from "../utils/hand-layout";

type Drag = {
  id: string;
  index: number;
  pointerId: number;
  startX: number;
  startAngle: number;
  moved: number;
  el: HTMLElement;
};

type UseHandFlipArgs = {
  items: readonly { pullItemId: string; faceDown: boolean }[];
  flipped: ReadonlySet<string>;
  setFlipped: Dispatch<SetStateAction<ReadonlySet<string>>>;
  handIdx: number;
  setHandIdx: Dispatch<SetStateAction<number>>;
  dealt: boolean;
  setDealt: Dispatch<SetStateAction<boolean>>;
};

/**
 * Turning the cards over: the drag gesture, the snap, and the advance to the
 * next card once one lands face up.
 *
 * The angles live on the elements as CSS custom properties rather than in
 * state. A drag writes every frame, and routing that through React would
 * re-render the whole hand on each pointer move.
 */
export function useHandFlip({
  items,
  flipped,
  setFlipped,
  handIdx,
  setHandIdx,
  dealt,
  setDealt,
}: UseHandFlipArgs) {
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const initialisedRef = useRef(new WeakSet<HTMLElement>());
  const anglesRef = useRef<Record<string, number>>({});
  const dragRef = useRef<Drag | null>(null);
  const timersRef = useRef<number[]>([]);

  function schedule(callback: () => void, delayMs: number) {
    timersRef.current.push(window.setTimeout(callback, delayMs));
  }

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) {
        window.clearTimeout(id);
      }
      timers.length = 0;
    };
  }, []);

  // Face-down before the first paint. The server renders every card face up,
  // which is the correct bare-SSR state, so this write has to land in a layout
  // effect or the front of the card flashes for a frame. Guarded by a WeakSet
  // rather than a dependency array: it must run for any newly mounted card and
  // must never re-write an element a drag has since moved.
  useLayoutEffect(() => {
    for (const item of items) {
      const el = cardRefs.current.get(item.pullItemId);
      if (!el || initialisedRef.current.has(el)) {
        continue;
      }
      initialisedRef.current.add(el);
      const angle = anglesRef.current[item.pullItemId] ?? (item.faceDown ? FACE_DOWN_DEGREES : 0);
      anglesRef.current[item.pullItemId] = angle;
      el.style.setProperty("--card-flip-duration", "0ms");
      el.style.setProperty("--card-flip-turn", `${angle.toFixed(2)}deg`);
    }
  });

  const setCardRef = useCallback((id: string) => {
    return (el: HTMLElement | null) => {
      if (el) {
        cardRefs.current.set(id, el);
      } else {
        cardRefs.current.delete(id);
      }
    };
  }, []);

  function writeTurn(el: HTMLElement, id: string, degrees: number, durationMs: number) {
    anglesRef.current[id] = degrees;
    el.style.setProperty("--card-flip-duration", `${durationMs}ms`);
    el.style.setProperty("--card-flip-turn", `${degrees.toFixed(2)}deg`);
  }

  function markFlipped(id: string, index: number) {
    if (flipped.has(id)) {
      return;
    }
    const next = new Set(flipped);
    next.add(id);
    setFlipped(next);

    schedule(() => {
      const remaining = items.findIndex((item) => !next.has(item.pullItemId));
      if (remaining === -1) {
        setHandIdx(index);
        schedule(() => setDealt(true), HAND_SETTLE_MS);
      } else {
        setHandIdx(remaining);
      }
    }, HAND_ADVANCE_MS);
  }

  function handDown(event: ReactPointerEvent<HTMLElement>, id: string, index: number) {
    if (dealt || index !== handIdx || flipped.has(id) || dragRef.current) {
      return;
    }
    const el = cardRefs.current.get(id);
    if (!el) {
      return;
    }
    // Stops the browser starting a native image drag or a text selection,
    // either of which ends the gesture with a `pointercancel` mid-turn.
    event.preventDefault();
    el.style.setProperty("--card-flip-duration", "0ms");
    dragRef.current = {
      id,
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startAngle: anglesRef.current[id] ?? FACE_DOWN_DEGREES,
      moved: 0,
      el,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Safari throws if the pointer is already gone. The drag ends at the
      // next `pointerup`; nothing else depends on capture.
    }
  }

  function handMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    const dx = event.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    writeTurn(drag.el, drag.id, drag.startAngle + dx * HAND_DEGREES_PER_PIXEL, 0);
  }

  /** A tap under the travel threshold counts as a flip. */
  function handUp(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    dragRef.current = null;

    let snap: number;
    if (drag.moved < HAND_TAP_THRESHOLD_PX) {
      snap = 0;
    } else {
      const normalised = (((anglesRef.current[drag.id] ?? FACE_DOWN_DEGREES) % 360) + 360) % 360;
      snap = normalised > 90 && normalised < 270 ? FACE_DOWN_DEGREES : 0;
    }

    writeTurn(drag.el, drag.id, snap, HAND_SNAP_MS);
    if (snap === 0) {
      markFlipped(drag.id, drag.index);
    }
  }

  function keyFlip(id: string, index: number) {
    const el = cardRefs.current.get(id);
    if (el) {
      writeTurn(el, id, 0, HAND_SNAP_MS);
    }
    markFlipped(id, index);
  }

  function flipAll() {
    if (dealt) {
      return;
    }
    for (const item of items) {
      const el = cardRefs.current.get(item.pullItemId);
      if (el) {
        writeTurn(el, item.pullItemId, 0, HAND_LAYOUT_MS);
      }
    }
    setFlipped(new Set(items.map((item) => item.pullItemId)));
    schedule(() => setDealt(true), HAND_FLIP_ALL_MS);
  }

  return { setCardRef, handDown, handMove, handUp, keyFlip, flipAll };
}
