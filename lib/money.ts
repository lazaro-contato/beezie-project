// Constructed once at module scope, not per call — this runs once per card
// in a grid, and per keystroke in the stepper.
const exactFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const wholeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export type MoneyPrecision = "auto" | "exact";

export interface FormatCentsOptions {
  readonly precision?: MoneyPrecision;
}

/**
 * Formats integer cents as a US dollar string, e.g. `1299` -> `"$12.99"`.
 *
 * The locale is hard-coded to `en-US`, not derived from `Accept-Language`.
 * A request-derived locale would make every formatted price dynamic —
 * killing the cached shell — and would mismatch the first time the client
 * stepper reformats the same cents value with a different locale.
 */
export function formatCents(cents: number, options?: FormatCentsOptions): string {
  const precision = options?.precision ?? "exact";
  const isWholeDollarAmount = cents % 100 === 0;

  if (precision === "auto" && isWholeDollarAmount) {
    return wholeFormatter.format(cents / 100);
  }
  return exactFormatter.format(cents / 100);
}
