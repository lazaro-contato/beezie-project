"use client";

import { useEffect, useState } from "react";
import { Money } from "@/components/ui/Money";
import type { OddsLiveDTO } from "../types";

type OddsPanelLiveProps = {
  slug: string;
  initial: OddsLiveDTO;
};

const MAX_CONSECUTIVE_FAILURES = 3;

export function OddsPanelLive({ slug, initial }: OddsPanelLiveProps) {
  const [averageValueCents, setAverageValueCents] = useState(initial.averageValueCents);

  useEffect(() => {
    let es: EventSource | null = null;
    let idleId: number | null = null;
    let failureCount = 0;

    function connect() {
      idleId = null;
      const source = new EventSource(`/api/odds/${slug}`);
      es = source;

      source.onmessage = (event) => {
        failureCount = 0;
        const data = JSON.parse(event.data) as OddsLiveDTO;
        setAverageValueCents(data.averageValueCents);
      };

      source.onerror = () => {
        if (source.readyState === EventSource.CLOSED) {
          return;
        }
        if (source.readyState === EventSource.CONNECTING) {
          failureCount += 1;
          if (failureCount >= MAX_CONSECUTIVE_FAILURES) {
            source.close();
          }
        }
      };
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(connect);
    } else {
      idleId = window.setTimeout(connect, 0);
    }

    return () => {
      if (idleId !== null) {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        } else {
          window.clearTimeout(idleId);
        }
      }
      es?.close();
    };
  }, [slug]);

  return (
    <Money
      cents={averageValueCents}
      precision="exact"
      className="text-lg font-semibold leading-4 text-success"
    />
  );
}
