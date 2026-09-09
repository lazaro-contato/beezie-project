import type { Route } from "next";
import Link from "next/link";
import { Money } from "@/components/ui/Money";
import { cardGradeLabel, cardYear } from "@/lib/card-facts";
import { CardStack } from "./CardStack";
import { HoloCard } from "./HoloCard.client";
import { CARD_DETAIL_PERSPECTIVE, CARD_DETAIL_Z } from "../constants";
import type { CardDTO } from "../types";

type CardDetailProps = {
  card: CardDTO;
  /** "Top item" / "Recent pull" — which list the viewer opened this from. */
  kindLabel: string;
  /** "Fair market value" / "Pulled for" — the figure's own name. */
  valueLabel: string;
  valueCents: number;
  /** The buyer's display name, for a card opened from the pulls feed. */
  owner?: string;
  /** 1-based, for the "3 of 9" indicator. */
  position: number;
  total: number;
  previousHref: Route;
  nextHref: Route;
  closeHref: Route;
};

const ARROW_CLASS =
  "absolute top-1/2 z-[3] flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-secondary/90 text-foreground ring-1 ring-inset ring-border-2 transition-colors hover:bg-primary hover:text-primary-foreground";

export function CardDetail({
  card,
  kindLabel,
  valueLabel,
  valueCents,
  owner,
  position,
  total,
  previousHref,
  nextHref,
  closeHref,
}: CardDetailProps) {
  const stack = (
    <CardStack
      card={card}
      maxWidth="var(--card-cap)"
      perspective={CARD_DETAIL_PERSPECTIVE}
      detailShadow
      priority
    />
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden p-3 sm:p-6"
      style={{ zIndex: CARD_DETAIL_Z }}
      data-scroll-lock
      role="dialog"
      aria-modal="true"
      aria-label={card.name}
    >
      {/* The backdrop is a link, not a handler — and a sibling of the panel,
          not its parent, so nothing inside the panel has to stop a click
          from reaching it. */}
      <Link href={closeHref} aria-label="Close card" className="fixed inset-0 bg-background/90 backdrop-blur-[30px]" />

      <div className="relative flex max-h-full w-[980px] max-w-full flex-col gap-2 overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-inset ring-border sm:p-5 sm:px-6 sm:pb-6">
        <Link href={previousHref} aria-label="Previous card" className={`${ARROW_CLASS} left-2`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <Link href={nextHref} aria-label="Next card" className={`${ARROW_CLASS} right-2`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        <div className="flex items-center justify-between gap-3 pl-11">
          <span className="text-xs font-semibold text-muted-foreground">
            {position} of {total}
          </span>
          <Link href={closeHref} aria-label="Close card" className="tap-target flex size-6 items-center justify-center text-secondary-foreground transition-colors hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Link>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col gap-4 px-11 pb-1 [--card-cap:min(340px,30dvh)] nav:flex-row nav:items-center nav:gap-8 nav:[--card-cap:min(340px,58dvh)]"
        >
          {/* Always the island. The tilt is a pointer response, not an
              animation — see the note in HoloCard.client.tsx. */}
          <div className="flex min-h-0 flex-1 justify-center nav:basis-1/2">
            <HoloCard>{stack}</HoloCard>
          </div>

          {/* The order the information is actually wanted in: what it is,
              what it is worth, then the provenance. On a phone it is a
              two-column fact grid rather than a stack of rows, which halves
              the height it needs. */}
          <div className="flex shrink-0 flex-col gap-3 nav:basis-1/2 nav:gap-6">
            <span className="self-start rounded-sm bg-secondary px-2 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-border">
              {kindLabel}
            </span>

            <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-white text-pretty nav:line-clamp-none nav:text-[30px] nav:leading-[1.3]">
              {card.name}
            </h2>

            <div className="flex items-baseline gap-2 nav:flex-col nav:items-start nav:gap-2">
              <span className="text-xs font-medium text-secondary-foreground nav:text-sm">{valueLabel}</span>
              <span className="text-3xl font-semibold leading-none text-primary nav:text-5xl">
                <Money cents={valueCents} />
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 nav:flex nav:max-w-[420px] nav:flex-col nav:gap-2.5">
              <Fact label="Year" value={cardYear(card.name)} />
              <Fact label="Grade" value={cardGradeLabel(card.grader, card.grade)} />
              {owner ? <Fact label="Pulled by" value={owner} last /> : null}
            </dl>

            <p className="hidden text-xs font-medium text-muted-foreground nav:block">
              Move your cursor over the card to tilt it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${last ? "" : "border-b border-border pb-2.5"}`}
    >
      <dt className="text-xs font-medium text-secondary-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
