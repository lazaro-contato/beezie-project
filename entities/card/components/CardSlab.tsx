import Image from "next/image";
import { CARD_ASPECT, CARD_GRADING_LABEL_HEIGHT } from "../constants";
import type { CardDTO } from "../types";
import { isVectorImage } from "@/lib/image";

type CardSlabProps = {
  card: Pick<CardDTO, "name" | "imageUrl" | "grader" | "grade" | "certNumber">;
  /** Forwarded to `next/image`; a caller in a fixed-size context (the 52px
   * Recent pulls thumb, a 192px grid tile) should pass its own size. */
  sizes?: string;
  priority?: boolean;
};

export function CardSlab({ card, sizes, priority }: CardSlabProps) {
  const hasGradingLabel = Boolean(card.grader && card.grade);

  return (
    <div
      // `w-full`: the image inside is `next/image` with `fill`, so this box
      // has no intrinsic width. Dropped into a flex column with
      // `items-center`, a child without it shrinks to content rather than
      // stretching, and the slab renders at a fraction of the column it was
      // given. Every surface that places a slab sizes it through its
      // container, so filling that container is the correct default rather
      // than a per-caller override.
      className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="relative w-full" style={{ aspectRatio: CARD_ASPECT }}>
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          sizes={sizes ?? "192px"}
          priority={priority}
          unoptimized={isVectorImage(card.imageUrl)}
          className="object-cover"
        />
      </div>
      <div
        className="flex items-center justify-center gap-1 border-t border-border bg-fill-subtle px-2 text-[11px] font-semibold text-muted-foreground"
        style={{ height: CARD_GRADING_LABEL_HEIGHT }}
      >
        {hasGradingLabel ? (
          <span className="truncate">
            {card.grader} {card.grade}
            {card.certNumber ? ` · ${card.certNumber}` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}
