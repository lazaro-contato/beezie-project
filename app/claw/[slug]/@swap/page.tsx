import { Suspense } from "react";
import { SwapRateDialog } from "@/features/machine/components/SwapRateDialog";
import { SWAP_PARAM, swapHref } from "@/features/machine/swap-rate";

/**
 * The SWAP rate dialog, as a parallel route slot driven by `?swap=1` — the
 * same construct `@sheet` and `@card` already use, and for the same reason:
 * the dialog renders over the machine page with the page still behind it,
 * which a nested route segment could not do, while which state it is in
 * stays a fact about the URL. Back closes it, refresh reopens it, the link
 * is shareable, and it costs no client island.
 */
export default function SwapRateSlot({ params, searchParams }: PageProps<"/claw/[slug]">) {
  return (
    <Suspense fallback={null}>
      <SwapRateResolver params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SwapRateResolver({ params, searchParams }: PageProps<"/claw/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const raw = sp[SWAP_PARAM];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value !== "1") {
    return null;
  }

  return <SwapRateDialog closeHref={swapHref(slug, sp, false)} />;
}
