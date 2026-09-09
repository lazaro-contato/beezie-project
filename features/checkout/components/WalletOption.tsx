import { Money } from "@/components/ui/Money";

type WalletOptionProps = {
  label: string;
  cents: number;
  /** The quote's current total, so this can render its own insufficient-
   * funds line without the caller having to compute it twice. */
  totalCents: number;
};

export function WalletOption({ label, cents, totalCents }: WalletOptionProps) {
  const insufficient = cents < totalCents;

  return (
    <span className="flex flex-1 items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="flex flex-col items-end">
        <Money cents={cents} className="text-sm font-semibold text-foreground" />
        {insufficient ? <span className="text-xs text-destructive">Insufficient balance</span> : null}
      </span>
    </span>
  );
}
