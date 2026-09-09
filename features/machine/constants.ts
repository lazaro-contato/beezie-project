export const ARTWORK_PANEL_HEIGHT = 658;

/** Both bottom panels (odds and recent pulls) at their outer frame. */
export const BOTTOM_PANEL_HEIGHT = 800;

/** The fixed-height scroll viewport inside each bottom panel — the odds
 * panel's chip list and the recent-pulls row list are both this tall
 * regardless of how many rows a query returns, which is what makes streamed
 * content structurally unable to shift anything below it. */
export const SCROLL_VIEWPORT_HEIGHT = 680;

/** The wallet badge pill in the layout header. */
export const WALLET_BADGE_WIDTH = 96;
export const WALLET_BADGE_HEIGHT = 40;

export const SITE_HEADER_HEIGHT = 85;

/** The action row: the running total, the quantity stepper and the Start
 * button, stacked. Same height at every breakpoint — below `lg` the whole
 * block is pulled out of flow by `MobileActionBar`, which adds 8px of
 * padding top and bottom. */
export const ACTION_ROW_HEIGHT = 92;
export const ACTION_ROW_HEIGHT_MOBILE = ACTION_ROW_HEIGHT + 16;

export const SWAP_BADGE_HEIGHT = 28;
export const SWAP_BADGE_WIDTH = 104;

/** The SWAP rate dialog, above the card detail overlay (55) and below the
 * reveal (60). */
export const SWAP_DIALOG_Z = 56;

export const ODDS_BAND_HEIGHT = 66;

/** The odds panel: the header row, 10px, then two rows of bands. */
export const ODDS_PANEL_HEIGHT = 196;

export const MORE_MACHINE_TILE_HEIGHT = 108;

/** Cadence of the odds SSE stream's `averageValueCents` frame. No frame at
 * t=0 — the server-rendered value already *is* the t0 frame, and emitting
 * one immediately on connect would read as a hydration flash. */
export const ODDS_SSE_INTERVAL_MS = 5_000;

export const ODDS_SSE_RETRY_MS = 15_000;

/** The route ends the stream deliberately after this long rather than
 * holding a Node handle and a SQLite read loop open indefinitely for an
 * idle tab; the browser's native reconnect (driven by `ODDS_SSE_RETRY_MS`)
 * re-establishes it. */
export const ODDS_SSE_MAX_STREAM_MS = 600_000;

export { ODDS_DRIFT_BPS } from "@/lib/market-tick";

