import { Suspense } from "react";
import { getMachineBySlug, getTopItems } from "@/features/machine/queries";
import { MACHINE_CRATE_ICONS, type MachineSlug } from "@/lib/machines";
import { getCheckoutQuote, getViewerWallet } from "@/features/checkout/queries";
import { PaymentSheet } from "@/features/checkout/components/PaymentSheet.client";
import { PaymentSummary } from "@/features/checkout/components/PaymentSummary";
import { PayMethodList } from "@/features/checkout/components/PayMethodList";
import { PullPreviewCard } from "@/features/checkout/components/PullPreviewCard";
import { PULL_PREVIEW_COUNT } from "@/features/checkout/pull-stage";
import { cookies } from "next/headers";
import { MAX_PULL_QUANTITY, MIN_PULL_QUANTITY } from "@/lib/pull/limits";
import { PULL_QUANTITY_COOKIE_NAME } from "@/features/checkout/constants";
import type { PaymentMethod } from "@/features/checkout/types";

async function readQuantity(): Promise<number> {
  const raw = (await cookies()).get(PULL_QUANTITY_COOKIE_NAME)?.value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return MIN_PULL_QUANTITY;
  }
  return Math.min(MAX_PULL_QUANTITY, Math.max(MIN_PULL_QUANTITY, parsed));
}

export default function PaymentSheetSlot({ params, searchParams }: PageProps<"/claw/[slug]">) {
  return (
    <Suspense fallback={null}>
      <PaymentSheetResolver params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentSheetResolver({ params, searchParams }: PageProps<"/claw/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const isOpen = sp.checkout === "1";
  const quantity = await readQuantity();

  const machine = await getMachineBySlug(slug);

  if (!machine) {
    // An unknown slug has no items to preview either; the empty array is
    // the shape `PaymentSheet` already handles.
    // An unknown slug is `page.tsx`'s own `notFound()` to raise — this slot
    // just has nothing to render for it and stays closed rather than
    // throwing a second time.
    return (
      <PaymentSheet
        defaultOpen={false}
        slug={slug}
        quantity={quantity}
        paymentMethod="beezie_wallet"
        expectedTotalCents={0}
        confirmDisabled
        pullPreview={[]}
      >
        {null}
      </PaymentSheet>
    );
  }

  const [wallet, quote, topItems] = await Promise.all([
    getViewerWallet(),
    getCheckoutQuote({
      quantity,
      unitPriceCents: machine.unitPriceCents,
    }),
    getTopItems(slug, PULL_PREVIEW_COUNT),
  ]);

  let paymentMethod: PaymentMethod = "beezie_wallet";
  let confirmDisabled = false;
  let disabledReason: string | undefined;

  if (machine.status !== "active") {
    confirmDisabled = true;
    disabledReason = "This machine is being restocked.";
  } else if (wallet.beezieWalletCents >= quote.totalCents) {
    paymentMethod = "beezie_wallet";
  } else if (wallet.externalWalletCents >= quote.totalCents) {
    paymentMethod = "external_wallet";
  } else {
    confirmDisabled = true;
    disabledReason = "Insufficient balance in both wallets.";
  }

  return (
    <PaymentSheet
      defaultOpen={isOpen}
      slug={slug}
      quantity={quantity}
      paymentMethod={paymentMethod}
      expectedTotalCents={quote.totalCents}
      confirmDisabled={confirmDisabled}
      disabledReason={disabledReason}
      pullPreview={topItems.map((card) => <PullPreviewCard key={card.id} card={card} />)}
    >
      <div className="grid gap-6 nav:grid-cols-[1fr_320px]">
        <div className="order-2 nav:order-1">
          <PayMethodList wallet={wallet} totalCents={quote.totalCents} defaultMethod={paymentMethod} />
        </div>
        <div className="order-1 nav:order-2">
          <PaymentSummary machineName={machine.name} imageUrl={MACHINE_CRATE_ICONS[slug as MachineSlug]} quote={quote} />
        </div>
      </div>
    </PaymentSheet>
  );
}
