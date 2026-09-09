import Link from "next/link";
import { CircleQuestionMark } from "lucide-react";
import { SWAP_RATE_PERCENT, swapHref } from "../swap-rate";

type SwapRateBadgeProps = {
  slug: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Opens the SWAP rate dialog by putting `?swap=1` on the URL; the `@swap`
 * parallel slot renders the dialog itself. A `<Link>`, so it needs no
 * island.
 *
 * Awaits `searchParams` so the link can preserve every other param, which
 * makes this a dynamic hole — `app/claw/[slug]/page.tsx` gives it its own
 * Suspense boundary and reserves its exact size.
 */
export async function SwapRateBadge({ slug, searchParams }: SwapRateBadgeProps) {
  const sp = await searchParams;

  return (
    <Link
      href={swapHref(slug, sp, true)}
      scroll={false}
      aria-label="How the SWAP rate works"
      className="tap-target inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full bg-primary px-2.5 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {`${SWAP_RATE_PERCENT}% SWAP`}
      <CircleQuestionMark size={12} aria-hidden="true" />
    </Link>
  );
}
