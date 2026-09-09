// No directive: pure constants and a shape (not a database read), so both
// `queries.ts` (`server-only`) and `actions.ts` (`'use server'`) can import
// this file without either pulling in the other's guard.
import { z } from "zod";

export const QUOTE_TTL_MS = 15 * 60 * 1000;

export const PROMO_COOKIE_NAME = "beezie_promo";

export const PROMO_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60, // one hour; `createPull` recomputes validity fresh regardless
  path: "/",
};

export const promoCookieSchema = z.object({
  code: z.string().min(1).max(32),
  status: z.enum(["applied", "invalid", "expired", "inactive"]),
});

export type PromoCookiePayload = z.infer<typeof promoCookieSchema>;

/** Re-derived from the cookie schema rather than declared twice, so the two
 * can never drift out of agreement (the `lib/pull/odds.ts` re-export
 * precedent in `features/machine/types.ts`, applied to a same-feature type
 * instead of a cross-layer one). */
export type PromoStatus = PromoCookiePayload["status"];

export { PULL_QUANTITY_COOKIE_NAME } from "@/lib/pull/limits";

export const PULL_QUANTITY_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};
