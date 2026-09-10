import "server-only";
import { and, asc, avg, desc, eq, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";
import { items, machines, machineTierWeights, pullItems, pulls, users } from "@/lib/db/schema";
import { computeOdds, type OddsDTO, type TierValueAggregate, type TierWeight } from "@/lib/pull/odds";
import { tierForValue, tierName, type Tier } from "@/lib/pull/tiers";
import type { CardDTO } from "@/entities/card/types";
import { MORE_MACHINES_LIMIT, RECENT_PULLS_LIMIT, TOP_ITEMS_LIMIT } from "./constants";
import type { MachineDTO, MoreMachineDTO, RecentPullDTO } from "./types";

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

export async function getMachineBySlug(slug: string): Promise<MachineDTO | null> {
  "use cache";
  cacheTag(`machine:${slug}`);
  cacheLife("days");

  const [row] = await db
    .select({
      slug: machines.slug,
      name: machines.name,
      description: machines.description,
      unitPriceCents: machines.unitPriceCents,
      status: machines.status,
    })
    .from(machines)
    .where(eq(machines.slug, slug))
    .limit(1);

  return row ?? null;
}

/**
 * The highest-value items in a machine's pool, for the Top items grid.
 * `use cache` + the same per-machine tag as `getMachineBySlug`: this ranks
 * `items.fmvCents` (served by `items_machine_fmv_idx`), a machine-scoped
 * fact rather than a per-viewer one.
 */
export async function getTopItems(slug: string, limit = TOP_ITEMS_LIMIT): Promise<CardDTO[]> {
  "use cache";
  cacheTag(`machine:${slug}`);

  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      imageUrl: items.imageUrl,
      backImageUrl: items.backImageUrl,
      fmvCents: items.fmvCents,
      grader: items.grader,
      grade: items.grade,
      certNumber: items.certNumber,
    })
    .from(items)
    .innerJoin(machines, eq(items.machineId, machines.id))
    // Only items with real photography. The filter is `backImageUrl is not
    // null` rather than a path match, because having two photographed faces
    // is the actual property that separates a graded slab from the sealed
    // collector box's neutral placeholder — a path pattern would be a proxy
    // for it and would break the moment the asset folder is reorganised.
    //
    // This matters beyond tidiness: the box carries the highest FMV in the
    // seed, so it sorted first, opened the detail overlay on itself, and
    // showed a flat SVG with no holo — which reads as "the effect is
    // broken" rather than "this row has no photograph".
    .where(and(eq(machines.slug, slug), isNotNull(items.backImageUrl)))
    .orderBy(desc(items.fmvCents))
    .limit(limit);

  return rows.map(toCardDTO);
}

export async function getMoreMachines(limit = MORE_MACHINES_LIMIT): Promise<MoreMachineDTO[]> {
  "use cache";
  cacheTag("machines:list");

  const rows = await db
    .select({
      slug: machines.slug,
      name: machines.name,
      unitPriceCents: machines.unitPriceCents,
    })
    .from(machines)
    .orderBy(asc(machines.sortOrder))
    .limit(limit);

  return rows;
}

export async function getOdds(slug: string): Promise<OddsDTO> {
  const weightRows = await db
    .select({ tier: machineTierWeights.tier, weightBps: machineTierWeights.weightBps })
    .from(machineTierWeights)
    .innerJoin(machines, eq(machineTierWeights.machineId, machines.id))
    .where(eq(machines.slug, slug))
    .orderBy(desc(machineTierWeights.tier));

  const valueRows = await db
    .select({ tier: items.tier, averageFmvCents: avg(items.fmvCents) })
    .from(items)
    .innerJoin(machines, eq(items.machineId, machines.id))
    .where(eq(machines.slug, slug))
    .groupBy(items.tier);

  const weights: TierWeight[] = weightRows.map((row) => ({
    tier: row.tier as Tier,
    weightBps: row.weightBps,
  }));
  const valueAggregates: TierValueAggregate[] = valueRows.map((row) => ({
    tier: row.tier as Tier,
    averageFmvCents: Number(row.averageFmvCents ?? 0),
  }));

  return computeOdds(weights, valueAggregates);
}

export async function getRecentPulls(slug: string, limit = RECENT_PULLS_LIMIT): Promise<RecentPullDTO[]> {
  const rows = await db
    .select({
      pullItemId: pullItems.id,
      cardId: items.id,
      cardName: items.name,
      cardImageUrl: items.imageUrl,
      cardBackImageUrl: items.backImageUrl,
      cardFmvCents: items.fmvCents,
      cardGrader: items.grader,
      cardGrade: items.grade,
      cardCertNumber: items.certNumber,
      buyerDisplayName: users.displayName,
      pricePaidCents: pulls.unitPriceCentsAtPull,
    })
    .from(pullItems)
    .innerJoin(pulls, eq(pullItems.pullId, pulls.id))
    .innerJoin(machines, eq(pulls.machineId, machines.id))
    .innerJoin(users, eq(pulls.userId, users.id))
    .innerJoin(items, eq(pullItems.itemId, items.id))
    .where(eq(machines.slug, slug))
    .orderBy(desc(pulls.createdAt), asc(pullItems.drawIndex))
    .limit(limit);

  return rows.map((row) => ({
    pullItemId: row.pullItemId,
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
    buyerDisplayName: row.buyerDisplayName,
    pricePaidCents: row.pricePaidCents,
  }));
}
