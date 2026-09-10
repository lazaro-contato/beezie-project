"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  beginMachineTransition,
  endMachineTransition,
  readMachineTransition,
  readMachineTransitionOrigin,
  serverMachineTransition,
  subscribeMachineTransition,
} from "@/lib/machine-transition";
import styles from "./MachineCrossfade.module.css";

/** A machine root, and nothing below it: `/claw/gold-claw` crossfades,
 *  `/claw/gold-claw/pull/x` must not — the reveal owns that navigation and
 *  plays over a video the crossfade would fight. */
const MACHINE_PATH = /^\/claw\/[^/]+$/;

/** How often the committed URL is compared against the one the transition
 *  started from. Cheap, and only while one is in flight. */
const URL_POLL_MS = 60;

/**
 * Crossfades the machine column when one machine replaces another.
 *
 * The phase is the store's, not this component's: the layout is re-rendered by
 * the navigation being animated, so state held here would be reset halfway
 * through, and an island may not set state from an effect.
 */
export function MachineCrossfade({ children }: { children: ReactNode }) {
  const phase = useSyncExternalStore(
    subscribeMachineTransition,
    readMachineTransition,
    serverMachineTransition,
  );
  // Capture phase, so a handler that stops propagation cannot hide the click;
  // every filter below is a case the browser will not route in-document.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") {
        return;
      }
      if (anchor.origin !== window.location.origin) {
        return;
      }
      if (!MACHINE_PATH.test(anchor.pathname)) {
        return;
      }
      if (anchor.pathname === window.location.pathname) {
        return;
      }
      beginMachineTransition(window.location.pathname);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // The new machine is on screen. `usePathname()` would report it, but under
  // Cache Components it is URL data and would force a Suspense boundary around
  // the whole column — the dynamic hole this transition exists to hide. The
  // committed URL answers the same question without one.
  useEffect(() => {
    if (phase !== "leaving") {
      return;
    }

    const startedAt = readMachineTransitionOrigin();
    if (startedAt === null) {
      return;
    }

    // Already arrived: this is the remounted instance, and it mounted with the
    // new machine on screen. Fading it back in is the whole of what is left.
    if (window.location.pathname !== startedAt) {
      endMachineTransition();
      return;
    }

    const poll = window.setInterval(() => {
      if (window.location.pathname !== startedAt) {
        endMachineTransition();
      }
    }, URL_POLL_MS);

    return () => window.clearInterval(poll);
  }, [phase]);

  // The wrapper has to be transparent to `<main>`'s column: it is a flex
  // parent whose child is expected to grow.
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", phase !== "idle" && styles[phase])}>
      {children}
    </div>
  );
}
