export interface PromoDiscountInput {
  readonly kind: "percent" | "fixed";
  readonly valueBps: number | null;
  readonly valueCents: number | null;
}

/**
 * `unitPriceCents * quantity`. Its own named function rather than an inline
 * multiplication at each call site (the sheet's quote, the transaction's
 * recompute, and this module's own test) so every caller reads the same
 * name for the same arithmetic.
 */
export function subtotalCents(unitPriceCents: number, quantity: number): number {
  return unitPriceCents * quantity;
}

export function discountCents(subtotal: number, promo: PromoDiscountInput | null): number {
  if (!promo) {
    return 0;
  }
  const raw =
    promo.kind === "percent"
      ? Math.round((subtotal * (promo.valueBps ?? 0)) / 10_000)
      : (promo.valueCents ?? 0);
  return Math.min(subtotal, Math.max(0, raw));
}

/**
 * `subtotal - discount`. A named function for the same reason
 * `subtotalCents` is one: one name, every call site, no chance of the quote
 * and the charge computing "total" two different ways.
 */
export function totalCents(subtotal: number, discount: number): number {
  return subtotal - discount;
}
