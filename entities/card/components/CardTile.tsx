import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Money } from "@/components/ui/Money";
import { rarityTextClass } from "@/components/ui/RarityChip";
import { CardSlab } from "./CardSlab";
import type { CardDTO } from "../types";

type CardTileProps = {
  card: CardDTO;
  priority?: boolean;
  /**
   * Optional link to the card detail route
   * (`app/claw/[slug]/item/[itemId]/page.tsx`). Opt-in, not automatic: a
   * click "opens the card's screen" only where that reads as a navigation —
   * `TopItems` and `RecentPulls` on the machine page wire this. `SwapSelection`'s
   * multi-reveal grid composes this same tile with no `href`, because a
   * click there selects an item for swap, and a link underneath would fight
   * that selection.
   */
  href?: Route;
};

export function CardTile({ card, priority, href }: CardTileProps) {
  const content = (
    <>
      <CardSlab card={card} priority={priority} sizes="(min-width: 1024px) 12vw, 33vw" />
      <p className="line-clamp-2 text-sm font-medium text-foreground">{card.name}</p>
      <p className={cn("text-xs font-semibold", rarityTextClass(card.tier))}>
        FMV <Money cents={card.fmvCents} />
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex flex-col gap-2">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {content}
    </div>
  );
}
