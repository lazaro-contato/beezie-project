/**
 * Formats an integer basis-points value as a percentage string with two
 * decimal places, e.g. `formatPercentFromBps(72) -> "0.72%"`.
 *
 * Basis points (1/100 of a percent) are what `machineTierWeights.weightBps`
 * and the derived `OddsDTO.tiers[].probabilityBps` are stored and passed
 * around as, specifically so the odds panel never divides by a float until
 * this single, shared formatting step.
 */
export function formatPercentFromBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
