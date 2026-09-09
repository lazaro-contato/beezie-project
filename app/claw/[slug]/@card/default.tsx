/**
 * The `@card` parallel slot's fallback for any URL under `app/claw/[slug]`
 * that has no matching page in this slot — the same role
 * `@sheet/default.tsx` plays for the payment sheet, and the same reason it
 * has to exist at all: without a `default.tsx`, a slot with no match on a
 * *hard* load is a 404 for the whole route, not an empty slot.
 *
 * Today the tree gives this file nothing to catch: `@card` mirrors
 * `page.tsx` and `pull/[pullId]/page.tsx`, which is every URL under this
 * layout. It is the guard for the next route somebody adds here.
 */
export default function CardSlotDefault() {
  return null;
}
