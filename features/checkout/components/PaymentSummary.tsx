import Image from "next/image";
import { Money } from "@/components/ui/Money";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import type { CheckoutQuoteDTO } from "../types";
import { isVectorImage } from "@/lib/image";

// The crate is a transparent icon, so its shadow is a filter rather than a
// box-shadow — the same call `MoreMachines` makes.
const CRATE_SHADOW = "drop-shadow(0 10px 10px rgba(3,3,3,0.4)) drop-shadow(0 3px 4px rgba(3,3,3,0.3))";

type PaymentSummaryProps = {
  machineName: string;
  /** The active machine's crate icon, from `MACHINE_CRATE_ICONS`. Passed as
   * a prop rather than looked up here so this component stays inert about
   * which machines exist. */
  imageUrl: string;
  quote: CheckoutQuoteDTO;
};

export function PaymentSummary({ machineName, imageUrl, quote }: PaymentSummaryProps) {
  const hasDiscount = quote.discountCents > 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-fill-subtle">
          <Image
            src={imageUrl}
            alt={machineName}
            width={60}
            height={48}
            unoptimized={isVectorImage(imageUrl)}
            className="object-contain"
            style={{ filter: CRATE_SHADOW }}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-base font-semibold leading-6 text-foreground">{machineName}</p>
            <Money cents={quote.unitPriceCents} className="text-xs font-medium text-secondary-foreground" />
          </div>
          <Badge variant="primary" className="shrink-0">
            +{quote.pointsToAward} pts
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Quantity</span>
        <span className="font-medium text-foreground">{quote.quantity}</span>
      </div>

      {hasDiscount ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <Money cents={quote.subtotalCents} className="font-medium text-foreground" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Discount{quote.promoCode ? ` (${quote.promoCode})` : ""}
            </span>
            <span className="font-medium text-primary">
              -<Money cents={quote.discountCents} />
            </span>
          </div>
        </>
      ) : null}

      <Separator />

      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Total</span>
        <Money cents={quote.totalCents} className="text-lg font-bold text-foreground" />
      </div>
    </div>
  );
}
