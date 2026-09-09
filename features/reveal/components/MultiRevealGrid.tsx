import type { Route } from "next";
import { X } from "lucide-react";
import Link from "next/link";
import { Money } from "@/components/ui/Money";
import { CardStack } from "@/entities/card/components/CardStack";
import { CardTile } from "@/entities/card/components/CardTile";
import { millisecondsUntil } from "@/lib/time";
import { HAND_CARD_MAX_WIDTH, REVEAL_PANEL_HEADER_HEIGHT } from "../constants";
import { SwapSelection } from "./SwapSelection.client";
import type { RevealItemDTO, RevealPullDTO } from "../types";

type MultiRevealGridProps = {
  pull: RevealPullDTO;
  /** The machine this pull came from — the panel's close X goes back to it. */
  slug: string;
  clearPullQuantity: () => Promise<void>;
};

export function MultiRevealGrid({ pull, slug, clearPullQuantity }: MultiRevealGridProps) {
  const pendingItems = pull.items.filter((item) => item.status === "pending");
  const resolvedItems = pull.items.filter((item) => item.status !== "pending");
  const expiresInMs = Math.max(0, millisecondsUntil(pull.quoteExpiresAt));
  // `as Route`: `slug` is a plain `string` off the route params, so the
  // template literal cannot narrow to the generated route union on its own —
  // the identical cast `MoreMachines` and `SiteHeader` already carry.
  const closeHref = `/claw/${slug}` as Route;

  const alreadyRevealed = resolvedItems.length > 0;

  const extras = (
    <>
      {resolvedItems.length > 0 ? <ResolvedItemsSection items={resolvedItems} /> : null}
    </>
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col p-4">
      {pendingItems.length > 0 ? (
        <SwapSelection
          pullId={pull.pullId}
          expiresInMs={expiresInMs}
          closeHref={closeHref}
          clearPullQuantity={clearPullQuantity}
          items={pendingItems.map((item) => {
            const faceDown = !alreadyRevealed && Boolean(item.card.backImageUrl);

            return {
              pullItemId: item.pullItemId,
              name: item.card.name,
              swapValueCents: item.swapValueCents,
              faceDown,
              card: <CardStack card={item.card} maxWidth={HAND_CARD_MAX_WIDTH} flip={faceDown} pad={false} />,
            };
          })}
        >
          {extras}
        </SwapSelection>
      ) : (
        // Every item already resolved: there is nothing to turn over and no
        // selection to make, so the island is not rendered at all and this
        // renders the same panel frame around the terminal state. The
        // duplication is deliberate — the alternative is threading a
        // "there is nothing to do" mode through an island whose entire
        // reason to exist is the interaction.
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-inset ring-border">
          <div
            className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6"
            style={{ minHeight: REVEAL_PANEL_HEADER_HEIGHT }}
          >
            <h2 className="text-base font-semibold text-foreground">Your pulls</h2>
            <Link
              href={closeHref}
              aria-label="Close the reveal"
              className="tap-target flex h-6 w-6 items-center justify-center text-secondary-foreground transition-colors hover:text-white"
            >
              <X size={24} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-8 pb-7 pt-5">{extras}</div>
        </div>
      )}
    </div>
  );
}

function ResolvedItemsSection({ items }: { items: readonly RevealItemDTO[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 nav:grid-cols-4">
      {items.map((item) => (
        <div key={item.pullItemId} className="flex flex-col gap-2">
          <CardTile card={item.card} />
          <p className="text-xs font-medium text-muted-foreground">
            {item.status === "swapped" ? (
              <>
                Swapped for <Money cents={item.swapValueCents} className="ml-1" />
              </>
            ) : (
              "Kept"
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
