import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { items, machines, pullItems, pulls } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { tierForValue, tierName } from "@/lib/pull/tiers";
import type { CardDTO } from "@/entities/card/types";
import type { PullVerificationDTO, RevealPullDTO } from "./types";

interface CardSourceRow {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly backImageUrl: string | null;
  readonly fmvCents: number;
  readonly grader: string | null;
  readonly grade: string | null;
  readonly certNumber: string | null;
}

function toCardDTO(row: CardSourceRow): CardDTO {
  const tier = tierForValue(row.fmvCents);
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    backImageUrl: row.backImageUrl ?? undefined,
    tier,
    tierName: tierName(tier),
    fmvCents: row.fmvCents,
    grader: row.grader ?? undefined,
    grade: row.grade ?? undefined,
    certNumber: row.certNumber ?? undefined,
  };
}

export async function getPull({ pullId, slug }: { pullId: string; slug: string }): Promise<RevealPullDTO | null> {
  const userId = await getCurrentUserId();

  const rows = await db
    .select({
      quoteExpiresAt: pulls.quoteExpiresAt,
      pullItemId: pullItems.id,
      drawIndex: pullItems.drawIndex,
      status: pullItems.status,
      swapValueCents: pullItems.swapValueCents,
      cardId: items.id,
      cardName: items.name,
      cardImageUrl: items.imageUrl,
      cardBackImageUrl: items.backImageUrl,
      cardFmvCents: items.fmvCents,
      cardGrader: items.grader,
      cardGrade: items.grade,
      cardCertNumber: items.certNumber,
    })
    .from(pulls)
    .innerJoin(machines, eq(pulls.machineId, machines.id))
    .innerJoin(pullItems, eq(pullItems.pullId, pulls.id))
    .innerJoin(items, eq(pullItems.itemId, items.id))
    .where(and(eq(pulls.id, pullId), eq(pulls.userId, userId), eq(machines.slug, slug)))
    .orderBy(asc(pullItems.drawIndex));

  if (rows.length === 0) {
    return null;
  }

  return {
    pullId,
    quoteExpiresAt: rows[0].quoteExpiresAt.getTime(),
    items: rows.map((row) => ({
      pullItemId: row.pullItemId,
      swapValueCents: row.swapValueCents,
      status: row.status,
      card: toCardDTO({
        id: row.cardId,
        name: row.cardName,
        imageUrl: row.cardImageUrl,
        backImageUrl: row.cardBackImageUrl,
        fmvCents: row.cardFmvCents,
        grader: row.cardGrader,
        grade: row.cardGrade,
        certNumber: row.cardCertNumber,
      }),
    })),
  };
}

export async function getPullVerification({ pullId }: { pullId: string }): Promise<PullVerificationDTO | null> {
  const userId = await getCurrentUserId();

  const [pullRow] = await db
    .select({
      serverSeed: pulls.serverSeed,
      serverSeedHash: pulls.serverSeedHash,
      clientSeed: pulls.clientSeed,
      tierWeights: pulls.tierWeightsJson,
    })
    .from(pulls)
    .where(and(eq(pulls.id, pullId), eq(pulls.userId, userId)))
    .limit(1);

  if (!pullRow) {
    return null;
  }

  const itemRows = await db
    .select({
      drawIndex: pullItems.drawIndex,
      rollValue: pullItems.rollValue,
      tier: pullItems.tier,
    })
    .from(pullItems)
    .where(eq(pullItems.pullId, pullId))
    .orderBy(asc(pullItems.drawIndex));

  return {
    serverSeed: pullRow.serverSeed,
    serverSeedHash: pullRow.serverSeedHash,
    clientSeed: pullRow.clientSeed,
    tierWeights: pullRow.tierWeights,
    items: itemRows,
  };
}
