import "server-only";
import { and, eq, max } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { machines, promoCodes, pulls, users } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { requirePullServerSecret } from "@/lib/env";
import { commit, deriveServerSeed } from "@/lib/pull/fairness";
import { discountCents, subtotalCents, totalCents } from "@/lib/pricing";
import { purchasePointsFor } from "@/lib/points";
import { PROMO_COOKIE_NAME, promoCookieSchema } from "./constants";
import type { CheckoutQuoteDTO, CommitmentDTO, PromoStatus, WalletDTO } from "./types";

export async function getViewerWallet(): Promise<WalletDTO> {
  const userId = await getCurrentUserId();

  const [row] = await db
    .select({
      beezieWalletCents: users.beezieWalletCents,
      externalWalletCents: users.externalWalletCents,
      pointsBalance: users.pointsBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    throw new Error(`No user row for id ${userId}; is the database seeded (pnpm db:reset)?`);
  }

  return row;
}

export async function readAppliedPromo(): Promise<{
  readonly code: string;
  readonly status: PromoStatus;
} | null> {
  const store = await cookies();
  const raw = store.get(PROMO_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = promoCookieSchema.safeParse(parsedRaw);
  return result.success ? result.data : null;
}

export async function getCheckoutQuote(params: {
  readonly quantity: number;
  readonly unitPriceCents: number;
}): Promise<CheckoutQuoteDTO> {
  const applied = await readAppliedPromo();
  const subtotal = subtotalCents(params.unitPriceCents, params.quantity);

  let discount = 0;
  if (applied?.status === "applied") {
    const [promoRow] = await db
      .select({ kind: promoCodes.kind, valueBps: promoCodes.valueBps, valueCents: promoCodes.valueCents })
      .from(promoCodes)
      .where(eq(promoCodes.code, applied.code))
      .limit(1);
    if (promoRow) {
      discount = discountCents(subtotal, promoRow);
    }
  }

  const total = totalCents(subtotal, discount);

  return {
    quantity: params.quantity,
    unitPriceCents: params.unitPriceCents,
    subtotalCents: subtotal,
    discountCents: discount,
    totalCents: total,
    pointsToAward: purchasePointsFor(subtotal),
    ...(applied ? { promoCode: applied.code, promoStatus: applied.status } : {}),
  };
}

export async function getNextCommitment(slug: string): Promise<CommitmentDTO> {
  const userId = await getCurrentUserId();
  const secret = requirePullServerSecret();

  const [machine] = await db.select({ id: machines.id }).from(machines).where(eq(machines.slug, slug)).limit(1);

  if (!machine) {
    throw new Error(`getNextCommitment: no machine for slug ${slug}`);
  }

  const [row] = await db
    .select({ maxNonce: max(pulls.nonceIndex) })
    .from(pulls)
    .where(and(eq(pulls.userId, userId), eq(pulls.machineId, machine.id)));

  const nonceIndex = (row?.maxNonce ?? -1) + 1;
  const serverSeed = deriveServerSeed(secret, userId, machine.id, nonceIndex);

  return { serverSeedHash: commit(serverSeed) };
}
