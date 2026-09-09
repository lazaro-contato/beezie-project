import { drawPull, type PoolItem } from "@/lib/pull/draw";
import type { Tier } from "@/lib/pull/tiers";
import { env } from "@/lib/env";
import { purchasePointsFor } from "@/lib/points";
import { db } from "./client";
import {
  items,
  machines,
  machineTierWeights,
  promoCodes,
  pullItems,
  pulls,
  users,
} from "./schema";
import { buildSeed, TIER_WEIGHTS_BPS } from "./seed-data";

const QUOTE_LIFETIME_MS = 15 * 60 * 1000;
const RESOLUTION_DELAY_MS = 5 * 60 * 1000;

function main(): void {
  const seed = buildSeed();

  // Delete in FK-safe order: children before the parents they reference.
  db.delete(pullItems).run();
  db.delete(pulls).run();
  db.delete(items).run();
  db.delete(machineTierWeights).run();
  db.delete(promoCodes).run();
  db.delete(users).run();
  db.delete(machines).run();

  // Insert in FK-safe order: parents before the children that reference
  // them. `buildSeed()` returns readonly arrays (part of keeping it a pure
  // data source); drizzle's `.values()` wants a mutable array, so each is
  // spread into a fresh one here rather than widening the type upstream.
  db.insert(machines).values([...seed.machines]).run();
  db.insert(users).values([...seed.users]).run();
  db.insert(promoCodes).values([...seed.promoCodes]).run();
  db.insert(items).values([...seed.items]).run();
  db.insert(machineTierWeights).values([...seed.machineTierWeights]).run();

  const poolByMachine = new Map<string, PoolItem[]>();
  for (const item of seed.items) {
    const machineId = item.machineId;
    const pool = poolByMachine.get(machineId) ?? [];
    pool.push({
      itemId: item.id as string,
      tier: item.tier as Tier,
      fmvCents: item.fmvCents,
    });
    poolByMachine.set(machineId, pool);
  }

  const machineById = new Map(seed.machines.map((machine) => [machine.id as string, machine]));

  let itemsResolvedCount = 0;

  for (const spec of seed.historicalPulls) {
    const machine = machineById.get(spec.machineId);
    if (!machine) {
      throw new Error(`db:seed: historical pull references unknown machine ${spec.machineId}`);
    }
    const pool = poolByMachine.get(spec.machineId) ?? [];

    // The real draw pipeline, fixed seeds: this is what makes the seed a
    // smoke test of `lib/pull/draw.ts`, not just a batch insert.
    const drawn = drawPull({
      secret: env.PULL_SERVER_SECRET,
      userId: spec.userId,
      machineId: spec.machineId,
      nonceIndex: spec.nonceIndex,
      clientSeed: spec.clientSeed,
      quantity: spec.quantity,
      tierWeights: TIER_WEIGHTS_BPS,
      pool,
    });

    const totalCents = machine.unitPriceCents * spec.quantity;
    const pointsAwarded = purchasePointsFor(machine.unitPriceCents * spec.quantity);
    const quoteExpiresAt = new Date(spec.createdAt.getTime() + QUOTE_LIFETIME_MS);

    db.insert(pulls)
      .values({
        id: spec.id,
        userId: spec.userId,
        machineId: spec.machineId,
        quantity: spec.quantity,
        unitPriceCentsAtPull: machine.unitPriceCents,
        discountCents: 0,
        totalCents,
        pointsAwarded,
        paymentMethod: spec.paymentMethod,
        promoCodeId: null,
        clientSeed: spec.clientSeed,
        serverSeedHash: drawn.serverSeedHash,
        serverSeed: drawn.serverSeed,
        nonceIndex: spec.nonceIndex,
        tierWeightsJson: [...TIER_WEIGHTS_BPS],
        quoteExpiresAt,
        createdAt: spec.createdAt,
      })
      .run();

    for (const drawnItem of drawn.items) {
      // Deterministic, not random: every fifth item across the whole
      // historical set is "kept", every fifth is "swapped", the rest stay
      // "pending" — a fixed rotation over a running counter, so a re-seed
      // reproduces the exact same mix.
      const remainder = itemsResolvedCount % 5;
      const status = remainder === 0 ? "kept" : remainder === 1 ? "swapped" : "pending";
      const resolvedAt =
        status === "pending" ? null : new Date(spec.createdAt.getTime() + RESOLUTION_DELAY_MS);

      db.insert(pullItems)
        .values({
          id: `pli_${spec.id.replace("pull_", "")}_${drawnItem.drawIndex}`,
          pullId: spec.id,
          itemId: drawnItem.itemId,
          drawIndex: drawnItem.drawIndex,
          rollValue: drawnItem.rollValue,
          tier: drawnItem.tier,
          fmvCentsAtPull: drawnItem.fmvCentsAtPull,
          swapValueCents: drawnItem.swapValueCents,
          status,
          resolvedAt,
        })
        .run();

      itemsResolvedCount++;
    }
  }

  console.log(
    `Seeded ${seed.machines.length} machines, ${seed.items.length} items, ` +
      `${seed.users.length} users, ${seed.promoCodes.length} promo codes, ` +
      `${seed.historicalPulls.length} historical pulls (${itemsResolvedCount} pull items).`,
  );

  db.$client.pragma("wal_checkpoint(TRUNCATE)");
  db.$client.close();
}

main();
