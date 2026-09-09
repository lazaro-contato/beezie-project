import { Money } from "@/components/ui/Money";
import { CardArt } from "@/entities/card/components/CardArt";
import { CARD_ASPECT } from "@/entities/card/constants";
import { PULL_PREVIEW_CARD_WIDTH } from "../pull-stage";
import type { CardDTO } from "@/entities/card/types";

type PullPreviewCardProps = {
  card: CardDTO;
};

export function PullPreviewCard({ card }: PullPreviewCardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-3.5">
      <div
        className="w-full rounded-md border border-border bg-card p-5"
        style={{ maxWidth: PULL_PREVIEW_CARD_WIDTH }}
      >
        <div className="relative w-full" style={{ aspectRatio: CARD_ASPECT }}>
          <CardArt src={card.imageUrl} alt={card.name} sizes={`${PULL_PREVIEW_CARD_WIDTH}px`} />
        </div>
      </div>
      <p className="rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
        Approx market value: <Money cents={card.fmvCents} />
      </p>
    </div>
  );
}
