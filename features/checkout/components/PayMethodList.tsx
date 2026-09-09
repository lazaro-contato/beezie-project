import { cn } from "@/lib/cn";
import { WalletOption } from "./WalletOption";
import type { PaymentMethod, WalletDTO } from "../types";

type PayMethodListProps = {
  wallet: WalletDTO;
  totalCents: number;
  /** Decided server-side (`app/claw/[slug]/@sheet/page.tsx`) from the
   * viewer's own balances — whichever wallet can actually cover the total,
   * falling back to Beezie wallet if neither can. This only sets the
   * radios' `defaultChecked`; the browser owns the actual selection from
   * here on, and `PaymentSheet.client.tsx` reads whichever one is checked
   * at confirm time straight off the form. */
  defaultMethod: PaymentMethod;
};

const optionRowClasses =
  "flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

export function PayMethodList({ wallet, totalCents, defaultMethod }: PayMethodListProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-foreground">Pay with</legend>

      <label className={optionRowClasses}>
        <input
          type="radio"
          name="paymentMethod"
          value="beezie_wallet"
          defaultChecked={defaultMethod === "beezie_wallet"}
          className="size-4 accent-primary"
        />
        <WalletOption label="Beezie wallet" cents={wallet.beezieWalletCents} totalCents={totalCents} />
      </label>

      <label className={optionRowClasses}>
        <input
          type="radio"
          name="paymentMethod"
          value="external_wallet"
          defaultChecked={defaultMethod === "external_wallet"}
          className="size-4 accent-primary"
        />
        <WalletOption label="External wallet" cents={wallet.externalWalletCents} totalCents={totalCents} />
      </label>

      <label className={cn(optionRowClasses, "opacity-60")}>
        <input type="radio" name="paymentMethod" value="card" disabled className="size-4 accent-primary" />
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-foreground">Credit / debit</span>
          <span className="text-xs italic text-muted-foreground">Processing fees may apply</span>
        </span>
      </label>
    </fieldset>
  );
}
