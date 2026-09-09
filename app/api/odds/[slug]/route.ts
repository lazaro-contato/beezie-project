import "server-only";
import { MACHINE_SLUGS } from "@/lib/machines";
import { getOdds } from "@/features/machine/queries";
import type { OddsLiveDTO } from "@/features/machine/types";
import { applyMarketTick } from "@/lib/market-tick";
import {
  ODDS_SSE_INTERVAL_MS,
  ODDS_SSE_MAX_STREAM_MS,
  ODDS_SSE_RETRY_MS,
} from "@/features/machine/constants";

const encoder = new TextEncoder();

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!(MACHINE_SLUGS as readonly string[]).includes(slug)) {
    return new Response(null, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      function safeEnqueue(chunk: string) {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The controller is already closed underneath us (a race between
          // the abort listener and an in-flight tick) — treat exactly like
          // an abort rather than throwing out of the stream.
          closed = true;
        }
      }

      async function tick() {
        const odds = await getOdds(slug);
        const ticked = applyMarketTick(odds, Math.random);
        const payload: OddsLiveDTO = { averageValueCents: ticked.averageValueCents };
        safeEnqueue(`event: odds\ndata: ${JSON.stringify(payload)}\n\n`);
      }

      function cleanup() {
        if (closed) {
          return;
        }
        closed = true;
        clearInterval(interval);
        clearTimeout(maxStreamTimer);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }

      safeEnqueue(`retry: ${ODDS_SSE_RETRY_MS}\n\n`);

      const interval = setInterval(() => {
        void tick();
      }, ODDS_SSE_INTERVAL_MS);

      const maxStreamTimer = setTimeout(cleanup, ODDS_SSE_MAX_STREAM_MS);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // `no-transform` is load-bearing: a gzip-buffering proxy kills SSE.
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
