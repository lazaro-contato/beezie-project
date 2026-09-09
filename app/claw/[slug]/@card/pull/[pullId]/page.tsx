/**
 * Renders nothing, and its existence is the entire point — the same
 * mechanism, for the same reason, as `@sheet/pull/[pullId]/page.tsx`.
 *
 * On a *soft* navigation an unmatched parallel slot keeps rendering
 * whatever it last rendered rather than swapping to `default.tsx`. Without
 * this file, a card detail overlay left open on the machine page would
 * still be mounted over the reveal after the push to `/pull/[pullId]` — a
 * `role="dialog"` with a full-bleed backdrop, sitting on top of the card
 * the user just pulled.
 *
 * It performs no read of its own: `@card/page.tsx` owns the one read this
 * slot needs, and only on the URL where the overlay can actually be open.
 */
export default function CardSlotPullDefault() {
  return null;
}
