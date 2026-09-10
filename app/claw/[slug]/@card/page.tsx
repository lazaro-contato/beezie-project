import { Suspense } from "react";
import type { Route } from "next";
import { getRecentPulls, getTopItems } from "@/features/machine/queries";
import { preloadCardArt } from "@/entities/card/components/CardArt";
import { CardDetail } from "@/entities/card/components/CardDetail";
import { CARD_DETAIL_IMAGE_SIZES } from "@/entities/card/constants";
import type { CardDTO } from "@/entities/card/types";

// The arrows prefetch this overlay in full on purpose, so a card switch never
// waits on the server; this opts the slot out of the validation that warns about it.
export const instant = false;

/** The search params this slot owns. Everything else on the URL belongs to
 * some other slot and is preserved verbatim by every link built here. */
const CARD_PARAM = "card";
const SOURCE_PARAM = "from";

type SearchParams = Awaited<PageProps<"/claw/[slug]">["searchParams"]>;

/**
 * Which list the viewer opened a card from. It decides three things at
 * once: what `?card=` identifies, what prev/next step through, and what the
 * details column is allowed to say.
 *
 * `pulls` is the live feed, so the id is a `pullItemId` and not an item id
 * — the same card can appear twice in that feed with two different buyers,
 * and only the pull item tells them apart. `top` is the cached pool, where
 * the id is the item's own.
 */
type CardSource = "top" | "pulls";

/** A repeated `?card=` is a malformed URL, not two cards. Take the first. */
function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

function parseSource(raw: string | string[] | undefined): CardSource {
  return first(raw) === "pulls" ? "pulls" : "top";
}

function cardHref(slug: string, sp: SearchParams, next?: { id: string; source: CardSource }): Route {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (key === CARD_PARAM || key === SOURCE_PARAM || value === undefined) {
      continue;
    }
    for (const entry of Array.isArray(value) ? value : [value]) {
      query.append(key, entry);
    }
  }

  if (next) {
    query.set(CARD_PARAM, next.id);
    query.set(SOURCE_PARAM, next.source);
  }

  const search = query.toString();
  // `as Route`: `typedRoutes` types a template literal with an interpolated
  // slug and an arbitrary query string as a string, not as a known route.
  // The same cast `TopItems` and `RecentPulls` already make for their own
  // hrefs.
  return (search ? `/claw/${slug}?${search}` : `/claw/${slug}`) as Route;
}

interface DetailEntry {
  readonly id: string;
  readonly card: CardDTO;
  readonly valueCents: number;
  readonly owner?: string;
}

export default function CardDetailSlot({ params, searchParams }: PageProps<"/claw/[slug]">) {
  return (
    <Suspense fallback={null}>
      <CardDetailResolver params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CardDetailResolver({ params, searchParams }: PageProps<"/claw/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const cardId = first(sp[CARD_PARAM]);
  if (!cardId) {
    return null;
  }

  const source = parseSource(sp[SOURCE_PARAM]);

  const entries = await loadEntries(slug, source);

  const index = entries.findIndex((entry) => entry.id === cardId);
  if (index === -1) {
    return null;
  }

  const entry = entries[index];
  const previous = entries[(index - 1 + entries.length) % entries.length];
  const next = entries[(index + 1) % entries.length];

  // The arrows' targets, downloading before either arrow is pressed.
  preloadCardArt(previous.card.imageUrl, CARD_DETAIL_IMAGE_SIZES);
  preloadCardArt(next.card.imageUrl, CARD_DETAIL_IMAGE_SIZES);

  return (
    <CardDetail
      card={entry.card}
      kindLabel={source === "pulls" ? "Recent pull" : "Top item"}
      valueLabel={source === "pulls" ? "Pulled for" : "Fair market value"}
      valueCents={entry.valueCents}
      owner={entry.owner}
      position={index + 1}
      total={entries.length}
      previousHref={cardHref(slug, sp, { id: previous.id, source })}
      nextHref={cardHref(slug, sp, { id: next.id, source })}
      closeHref={cardHref(slug, sp)}
    />
  );
}

async function loadEntries(slug: string, source: CardSource): Promise<DetailEntry[]> {
  if (source === "pulls") {
    const pulls = await getRecentPulls(slug);
    return pulls.map((pull) => ({
      id: pull.pullItemId,
      card: pull.card,
      valueCents: pull.pricePaidCents,
      owner: pull.buyerDisplayName,
    }));
  }

  const items = await getTopItems(slug);
  return items.map((item) => ({ id: item.id, card: item, valueCents: item.fmvCents }));
}
