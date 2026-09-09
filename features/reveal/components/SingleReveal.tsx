import type { Route } from "next";
import { ChevronsLeftRight, X } from "lucide-react";
import Link from "next/link";
import { Money } from "@/components/ui/Money";
import { CardHero } from "@/entities/card/components/CardHero";
import { millisecondsUntil } from "@/lib/time";
import { RevealActions } from "./RevealActions";
import styles from "./SingleReveal.module.css";
import type { RevealPullDTO } from "../types";

type SingleRevealProps = {
  pull: RevealPullDTO;
  /** The machine this pull came from — the panel's close X goes back to it. */
  slug: string;
  finishPull: (formData: FormData) => Promise<void>;
};

export function SingleReveal({ pull, slug, finishPull }: SingleRevealProps) {
  const [item] = pull.items;
  const expired = millisecondsUntil(pull.quoteExpiresAt) <= 0;
  const faceDown = item.status === "pending" && Boolean(item.card.backImageUrl);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-4">
      <div className={`${styles.panel} flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-inset ring-border`}>
        <div className="flex shrink-0 justify-end" style={{ minHeight: 24 }}>
          <Link
            href={`/claw/${slug}` as Route}
            aria-label="Close the reveal"
            className="tap-target flex h-6 w-6 items-center justify-center text-secondary-foreground transition-colors hover:text-white"
          >
            <X size={24} aria-hidden="true" />
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6">
          <div className={styles.body}>
            <div className={styles.cardCell}>
              <CardHero card={item.card} priority flip={faceDown} fitHeight />
            </div>

            <div className={styles.info}>
              <div className={styles.faceDown}>
                <p className="text-xl font-semibold leading-snug text-white text-pretty sm:text-[28px] sm:leading-[1.3] nav:text-[36px]">
                  Your pull is face down
                </p>
                <p className="text-sm font-medium leading-relaxed text-secondary-foreground text-pretty sm:text-base sm:leading-[1.7]">
                  Click and drag the card sideways to flip it and reveal what you pulled.
                </p>
                <p className="inline-flex items-center gap-2 self-start rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-inset ring-border sm:px-3.5 sm:py-2 sm:text-[13px]">
                  <ChevronsLeftRight size={16} aria-hidden="true" />
                  Drag to reveal
                </p>
              </div>

              <div className={styles.faceUp}>
                <h2 className="line-clamp-3 text-xl font-semibold leading-snug text-white text-pretty short:line-clamp-2 sm:line-clamp-none sm:text-[28px] sm:leading-[1.4] nav:text-[36px]">
                  {item.card.name}
                </h2>
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs font-medium text-secondary-foreground sm:text-base sm:leading-[1.7]">Swap value</p>
                  <p className="text-[32px] font-semibold leading-none text-primary sm:text-[44px] nav:text-[60px] nav:leading-[60px]">
                    <Money cents={item.swapValueCents} />
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <RevealActions pullId={pull.pullId} item={item} expired={expired} slug={slug} finishPull={finishPull} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
