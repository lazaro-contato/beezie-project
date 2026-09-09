// No directive and no `server-only` guard: this is one integer computation
// over a number, the `lib/money.ts` shape. It is called on the server only
// (inside `swapPullItems`' transaction and by `SingleReveal`'s server-rendered
// success panel), but nothing about it needs to be — and keeping it here,
// beside `lib/money.ts`, keeps one rate in one place.

export const SWAP_POINTS_PER_DOLLAR = 0.5;

export function swapPointsFor(creditedCents: number): number {
  if (!Number.isFinite(creditedCents) || creditedCents <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((creditedCents / 100) * SWAP_POINTS_PER_DOLLAR));
}

/** Purchase points, as a share of the amount bought. 26% of the dollar value. */
export const PURCHASE_POINTS_RATE = 0.26;

/**
 * Points awarded for a purchase of `subtotalCents`.
 *
 * On the subtotal rather than the charged total, so a promo code reduces what
 * you pay without reducing what the panel already promised.
 */
export function purchasePointsFor(subtotalCents: number): number {
  if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) {
    return 0;
  }
  return Math.round((subtotalCents / 100) * PURCHASE_POINTS_RATE);
}
