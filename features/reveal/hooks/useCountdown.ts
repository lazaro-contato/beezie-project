import { useEffect, useRef, useState } from "react";
import { COUNTDOWN_TICK_MS } from "../constants";

/**
 * Milliseconds left on the quote. Every tick recomputes the remainder against
 * a deadline fixed at mount rather than decrementing state, so a throttled
 * timer self-corrects instead of drifting.
 */
export function useCountdown(expiresInMs: number): number {
  const [remainingMs, setRemainingMs] = useState(expiresInMs);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    deadlineRef.current = Date.now() + expiresInMs;

    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) {
        return;
      }
      setRemainingMs(Math.max(0, deadline - Date.now()));
    };

    const interval = window.setInterval(tick, COUNTDOWN_TICK_MS);
    return () => window.clearInterval(interval);
  }, [expiresInMs]);

  return remainingMs;
}
