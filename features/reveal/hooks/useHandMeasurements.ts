import { useLayoutEffect, useRef, useState } from "react";
import {
  HAND_DEFAULT_STAGE_WIDTH,
  HAND_DEFAULT_VIEWPORT_HEIGHT,
  REVEAL_STICKY_FOOTER_HEIGHT,
} from "../constants";

export function useHandMeasurements() {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const extrasRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [stageW, setStageW] = useState(HAND_DEFAULT_STAGE_WIDTH);
  const [viewportH, setViewportH] = useState(HAND_DEFAULT_VIEWPORT_HEIGHT);
  const [extrasH, setExtrasH] = useState(0);
  const [footerH, setFooterH] = useState(REVEAL_STICKY_FOOTER_HEIGHT);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const scroll = scrollRef.current;
    if (!stage || !scroll) {
      return;
    }

    const sync = () => {
      const width = Math.round(stage.clientWidth);
      const height = Math.round(scroll.clientHeight);
      const extras = extrasRef.current ? Math.round(extrasRef.current.offsetHeight) : 0;
      const footer = footerRef.current
        ? Math.round(footerRef.current.offsetHeight)
        : REVEAL_STICKY_FOOTER_HEIGHT;
      setStageW((previous) => (previous === width || width === 0 ? previous : width));
      setViewportH((previous) => (previous === height || height === 0 ? previous : height));
      setExtrasH((previous) => (previous === extras ? previous : extras));
      setFooterH((previous) => (previous === footer ? previous : footer));
    };

    const observer = new ResizeObserver(sync);
    observer.observe(stage);
    observer.observe(scroll);
    if (extrasRef.current) {
      observer.observe(extrasRef.current);
    }
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return { stageRef, scrollRef, extrasRef, footerRef, stageW, viewportH, extrasH, footerH };
}
