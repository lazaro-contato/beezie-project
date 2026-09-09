import type { Route } from "next";
import { SWAP_RATE_BPS } from "@/lib/pull/draw";

/** The badge label and the worked example both derive from `SWAP_RATE_BPS`,
 * so changing the rate changes every figure the UI shows. */
export const SWAP_RATE_PERCENT = SWAP_RATE_BPS / 100;

/** The round figure the "Example" row is built on. */
export const SWAP_EXAMPLE_ITEM_VALUE_CENTS = 10_000;

export function swapQuoteCents(fmvCents: number): number {
  return Math.round((fmvCents * SWAP_RATE_BPS) / 10000);
}

export const SWAP_PARAM = "swap";

type SearchParamRecord = Record<string, string | string[] | undefined>;

/**
 * The current URL with `?swap=1` set or removed. Every other search param
 * survives, which is what keeps `?checkout=1` and the card params intact
 * across opening and closing the dialog.
 */
export function swapHref(slug: string, sp: SearchParamRecord, open: boolean): Route {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (key === SWAP_PARAM || value === undefined) {
      continue;
    }
    for (const entry of Array.isArray(value) ? value : [value]) {
      query.append(key, entry);
    }
  }

  if (open) {
    query.set(SWAP_PARAM, "1");
  }

  const search = query.toString();
  // `as Route`: typedRoutes cannot narrow a template literal carrying an
  // interpolated slug and an arbitrary query string.
  return (search ? `/claw/${slug}?${search}` : `/claw/${slug}`) as Route;
}
