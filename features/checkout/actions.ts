"use server";

import { and, asc, eq, gt, gte, isNull, max, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { purchasePointsFor } from "@/lib/points";
import { db } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import { items, machines, machineTierWeights, promoCodes, pullItems, pulls, users } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { requirePullServerSecret } from "@/lib/env";
import { drawPull, type PoolItem } from "@/lib/pull/draw";
import type { Tier } from "@/lib/pull/tiers";
import { discountCents, subtotalCents, totalCents } from "@/lib/pricing";
import {
  PROMO_COOKIE_NAME,
  PROMO_COOKIE_OPTIONS,
  PULL_QUANTITY_COOKIE_NAME,
  PULL_QUANTITY_COOKIE_OPTIONS,
  QUOTE_TTL_MS,
  promoCookieSchema,
} from "./constants";
import { applyPromoSchema, createPullSchema } from "./schema";
import { MAX_PULL_QUANTITY, MIN_PULL_QUANTITY } from "@/lib/pull/limits";
import type { CreatePullErrorCode, CreatePullResult, PromoStatus } from "./types";

class CreatePullError extends Error {
  constructor(public readonly code: CreatePullErrorCode) {
    super(code);
    this.name = "CreatePullError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

export async function createPull(input: unknown): Promise<CreatePullResult> {
  const parsed = createPullSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT" };
  }
  const { slug, quantity, paymentMethod, clientSeed, expectedTotalCents } = parsed.data;

  const userId = await getCurrentUserId();
  const secret = requirePullServerSecret();

  const store = await cookies();
  const promoRaw = store.get(PROMO_COOKIE_NAME)?.value;
  let promoCodeFromCookie: string | null = null;
  if (promoRaw) {
    try {
      const result = promoCookieSchema.safeParse(JSON.parse(promoRaw));
      if (result.success) {
        promoCodeFromCookie = result.data.code;
      }
    } catch {
      promoCodeFromCookie = null;
    }
  }

  const effectiveClientSeed = clientSeed ?? crypto.randomUUID();

  try {
    const pullId = db.transaction((tx) => {
      const [machine] = tx
        .select({
          id: machines.id,
          unitPriceCents: machines.unitPriceCents,
          status: machines.status,
        })
        .from(machines)
        .where(eq(machines.slug, slug))
        .limit(1)
        .all();

      if (!machine || machine.status !== "active") {
        throw new CreatePullError("MACHINE_UNAVAILABLE");
      }

      const weightRows = tx
        .select({ weightBps: machineTierWeights.weightBps })
        .from(machineTierWeights)
        .where(eq(machineTierWeights.machineId, machine.id))
        .orderBy(asc(machineTierWeights.tier))
        .all();
      const tierWeights = weightRows.map((row) => row.weightBps);

      const poolRows = tx
        .select({ id: items.id, tier: items.tier, fmvCents: items.fmvCents })
        .from(items)
        .where(eq(items.machineId, machine.id))
        .all();
      const pool: PoolItem[] = poolRows.map((row) => ({
        itemId: row.id,
        tier: row.tier as Tier,
        fmvCents: row.fmvCents,
      }));

      const [nonceRow] = tx
        .select({ maxNonce: max(pulls.nonceIndex) })
        .from(pulls)
        .where(and(eq(pulls.userId, userId), eq(pulls.machineId, machine.id)))
        .all();
      const nonceIndex = (nonceRow?.maxNonce ?? -1) + 1;

      const subtotal = subtotalCents(machine.unitPriceCents, quantity);

      let promoRow: { id: string; kind: "percent" | "fixed"; valueBps: number | null; valueCents: number | null } | null =
        null;
      if (promoCodeFromCookie) {
        const now = new Date();
        const [row] = tx
          .select({
            id: promoCodes.id,
            kind: promoCodes.kind,
            valueBps: promoCodes.valueBps,
            valueCents: promoCodes.valueCents,
          })
          .from(promoCodes)
          .where(
            and(
              eq(promoCodes.code, promoCodeFromCookie),
              eq(promoCodes.isActive, true),
              or(isNull(promoCodes.expiresAt), gt(promoCodes.expiresAt, now)),
            ),
          )
          .limit(1)
          .all();
        promoRow = row ?? null;
      }

      const discount = discountCents(subtotal, promoRow);
      const total = totalCents(subtotal, discount);

      if (total > expectedTotalCents) {
        throw new CreatePullError("PRICE_CHANGED");
      }

      const points = purchasePointsFor(subtotal);

      const debitResult =
        paymentMethod === "beezie_wallet"
          ? tx
              .update(users)
              .set({ beezieWalletCents: sql`${users.beezieWalletCents} - ${total}` })
              .where(and(eq(users.id, userId), gte(users.beezieWalletCents, total)))
              .run()
          : tx
              .update(users)
              .set({ externalWalletCents: sql`${users.externalWalletCents} - ${total}` })
              .where(and(eq(users.id, userId), gte(users.externalWalletCents, total)))
              .run();

      if (debitResult.changes !== 1) {
        const [userRow] = tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1).all();
        if (!userRow) {
          throw new CreatePullError("INTERNAL");
        }
        throw new CreatePullError("INSUFFICIENT_FUNDS");
      }

      const drawn = drawPull({
        secret,
        userId,
        machineId: machine.id,
        nonceIndex,
        clientSeed: effectiveClientSeed,
        quantity,
        tierWeights,
        pool,
      });

      const newPullId = newId("pull");
      const quoteExpiresAt = new Date(Date.now() + QUOTE_TTL_MS);

      tx.insert(pulls)
        .values({
          id: newPullId,
          userId,
          machineId: machine.id,
          quantity,
          unitPriceCentsAtPull: machine.unitPriceCents,
          discountCents: discount,
          totalCents: total,
          pointsAwarded: points,
          paymentMethod,
          promoCodeId: promoRow?.id ?? null,
          clientSeed: effectiveClientSeed,
          serverSeedHash: drawn.serverSeedHash,
          serverSeed: drawn.serverSeed,
          nonceIndex,
          tierWeightsJson: tierWeights,
          quoteExpiresAt,
        })
        .run();

      tx.insert(pullItems)
        .values(
          drawn.items.map((item) => ({
            id: newId("pli"),
            pullId: newPullId,
            itemId: item.itemId,
            drawIndex: item.drawIndex,
            rollValue: item.rollValue,
            tier: item.tier,
            fmvCentsAtPull: item.fmvCentsAtPull,
            swapValueCents: item.swapValueCents,
            status: "pending" as const,
          })),
        )
        .run();

      tx.update(users)
        .set({ pointsBalance: sql`${users.pointsBalance} + ${points}` })
        .where(eq(users.id, userId))
        .run();

      if (promoRow) {
        tx.update(promoCodes)
          .set({ timesRedeemed: sql`${promoCodes.timesRedeemed} + 1` })
          .where(eq(promoCodes.id, promoRow.id))
          .run();
      }

      return newPullId;
    }, { behavior: "immediate" });

    return { ok: true, pullId };
  } catch (error) {
    if (error instanceof CreatePullError) {
      return { ok: false, code: error.code };
    }
    if (isUniqueConstraintError(error)) {
      return { ok: false, code: "CONFLICT" };
    }
    return { ok: false, code: "INTERNAL" };
  }
}

export async function applyPromo(formData: FormData): Promise<void> {
  const result = applyPromoSchema.safeParse({
    intent: formData.get("intent") ?? undefined,
    code: formData.get("code") ?? undefined,
  });

  if (!result.success) {
    return;
  }

  const store = await cookies();

  if (result.data.intent === "clear") {
    store.delete(PROMO_COOKIE_NAME);
    return;
  }

  const code = (result.data.code ?? "").trim().toUpperCase();
  const now = new Date();

  const [row] = await db
    .select({ isActive: promoCodes.isActive, expiresAt: promoCodes.expiresAt })
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);

  let status: PromoStatus;
  if (!row) {
    status = "invalid";
  } else if (!row.isActive) {
    status = "inactive";
  } else if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) {
    status = "expired";
  } else {
    status = "applied";
  }

  store.set(PROMO_COOKIE_NAME, JSON.stringify({ code, status }), PROMO_COOKIE_OPTIONS);
}

const openCheckoutSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  quantity: z.coerce.number().int().min(MIN_PULL_QUANTITY).max(MAX_PULL_QUANTITY),
});

export async function openCheckout(formData: FormData): Promise<void> {
  const parsed = openCheckoutSchema.safeParse({
    slug: formData.get("slug"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    const slug = String(formData.get("slug") ?? "");
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return;
    }
    const store = await cookies();
    store.set(PULL_QUANTITY_COOKIE_NAME, String(MIN_PULL_QUANTITY), PULL_QUANTITY_COOKIE_OPTIONS);
    redirect(`/claw/${slug}?checkout=1`);
  }

  const store = await cookies();
  store.set(
    PULL_QUANTITY_COOKIE_NAME,
    String(parsed.data.quantity),
    PULL_QUANTITY_COOKIE_OPTIONS,
  );
  redirect(`/claw/${parsed.data.slug}?checkout=1`);
}

const finishPullSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  swapped: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
});

export async function clearPullQuantity(): Promise<void> {
  const store = await cookies();
  store.delete(PULL_QUANTITY_COOKIE_NAME);
}

export async function finishPull(formData: FormData): Promise<void> {
  const parsed = finishPullSchema.safeParse({
    slug: formData.get("slug"),
    swapped: formData.get("swapped") ?? undefined,
  });
  if (!parsed.success) {
    return;
  }

  const store = await cookies();
  store.delete(PULL_QUANTITY_COOKIE_NAME);

  revalidatePath(`/claw/${parsed.data.slug}`);
  redirect(
    parsed.data.swapped
      ? `/claw/${parsed.data.slug}?swapped=${encodeURIComponent(parsed.data.swapped)}`
      : `/claw/${parsed.data.slug}`,
  );
}
