"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  beginNavProgress,
  readNavProgress,
  resetNavProgress,
  serverNavProgress,
  subscribeNavProgress,
} from "@/lib/nav-progress";
import styles from "./TopProgressBar.module.css";

/** Long enough that a slow route still finishes under it, short enough that a
 * click which turned out not to navigate does not leave a bar sitting there. */
const FAILSAFE_MS = 8000;

/** How often the committed URL is compared against the one a navigation
 * started from. Cheap, and only while something is in flight. */
const URL_POLL_MS = 80;

export function TopProgressBar() {
  // The phase is the store's, not this component's: the completion is a
  // timed transition that outlives the count reaching zero, and an island
  // may not set state from an effect to drive one.
  const phase = useSyncExternalStore(subscribeNavProgress, readNavProgress, serverNavProgress);
  const active = phase === "loading";
  const startedAtRef = useRef<string | null>(null);

  // Start on any click that is going to navigate this document. Capture
  // phase, so a handler that stops propagation cannot hide the click from
  // it, and every filter below is a case the browser will *not* route.
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
      if (anchor.hasAttribute("download") || anchor.getAttribute("href")?.startsWith("#")) {
        return;
      }
      if (anchor.href === window.location.href) {
        return;
      }
      beginNavProgress();
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Stop when the URL the navigation started from is no longer the one on
  // screen, or when the failsafe runs out.
  useEffect(() => {
    if (!active) {
      startedAtRef.current = null;
      return;
    }

    startedAtRef.current = window.location.href;
    const poll = window.setInterval(() => {
      if (window.location.href !== startedAtRef.current) {
        resetNavProgress();
      }
    }, URL_POLL_MS);
    const failsafe = window.setTimeout(resetNavProgress, FAILSAFE_MS);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(failsafe);
    };
  }, [active]);

  if (phase === "idle") {
    return null;
  }

  return (
    <div
      className={`${styles.bar} ${active ? styles.loading : styles.done}`}
      role="progressbar"
      aria-label="Loading"
      aria-busy={active}
      aria-hidden={!active}
    />
  );
}
