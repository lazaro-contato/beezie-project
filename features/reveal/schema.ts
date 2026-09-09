// No directive: pure zod schemas and a shape, not a database read — the
// `features/checkout/schema.ts` precedent — so both `actions.ts`
// (`'use server'`) can import this
// without pulling in a guard either doesn't need.
import { z } from "zod";
import { MAX_PULL_QUANTITY } from "@/lib/pull/limits";

// `newId('pull')`/`newId('pli')` (lib/db/ids.ts) always produce this exact
// shape — a prefix, an underscore, and `crypto.randomUUID()`'s lowercase
// hex. A real pull created through `createPull` can never have any other
// shape, so a payload that doesn't match one is rejected before it reaches
// a query, not three steps later inside a transaction (the `createPullSchema`
// precedent in `features/checkout/schema.ts`).
const PULL_ID_PATTERN = /^pull_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PULL_ITEM_ID_PATTERN = /^pli_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const pullItemSelectionSchema = z.object({
  pullId: z.string().regex(PULL_ID_PATTERN),
  pullItemIds: z
    .array(z.string().regex(PULL_ITEM_ID_PATTERN))
    .min(1)
    .max(MAX_PULL_QUANTITY)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "pullItemIds must not contain duplicates",
    }),
});

export const swapPullItemsSchema = pullItemSelectionSchema;
export const keepPullItemsSchema = pullItemSelectionSchema;

export type PullItemSelectionInput = z.infer<typeof pullItemSelectionSchema>;
