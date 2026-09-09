export interface WalletDTO {
  readonly beezieWalletCents: number;
  readonly externalWalletCents: number;
  readonly pointsBalance: number;
}

// Re-exported, not redefined: the promo cookie's own schema
// (`./constants.ts`) is the one source of truth for the status enum, the
// same `lib/pull/odds.ts` re-export shape `features/machine/types.ts` uses
// for `OddsDTO`, applied here to a same-feature file instead of a
// cross-layer one. Imported (not just re-exported) so `CheckoutQuoteDTO`
// below can also reference it locally.
import type { PromoStatus } from "./constants";
export type { PromoStatus };

export type PaymentMethod = "beezie_wallet" | "external_wallet";

export interface CheckoutQuoteDTO {
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly subtotalCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly pointsToAward: number;
  readonly promoCode?: string;
  readonly promoStatus?: PromoStatus;
}

export interface CommitmentDTO {
  readonly serverSeedHash: string;
}

export type CreatePullErrorCode =
  | "INVALID_INPUT"
  | "MACHINE_UNAVAILABLE"
  | "INSUFFICIENT_FUNDS"
  | "PRICE_CHANGED"
  | "CONFLICT"
  | "INTERNAL";

export type CreatePullResult =
  | { readonly ok: true; readonly pullId: string }
  | { readonly ok: false; readonly code: CreatePullErrorCode };
