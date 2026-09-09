import "server-only";
import type { OddsDTO } from "./pull/odds";

export const ODDS_DRIFT_BPS = 50;

export function applyMarketTick(odds: OddsDTO, rand: () => number): OddsDTO {
  const trueValueCents = odds.averageValueCents;

  // `rand()` is sampled exactly once and mapped to a signed fraction in
  // [-1, 1], so the offset's magnitude never exceeds `ODDS_DRIFT_BPS` of the
  // true value in either direction.
  const signedFraction = rand() * 2 - 1;
  const offsetCents = (trueValueCents * ODDS_DRIFT_BPS * signedFraction) / 10_000;

  const driftedDollars = Math.round((trueValueCents + offsetCents) / 100);

  return {
    ...odds,
    averageValueCents: driftedDollars * 100,
  };
}
