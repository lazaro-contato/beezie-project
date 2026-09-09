import type React from "react";

export const REVEAL_CROSSFADE_MS = 400;

export const REVEAL_SAFETY_HOLD_MS = 15_000;

export const REVEAL_OVERLAY_Z = 60;

export const PRELOAD_IDLE_TIMEOUT_MS = 2_000;

export const REVEAL_FOOTER_HEIGHT = 108;

export const REVEAL_FOOTER_ROW_HEIGHT = 48;

/** The two custom properties the pair above travel in. */
export const revealFooterVars = {
  "--reveal-footer-h": `${REVEAL_FOOTER_HEIGHT}px`,
  "--reveal-footer-row-h": `${REVEAL_FOOTER_ROW_HEIGHT}px`,
} as React.CSSProperties;

export const REVEAL_STICKY_FOOTER_HEIGHT = 84;

export const REVEAL_PANEL_HEADER_HEIGHT = 60;

export const COUNTDOWN_TICK_MS = 1_000;

/** `handLayout`'s gutter, used both between stacked cards and in the dealt grid. */
export const HAND_GAP = 16;

/** `handLayout`'s `handY`: the stack's top inset inside the stage. */
export const HAND_TOP = 16;

export const HAND_STAGE_INSET = 16;

/** `handLayout`'s width-derived `cardW` floor, so a narrow phone never
 * renders a stamp. The height budget may still go under it — see
 * `HAND_CARD_FLOOR_WIDTH`. */
export const HAND_CARD_MIN_WIDTH = 132;

/** The absolute floor, below which no budget may push a card. Only reachable
 * on a viewport too short to fit the grid at all, which is the one case the
 * panel still allows itself to scroll. */
export const HAND_CARD_FLOOR_WIDTH = 76;

export const HAND_META_HEIGHT = 94;

export const HAND_STAGE_PADDING = 20 + 28;

export const HAND_AVAILABLE_MIN = 220;

/** `handLayout`'s SSR defaults, before the first measurement lands.
 *  `HAND_DEFAULT_VIEWPORT_HEIGHT` is the *scroll viewport's* height (see
 *  `HAND_CHROME_HEIGHT`), not the window's — roughly what a 900px-tall
 *  browser leaves the panel body. */
export const HAND_DEFAULT_STAGE_WIDTH = 860;
export const HAND_DEFAULT_VIEWPORT_HEIGHT = 640;

/** The stacked (undealt) offsets: the flicked-away card and the deck behind. */
export const HAND_DONE_OFFSET_RATIO = 0.78;
export const HAND_DONE_ROTATION_DEG = -7;
export const HAND_DONE_SCALE_RATIO = 0.86;
export const HAND_BEHIND_OFFSET_PX = 5;
export const HAND_BEHIND_SCALE_RATIO = 0.985;

/** `handMove`'s degrees of rotation per pixel of horizontal drag. */
export const HAND_DEGREES_PER_PIXEL = 0.55;

/** `handUp`'s "a tap counts as a flip" threshold, in pixels of travel. */
export const HAND_TAP_THRESHOLD_PX = 6;

/** `handUp`'s snap, and the stage/layout transition both share this easing. */
export const HAND_SNAP_MS = 460;
export const HAND_LAYOUT_MS = 560;
export const HAND_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** `markFlipped`: advance to the next card 560ms after one is turned... */
export const HAND_ADVANCE_MS = 560;
/** ...and settle the whole hand into the dealt grid 520ms after the last. */
export const HAND_SETTLE_MS = 520;

/** `flipAll`: every card turns at once, then deals 800ms later. */
export const HAND_FLIP_ALL_MS = 800;

/**
 * `startSwap`'s progress window. Unlike the pull stage's 9000ms (see
 * `lib/progress.ts` for why that one could not survive contact with a real
 * transaction), this one is kept exactly: the swap is a genuine beat in the
 * flow rather than a stand-in for latency, and the success panel needs the
 * server's `creditedCents`/`pointsAwarded` before it can render at all —
 * so the bar and the round trip run together and `success` waits for both.
 */
export const SWAP_PROGRESS_MS = 2_600;

/** The swap progress bar's own tick, transcribed from `startSwap`. */
export const SWAP_PROGRESS_TICK_MS = 80;

export const HAND_CARD_MAX_WIDTH = 640;

export const HAND_TWO_COLUMN_MAX_WIDTH = 640;
