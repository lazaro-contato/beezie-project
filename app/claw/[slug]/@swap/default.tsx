/** Without a `default.tsx`, a slot with no match on a hard load is a 404 for
 * the whole route rather than an empty slot. `@swap` mirrors only
 * `page.tsx`, so this is what `/claw/[slug]/pull/[pullId]` renders. */
export default function SwapSlotDefault() {
  return null;
}
