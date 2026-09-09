import { CardStack } from "./CardStack";
import { HoloCard } from "./HoloCard.client";
import { CARD_HERO_MAX_WIDTH } from "../constants";
import type { CardDTO } from "../types";

type CardHeroProps = {
  fitHeight?: boolean;
  card: CardDTO;
  priority?: boolean;
  flip?: boolean;
};

export function CardHero({ card, priority, flip, fitHeight }: CardHeroProps) {
  return (
    <HoloCard flip={flip} className={fitHeight ? "h-full min-h-0" : undefined}>
      <CardStack
        card={card}
        maxWidth={CARD_HERO_MAX_WIDTH}
        priority={priority}
        flip={flip}
        fitHeight={fitHeight}
      />
    </HoloCard>
  );
}
