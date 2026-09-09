// No directive: pure arithmetic over timestamps, no DOM and no dependency,
// so `PaymentSheet.client.tsx` can import it. Deliberately *not* under
// `lib/pull/`, which `eslint.config.mjs`'s boundary zone blocks every
// `*.client.tsx` from — the same reasoning `lib/format.ts` already carries.

export const PULL_STAGE_DURATION_MS = 8_000;


export const PULL_STAGE_CARD_INTERVALS_MS = [3_200, 2_400, 1_600, 800] as const;

/**
 * How many distinct cards the stage shows — four different items, never one
 * item re-rendered. `app/claw/[slug]/@sheet/page.tsx` asks `getTopItems` for
 * exactly this many and hands them over as four server-rendered frames.
 */
export const PULL_STAGE_CARD_COUNT = PULL_STAGE_CARD_INTERVALS_MS.length;

export const PULL_STAGE_TICK_MS = 80;

function stageIntervals(frameCount: number): number[] {
  const requested = Number.isFinite(frameCount) ? Math.floor(frameCount) : 0;
  const count = Math.min(Math.max(requested, 1), PULL_STAGE_CARD_INTERVALS_MS.length);
  const head = PULL_STAGE_CARD_INTERVALS_MS.slice(0, count);
  const total = head.reduce((sum, ms) => sum + ms, 0);
  return head.map((ms) => (ms * PULL_STAGE_DURATION_MS) / total);
}

export function pullStageProgress(
  startedAtMs: number,
  nowMs: number,
  frameCount: number = PULL_STAGE_CARD_COUNT,
): number {
  const elapsed = nowMs - startedAtMs;
  if (!(elapsed > 0)) {
    return 0;
  }

  const intervals = stageIntervals(frameCount);
  const share = 1 / intervals.length;
  let consumed = 0;

  for (let index = 0; index < intervals.length; index++) {
    const span = intervals[index];
    if (elapsed < consumed + span) {
      return index * share + ((elapsed - consumed) / span) * share;
    }
    consumed += span;
  }

  return 1;
}

/**
 * Which of the `frameCount` frames is showing, given the elapsed time.
 *
 * Advances on the accelerating schedule above and then **stops** at the last
 * frame — it does not wrap. Wrapping would re-show card 1 whenever
 * `createPull` outlasted the eight seconds, which reads as a loop rather
 * than as a stage that has finished counting and is waiting.
 *
 * @param startedAtMs when the confirm click happened
 * @param nowMs the current time
 * @param frameCount how many frames the server actually supplied (normally
 *   `PULL_STAGE_CARD_COUNT`, but a machine with fewer top items, or the
 *   unknown-slug case, can supply fewer or none)
 */
export function pullStageCardIndex(startedAtMs: number, nowMs: number, frameCount: number): number {
  if (frameCount <= 1) {
    return 0;
  }

  const intervals = stageIntervals(frameCount);
  const elapsed = Math.max(0, nowMs - startedAtMs);
  let consumed = 0;

  for (let index = 0; index < intervals.length; index++) {
    consumed += intervals[index];
    if (elapsed < consumed) {
      return index;
    }
  }

  return intervals.length - 1;
}

/** Renders a `[0, 1]` fraction as a CSS width, e.g. `0.55` -> `"55%"`. */
export function progressWidth(fraction: number): string {
  return `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
}
