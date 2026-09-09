"use client";

import { useEffect } from "react";
import { REVEAL_VIDEO_ELEMENT_ID } from "@/lib/video-gesture";
import { PRELOAD_IDLE_TIMEOUT_MS } from "../constants";

type VideoPreloaderProps = {
  poster: string;
};

interface NetworkInformationLike {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
}

export function VideoPreloader({ poster }: VideoPreloaderProps) {
  useEffect(() => {
    function preload() {
      const nav = navigator as Navigator & { connection?: NetworkInformationLike };
      const connection = nav.connection;
      if (connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") {
        return;
      }

      const element = document.getElementById(REVEAL_VIDEO_ELEMENT_ID);
      if (!(element instanceof HTMLVideoElement)) {
        return;
      }

      if (!element.paused || element.currentTime > 0) {
        return;
      }

      element.poster = poster;
      element.preload = "auto";
      element.load();
      element.addEventListener(
        "canplaythrough",
        () => {
          element.dataset.ready = "1";
        },
        { once: true },
      );
    }

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(preload, { timeout: PRELOAD_IDLE_TIMEOUT_MS });
    } else {
      timeoutId = window.setTimeout(preload, PRELOAD_IDLE_TIMEOUT_MS);
    }

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [poster]);

  return null;
}
