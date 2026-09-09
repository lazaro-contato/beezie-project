"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./HoloCard.module.css";

/** The card's resting angle before it is flipped: back to the viewer. */
const FACE_DOWN_DEGREES = 180;
/** Degrees of rotation per pixel of horizontal drag (`* 0.55`, line 976). */
const DEGREES_PER_PIXEL = 0.55;
/** The snap back to 0deg or 180deg after the drag ends (line 988). */
const SNAP_MS = 460;
/** How long after the snap the card counts as flipped (line 991). */
const SETTLE_MS = 280;
/** Tilt while the pointer is moving, and settling back after it leaves. */
const TILT_MOVE_DURATION = "90ms";
const TILT_MOVE_EASE = "linear";
const TILT_REST_DURATION = "520ms";
const TILT_REST_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** rotateX, rotateY and the lift (line 1005). */
const TILT_X_RANGE = 16;
const TILT_Y_RANGE = 20;
const TILT_SCALE = 1.035;
/** The two layers' opacity while the pointer is over the card. */
const HOLO_OPACITY = "0.3";
const GLARE_OPACITY = "0.85";

type HoloCardProps = {
  className?: string;
  flip?: boolean;
  children: ReactNode;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function HoloCard({ flip = false, className, children }: HoloCardProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const tiltTarget = host.querySelector<HTMLElement>("[data-tilt]") ?? host;

    // Deliberately closure variables rather than state: none of them
    // changes what React renders, and every one of them is read inside a
    // `pointermove` handler.
    let flipped = !flip;
    let angle = flip ? FACE_DOWN_DEGREES : 0;
    let drag: { pointerId: number; startX: number; startAngle: number } | null = null;
    let tiltPointerId: number | null = null;
    let settleTimer = 0;

    function writeFlip(degrees: number, durationMs: number) {
      host!.style.setProperty("--card-flip-duration", `${durationMs}ms`);
      host!.style.setProperty("--card-flip-turn", `${degrees.toFixed(2)}deg`);
    }

    function writeTilt(px: number, py: number) {
      host!.style.setProperty("--tilt-duration", TILT_MOVE_DURATION);
      host!.style.setProperty("--tilt-ease", TILT_MOVE_EASE);
      host!.style.setProperty("--tilt-x", ((0.5 - py) * TILT_X_RANGE).toFixed(2));
      host!.style.setProperty("--tilt-y", ((px - 0.5) * TILT_Y_RANGE).toFixed(2));
      host!.style.setProperty("--tilt-scale", String(TILT_SCALE));
      host!.style.setProperty("--holo-mx", (px * 100).toFixed(1));
      host!.style.setProperty("--holo-my", (py * 100).toFixed(1));
      host!.style.setProperty("--holo-opacity", HOLO_OPACITY);
      host!.style.setProperty("--glare-opacity", GLARE_OPACITY);
    }

    function restTilt() {
      host!.style.setProperty("--tilt-duration", TILT_REST_DURATION);
      host!.style.setProperty("--tilt-ease", TILT_REST_EASE);
      host!.style.setProperty("--tilt-x", "0");
      host!.style.setProperty("--tilt-y", "0");
      host!.style.setProperty("--tilt-scale", "1");
      host!.style.setProperty("--holo-opacity", "0");
      host!.style.setProperty("--glare-opacity", "0");
    }

    if (flip) {
      // Pre-paint, and instant: `--card-flip-duration` is 0ms until the
      // first snap, so this turns the card over rather than animating it.
      writeFlip(FACE_DOWN_DEGREES, 0);
      host.dataset.flip = "1";
    }

    function onPointerDown(event: PointerEvent) {
      if (flipped && event.pointerType !== "mouse") {
        tiltPointerId = event.pointerId;
        try {
          host!.setPointerCapture(event.pointerId);
        } catch {
          // Same Safari case as the flip drag below; the tilt simply ends
          // at the next `pointerup`.
        }
        writeTiltAt(event);
        return;
      }

      if (flipped || drag) {
        return;
      }
      // Stops the browser from starting a native image drag or a text
      // selection, either of which ends the gesture with a
      // `pointercancel` mid-turn. `CardArt`'s `draggable={false}` covers
      // the same failure declaratively; this covers it for anything else
      // that ends up inside the card.
      event.preventDefault();
      drag = { pointerId: event.pointerId, startX: event.clientX, startAngle: angle };
      host!.style.setProperty("--card-flip-duration", "0ms");
      // Keeps the drag alive when the pointer leaves the card mid-turn —
      // without it a fast flick past the edge strands the card at whatever
      // angle it had reached, with no `pointerup` ever arriving.
      try {
        host!.setPointerCapture(event.pointerId);
      } catch {
        // Safari throws if the pointer is already gone. The drag simply
        // ends at the next `pointerup`; nothing else depends on capture.
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (tiltPointerId !== null) {
        if (event.pointerId === tiltPointerId) {
          writeTiltAt(event);
        }
        return;
      }

      if (drag) {
        if (event.pointerId !== drag.pointerId) {
          return;
        }
        angle = drag.startAngle + (event.clientX - drag.startX) * DEGREES_PER_PIXEL;
        writeFlip(angle, 0);
        return;
      }

      if (!flipped) {
        return;
      }

      if (event.pointerType !== "mouse") {
        return;
      }

      writeTiltAt(event);
    }

    function onPointerUp(event: PointerEvent) {
      if (tiltPointerId !== null && event.pointerId === tiltPointerId) {
        tiltPointerId = null;
        // Back to rest on release, the touch equivalent of the mouse
        // leaving the card.
        restTilt();
        return;
      }

      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      drag = null;

      const normalised = ((angle % 360) + 360) % 360;
      const snapped = normalised > 90 && normalised < 270 ? FACE_DOWN_DEGREES : 0;
      angle = snapped;
      writeFlip(snapped, SNAP_MS);

      if (snapped === 0 && !flipped) {
        // Not immediately: the card is still turning. Marking it flipped
        // early would let a tilt start mid-rotation and fight the snap.
        settleTimer = window.setTimeout(() => {
          flipped = true;
          host!.dataset.flipped = "1";
        }, SETTLE_MS);
      }
    }

    /** The tilt for wherever this pointer is, in the card's own box. */
    function writeTiltAt(event: PointerEvent) {
      const rect = tiltTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      writeTilt(
        clamp01((event.clientX - rect.left) / rect.width),
        clamp01((event.clientY - rect.top) / rect.height),
      );
    }

    function onPointerLeave() {
      // Not while a flip is in progress: `setPointerCapture` makes the
      // browser fire boundary events at the captured element, so a drag
      // that leaves the card would otherwise reset the tilt on every one
      // of them.
      if (drag || tiltPointerId !== null) {
        return;
      }
      restTilt();
    }

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerUp);
    host.addEventListener("pointerleave", onPointerLeave);

    // Gyroscope: best-effort and never gated behind
    // `DeviceOrientationEvent.requestPermission()`. On iOS 13+ reading
    // orientation at all needs that user-gesture-gated prompt, and a
    // permission dialog on a reveal screen, for a decorative tilt, is
    // hostile — so this subscribes where events arrive un-gated and is
    // simply absent where they do not. `beta`/`gamma` are null on a device
    // with no sensor and before the first real reading.
    let removeOrientationListener: (() => void) | undefined;
    if (typeof DeviceOrientationEvent !== "undefined") {
      const onOrientation = (event: DeviceOrientationEvent) => {
        if (!flipped || event.beta === null || event.gamma === null) {
          return;
        }
        writeTilt(clamp01((event.gamma + 45) / 90), clamp01((event.beta + 45) / 90));
      };
      window.addEventListener("deviceorientation", onOrientation);
      removeOrientationListener = () => window.removeEventListener("deviceorientation", onOrientation);
    }

    return () => {
      window.clearTimeout(settleTimer);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);
      host.removeEventListener("pointerleave", onPointerLeave);
      removeOrientationListener?.();
    };
  }, [flip]);

  return (
    <div ref={hostRef} className={cn(styles.host, className)}>
      {children}
    </div>
  );
}
