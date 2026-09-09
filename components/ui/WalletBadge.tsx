import { Wallet } from "lucide-react";
import { Money } from "@/components/ui/Money";

type WalletBadgeProps = {
  cents: number;
};

export function WalletBadge({ cents }: WalletBadgeProps) {
  return (
    <span className="inline-flex h-10 items-center gap-2.5 rounded-[7px] bg-card px-4 text-sm font-medium text-white">
      <Wallet size={16} aria-hidden="true" className="text-secondary-foreground" />
      <Money cents={cents} />
    </span>
  );
}
