"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  isRevealVideoArmed,
  restartRevealVideo,
  REVEAL_VIDEO_ELEMENT_ID,
  REVEAL_VIDEO_PRIMING_ATTRIBUTE,
} from "@/lib/video-gesture";
import { REVEAL_CROSSFADE_MS, REVEAL_OVERLAY_Z, REVEAL_SAFETY_HOLD_MS } from "../constants";
import type { RevealSourceDTO } from "../types";

type RevealOrchestratorProps = {
  slug: string;
  source: RevealSourceDTO;
  unmute: boolean;
};

export function RevealOrchestrator({ slug, source, unmute }: RevealOrchestratorProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playStartedAt, setPlayStartedAt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const machinePathname = `/claw/${slug}`;
  const revealPathnamePrefix = `/claw/${slug}/pull/`;
  const revealed = pathname.startsWith(revealPathnamePrefix);
  // Derived, not state: `fading` is fully determined by `visible`,
  // `revealed` and `ended` on every render, so computing it here — instead
  // of a separate `useState` a `useEffect` then sets — is what keeps the
  // effect below free of a synchronous `setState` call in its own body
  // (`react-hooks/set-state-in-effect`). The effect's only remaining job is
  // the one genuine side effect: scheduling `setVisible(false)` after the
  // crossfade duration elapses.
  const fading = visible && revealed && ended;

  // Back navigation mid-video: React's own "adjusting state when a prop
  // changes" pattern (comparing against a previous-prop-in-state value
  // during render — the identical shape `PaymentSheet.client.tsx` already
  // uses for `defaultOpen`), not an effect. This lands in the same render as
  // the pathname change rather than one frame after paint, and it is a
  // render-time derivation from a router-driven value, not an external-system
  // synchronisation — which is exactly the distinction
  // `react-hooks/set-state-in-effect` polices.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (visible && !revealed && pathname === machinePathname) {
      setHeld(false);
      setVisible(false);
      setEnded(false);
    }
  }

  useEffect(() => {
    if (!revealed || !isRevealVideoArmed()) {
      return;
    }
    restartRevealVideo();
  }, [revealed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    function isPriming(): boolean {
      return video?.dataset[REVEAL_VIDEO_PRIMING_ATTRIBUTE] === "1";
    }

    function onPlay() {
      if (isPriming()) {
        return;
      }
      setEnded(false);
      setHeld(false);
      setVisible(true);
      setPlayStartedAt(Date.now());
    }
    function onEnded() {
      setEnded(true);
    }
    function onPause() {
      if (isPriming()) {
        return;
      }
      if (video && video.currentTime === 0) {
        setEnded(false);
        setHeld(false);
        setVisible(false);
      }
    }
    function onError() {
      setEnded(false);
      setHeld(false);
      setVisible(false);
    }

    video.addEventListener("play", onPlay);
    video.addEventListener("ended", onEnded);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
    };
  }, []);

  // The route-ready signal: if the video already ended and the route has now
  // resolved underneath, crossfade out. (Back navigation mid-video is
  // handled above, during render, not here — see the comment there for why
  // that case is not this kind of effect.) `fading` is derived above, so
  // this effect's only job is the one genuine side effect: scheduling the
  // delayed `setVisible(false)` once the crossfade's own CSS transition has
  // had time to run.
  useEffect(() => {
    if (!fading) {
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), REVEAL_CROSSFADE_MS);
    return () => window.clearTimeout(timeout);
  }, [fading]);

  // Ordering B's "not changed yet" branch: a grace period before the
  // held-frame indicator appears, so a route that resolves within a frame
  // or two of `ended` never flashes it.
  useEffect(() => {
    if (!visible || !ended || revealed) {
      return;
    }
    const timeout = window.setTimeout(() => setHeld(true), 1200);
    return () => window.clearTimeout(timeout);
  }, [visible, revealed, pathname, ended]);

  // The backstop. No combination of the triggers above may strand a user
  // under an opaque overlay indefinitely.
  useEffect(() => {
    if (!visible) {
      return;
    }
    const timeout = window.setTimeout(() => setVisible(false), REVEAL_SAFETY_HOLD_MS);
    return () => window.clearTimeout(timeout);
  }, [visible, playStartedAt]);

  function skipVideo() {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
    setEnded(false);
    setHeld(false);
    setVisible(false);
  }

  return (
    <div
      // Not a blanket `aria-hidden`: the skip button below is a real control
      // and must be reachable while the overlay is up. `inert` is what keeps
      // it — and everything else in here — out of the tab order and out of
      // the accessibility tree the rest of the time, which is the same
      // guarantee the old attribute gave, minus the focusable-inside-hidden
      // contradiction.
      inert={!visible}
      // A click anywhere skips. The whole viewport is the video, so this is
      // the video's own click target rather than a backdrop's — which is
      // why there is no `stopPropagation` on the button below: both paths
      // run the same function and running it twice is idempotent.
      onClick={skipVideo}
      className={cn(
        "tap-target fixed inset-0 cursor-pointer bg-background",
        fading ? "transition-opacity" : "transition-none",
        visible && !fading ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={{ zIndex: REVEAL_OVERLAY_Z, transitionDuration: `${REVEAL_CROSSFADE_MS}ms` }}
    >
      <video
        ref={videoRef}
        id={REVEAL_VIDEO_ELEMENT_ID}
        src={source.src}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        data-unmute={unmute ? "1" : undefined}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {held ? (
        <p className="absolute inset-x-0 bottom-28 text-center text-sm font-medium text-white/80 drop-shadow-lg">
          Just a moment…
        </p>
      ) : null}
      <button
        type="button"
        onClick={skipVideo}
        className="tap-target absolute bottom-10 left-1/2 -translate-x-1/2 rounded-md bg-secondary px-4.5 py-2.5 text-[13px] font-semibold text-foreground shadow-lg ring-1 ring-inset ring-border-2 transition-colors hover:ring-primary"
      >
        Skip to reveal
      </button>
    </div>
  );
}
