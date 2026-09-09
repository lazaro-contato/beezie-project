// No directive: pure constants, the `lib/pull/tiers.ts` precedent — a value a
// client island is allowed to see (it already renders as the stepper's min
// and max), it just may never reach one by importing this whole directory.
// The ESLint boundary zone still blocks `**/*.client.tsx` from all of
// `lib/pull/**`, so an island receives these two numbers only through a
// prop, exactly like `tiers.ts`'s tier names.

/**
 * The bounds `createPull`'s zod schema enforces, and the one place they are
 * written down. Imported by `ActionRow` (which hands them to the stepper as
 * its clamp), by `openCheckout` (which re-clamps the posted form field) and
 * by `features/checkout/schema.ts`'s `createPullSchema` — so the stepper's
 * UI clamp, the sheet's entry point and the server's actual limit can never
 * disagree about where the bounds sit.
 */
export const MIN_PULL_QUANTITY = 1;
export const MAX_PULL_QUANTITY = 10;


export const PULL_QUANTITY_COOKIE_NAME = "beezie_qty";
