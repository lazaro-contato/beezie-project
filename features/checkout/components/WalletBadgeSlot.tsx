import { WalletBadge } from "@/components/ui/WalletBadge";
import { getViewerWallet } from "../queries";

export async function WalletBadgeSlot() {
  const wallet = await getViewerWallet();
  return <WalletBadge cents={wallet.beezieWalletCents} />;
}
