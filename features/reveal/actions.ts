"use server";

import { and, eq, inArray, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pullItems, pulls, users } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { swapPointsFor } from "@/lib/points";
import { keepPullItemsSchema, swapPullItemsSchema } from "./schema";
import type { SwapErrorCode, SwapResult } from "./types";

/**
 * Internal control-flow only, thrown *inside* `db.transaction`'s callback so
 * the native `better-sqlite3` wrapper rolls back before it reaches
 * `resolvePullItems`'s own `try`/`catch` — the identical shape
 * `features/checkout/actions.ts`'s `CreatePullError` uses, for the identical
 * reason: never exported, never crosses the action's own boundary as a raw
 * `Error`.
 */
class SwapItemsError extends Error {
  constructor(public readonly code: SwapErrorCode) {
    super(code);
    this.name = "SwapItemsError";
  }
}

async function resolvePullItems(input: unknown, targetStatus: "swapped" | "kept"): Promise<SwapResult> {
  const schema = targetStatus === "swapped" ? swapPullItemsSchema : keepPullItemsSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT" };
  }
  const { pullId, pullItemIds } = parsed.data;
  const userId = await getCurrentUserId();

  try {
    const { creditedCents, count, pointsAwarded } = db.transaction((tx) => {
      const [pull] = tx
        .select({ id: pulls.id, quoteExpiresAt: pulls.quoteExpiresAt })
        .from(pulls)
        .where(and(eq(pulls.id, pullId), eq(pulls.userId, userId)))
        .limit(1)
        .all();

      if (!pull) {
        throw new SwapItemsError("NOT_FOUND");
      }

      const now = new Date();
      if (now.getTime() >= pull.quoteExpiresAt.getTime()) {
        throw new SwapItemsError("QUOTE_EXPIRED");
      }

      const updateResult = tx
        .update(pullItems)
        .set({ status: targetStatus, resolvedAt: now })
        .where(and(eq(pullItems.pullId, pullId), inArray(pullItems.id, pullItemIds), eq(pullItems.status, "pending")))
        .run();

      if (updateResult.changes !== pullItemIds.length) {
        throw new SwapItemsError("STALE_SELECTION");
      }

      if (targetStatus === "kept") {
        return { creditedCents: 0, count: pullItemIds.length, pointsAwarded: 0 };
      }

      const [sumRow] = tx
        .select({ total: sum(pullItems.swapValueCents) })
        .from(pullItems)
        .where(and(eq(pullItems.pullId, pullId), inArray(pullItems.id, pullItemIds)))
        .all();
      const total = Number(sumRow?.total ?? 0);

      // Computed inside the transaction, off the total this transaction
      // itself just summed — never off anything the caller sent.
      const pointsAwarded = swapPointsFor(total);

      const creditResult = tx
        .update(users)
        .set({
          beezieWalletCents: sql`${users.beezieWalletCents} + ${total}`,
          pointsBalance: sql`${users.pointsBalance} + ${pointsAwarded}`,
        })
        .where(eq(users.id, userId))
        .run();

      if (creditResult.changes !== 1) {
        throw new SwapItemsError("INTERNAL");
      }

      return { creditedCents: total, count: pullItemIds.length, pointsAwarded };
    }, { behavior: "immediate" });

    return { ok: true, creditedCents, count, pointsAwarded };
  } catch (error) {
    if (error instanceof SwapItemsError) {
      return { ok: false, code: error.code };
    }
    return { ok: false, code: "INTERNAL" };
  }
}

/**
 * Trades one or more `pending` items for store credit. Called from
 * `RevealActions.tsx`'s own inline `"use server"` action, closed over a
 * fixed `{ pullId, pullItemIds }` payload — there are no form fields to
 * read, only a choice already known at render time — and takes `unknown`
 * regardless: a value closed over inside an inline action is still
 * client-round-tripped input by the time the action runs (it crosses as a
 * serialised Server Action argument, the same as any bound argument would),
 * and `swapPullItemsSchema` validates it on arrival regardless (encryption
 * is not validation).
 */
export async function swapPullItems(input: unknown): Promise<SwapResult> {
  return resolvePullItems(input, "swapped");
}

export async function keepPullItems(input: unknown): Promise<SwapResult> {
  return resolvePullItems(input, "kept");
}
