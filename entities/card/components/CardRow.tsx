import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CARD_ROW_HEIGHT, CARD_ROW_THUMB_SIZE } from "../constants";
import type { CardDTO } from "../types";
import { isVectorImage } from "@/lib/image";

type CardRowProps = {
  card: CardDTO;
  secondaryLabel: string;
  /** e.g. the price paid, as a `<Money>` element — same reasoning. */
  trailing: ReactNode;
  /** Optional link to the card detail route — see `CardTile`'s identical
   * prop for the opt-in reasoning. Wired only from `RecentPulls`. */
  href?: Route;
};

export function CardRow({ card, secondaryLabel, trailing, href }: CardRowProps) {
  const content = (
    <>
      <div
        className="relative shrink-0 overflow-hidden rounded-md bg-fill-subtle"
        style={{ width: CARD_ROW_THUMB_SIZE, height: CARD_ROW_THUMB_SIZE }}
      >
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          sizes={`${CARD_ROW_THUMB_SIZE}px`}
          unoptimized={isVectorImage(card.imageUrl)}
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium text-foreground">{card.name}</p>
        <p className="truncate text-xs text-muted-foreground">{secondaryLabel}</p>
      </div>
      <div className="shrink-0 text-sm font-semibold text-foreground">{trailing}</div>
    </>
  );

  const rowClassName = "flex items-center gap-3 border-b border-border last:border-b-0";

  if (href) {
    return (
      <Link href={href} className={cn(rowClassName, "transition-colors hover:bg-fill-subtle/50")} style={{ height: CARD_ROW_HEIGHT }}>
        {content}
      </Link>
    );
  }

  return (
    <div className={rowClassName} style={{ height: CARD_ROW_HEIGHT }}>
      {content}
    </div>
  );
}
