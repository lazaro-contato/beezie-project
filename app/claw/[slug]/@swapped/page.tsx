import { Suspense } from "react";
import type { Route } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { swapPointsFor } from "@/lib/points";
import { getPull } from "@/features/reveal/queries.pull";
import {
  SWAP_SUCCESS_OVERLAY_CLASS,
  SwapSuccessPanel,
} from "@/features/reveal/components/SwapSuccessPanel";

/** The pull whose swap just committed. A pull id, not an amount: the figures
 * are read back out of the database, so a hand-written URL can show someone
 * a confirmation for a pull they own and nothing else. */
const SWAPPED_PARAM = "swapped";

export default function SwappedSlot({ params, searchParams }: PageProps<"/claw/[slug]">) {
  return (
    <Suspense fallback={null}>
      <SwappedResolver params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SwappedResolver({ params, searchParams }: PageProps<"/claw/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const raw = sp[SWAPPED_PARAM];
  const pullId = Array.isArray(raw) ? raw[0] : raw;
  if (!pullId) {
    return null;
  }

  const pull = await getPull({ pullId, slug });
  if (!pull) {
    return null;
  }

  const swapped = pull.items.filter((item) => item.status === "swapped");
  if (swapped.length === 0) {
    return null;
  }

  const creditedCents = swapped.reduce((total, item) => total + item.swapValueCents, 0);

  return (
    <div
      data-scroll-lock
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-success-title"
      className={SWAP_SUCCESS_OVERLAY_CLASS}
    >
      <SwapSuccessPanel
        creditedCents={creditedCents}
        // The same pure function over the same total the transaction used,
        // not a second arithmetic: `resolvePullItems` credits
        // `swapPointsFor(total)` and this reproduces exactly that.
        pointsAwarded={swapPointsFor(creditedCents)}
        close={
          <Link
            href={`/claw/${slug}` as Route}
            aria-label="Close"
            className="tap-target flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </Link>
        }
      />
    </div>
  );
}
