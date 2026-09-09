import {
  HAND_AVAILABLE_MIN,
  HAND_BEHIND_OFFSET_PX,
  HAND_BEHIND_SCALE_RATIO,
  HAND_CARD_FLOOR_WIDTH,
  HAND_CARD_MIN_WIDTH,
  HAND_DEFAULT_STAGE_WIDTH,
  HAND_DEFAULT_VIEWPORT_HEIGHT,
  HAND_DONE_OFFSET_RATIO,
  HAND_DONE_ROTATION_DEG,
  HAND_DONE_SCALE_RATIO,
  HAND_GAP,
  HAND_META_HEIGHT,
  HAND_STAGE_INSET,
  HAND_STAGE_PADDING,
  HAND_TOP,
  HAND_TWO_COLUMN_MAX_WIDTH,
} from "../constants";
import { CARD_ASPECT } from "@/entities/card/constants";

/** A face-down card is turned, not hidden: half a rotation about its Y axis. */
export const FACE_DOWN_DEGREES = 180;

export type HandLayout = {
  cols: number;
  cardW: number;
  artH: number;
  cellH: number;
  rows: number;
  scale: number;
  handX: number;
  gridX: number;
  stageH: number;
};

export function handLayout(
  n: number,
  stageW: number,
  viewportH: number,
  dealt: boolean,
  extrasH: number,
  footerH: number,
): HandLayout {
  const W = stageW || HAND_DEFAULT_STAGE_WIDTH;
  const vh = viewportH || HAND_DEFAULT_VIEWPORT_HEIGHT;
  const avail = Math.max(HAND_AVAILABLE_MIN, vh - HAND_STAGE_PADDING - footerH - extrasH);

  // The largest card that fits in `cols` columns, on both axes at once.
  const fit = (cols: number) => {
    const rows = Math.ceil(n / cols);
    const byWidth = (W - HAND_GAP * (cols - 1)) / cols;
    // The height budget, inverted from `stageH`:
    //   rows * (cardW / CARD_ASPECT + META) + (rows - 1) * GAP <= avail
    const byHeight = CARD_ASPECT * ((avail - (rows - 1) * HAND_GAP) / rows - HAND_META_HEIGHT);
    return { cols, rows, cardW: Math.min(byWidth, byHeight) };
  };

  const maxCols = W < HAND_TWO_COLUMN_MAX_WIDTH ? Math.min(2, n) : n;
  const candidates = Array.from({ length: maxCols }, (_, i) => fit(i + 1));
  const fitting = candidates.reduce((a, b) => (b.cardW > a.cardW ? b : a));

  // `HAND_CARD_FLOOR_WIDTH` decides which constraint gives way. Above it the
  // grid fits and nothing scrolls. Below it — ten graded slabs on a 390px
  // phone, where the best fitting layout is a 52px stamp — shrinking further
  // buys a promise nobody wants. The widest column count whose cards stay
  // usable wins instead, and the panel scrolls, which is what its scroll
  // region has always been for.
  const best = !dealt
    ? fit(Math.min(maxCols, n <= 2 ? n : n <= 6 ? 3 : 4))
    : fitting.cardW >= HAND_CARD_FLOOR_WIDTH
      ? fitting
      : (candidates.filter((c) => (W - HAND_GAP * (c.cols - 1)) / c.cols >= HAND_CARD_FLOOR_WIDTH).at(-1) ??
        candidates[0]);

  const cols = best.cols;
  const rows = best.rows;
  // The floor may only ever raise a card *within* the width budget. Applying
  // it on top of both budgets let a ten-card hand on a 390px screen lay out
  // 444px of grid inside a 294px stage — no scrollbar, because the panel
  // clips, so the last two columns were simply invisible. A short viewport
  // may still overflow vertically, and that is what the scroll region is for.
  const byWidth = (W - HAND_GAP * (cols - 1)) / cols;
  const cardW = !dealt
    ? Math.max(HAND_CARD_MIN_WIDTH, byWidth)
    : fitting.cardW >= HAND_CARD_FLOOR_WIDTH
      ? Math.min(byWidth, fitting.cardW)
      : byWidth;

  const artH = cardW / CARD_ASPECT;
  const cellH = artH + HAND_META_HEIGHT;

  const scale = Math.min(
    (avail - HAND_TOP * 2) / artH,
    (W - HAND_STAGE_INSET * 2) / cardW,
  );
  const handX = (W - cardW * scale) / 2;
  // Centred: when the height budget binds, the row is narrower than the
  // stage and a left-aligned grid leaves the panel visibly lopsided.
  const gridX = Math.max(0, (W - (cols * cardW + (cols - 1) * HAND_GAP)) / 2);
  const stageH = dealt
    ? rows * cellH + (rows - 1) * HAND_GAP
    : artH * scale + HAND_TOP * 2;

  return { cols, cardW, artH, cellH, rows, scale, handX, gridX, stageH };
}

export function slotStyle(index: number, handIdx: number, dealt: boolean, layout: HandLayout) {
  if (dealt) {
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    const x = layout.gridX + col * (layout.cardW + HAND_GAP);
    const y = row * (layout.cellH + HAND_GAP);
    return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(1) rotate(0deg)`, zIndex: 10 + index };
  }

  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  let scale = layout.scale;

  if (index < handIdx) {
    offsetX = -layout.cardW * layout.scale * HAND_DONE_OFFSET_RATIO;
    rotation = HAND_DONE_ROTATION_DEG;
    scale = layout.scale * HAND_DONE_SCALE_RATIO;
  } else if (index > handIdx) {
    offsetY = -(index - handIdx) * HAND_BEHIND_OFFSET_PX;
    scale = layout.scale * HAND_BEHIND_SCALE_RATIO;
  }

  return {
    transform: `translate(${(layout.handX + offsetX).toFixed(1)}px, ${(HAND_TOP + offsetY).toFixed(1)}px) scale(${scale.toFixed(4)}) rotate(${rotation}deg)`,
    zIndex: index < handIdx ? 10 + index : index === handIdx ? 90 : 80 - (index - handIdx),
  };
}
