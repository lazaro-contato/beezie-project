import { tierForValue } from "@/lib/pull/tiers";
import { DEMO_USER_ID } from "./ids";
import type { items, machines, machineTierWeights, promoCodes, users } from "./schema";
import { CARD_PAIRS, FMV_CENTS_BY_TIER, SEALED_BOX_IMAGE_URL } from "./seed/catalogue";

export type MachineRow = typeof machines.$inferInsert;
export type UserRow = typeof users.$inferInsert;
export type PromoCodeRow = typeof promoCodes.$inferInsert;
export type ItemRow = typeof items.$inferInsert;
export type MachineTierWeightRow = typeof machineTierWeights.$inferInsert;

/**
 * A pull `db:seed` will replay through the real `drawPull` (lib/pull/draw.ts)
 * rather than a table row it can insert directly — the draw is what produces
 * `serverSeed`, `serverSeedHash` and every `pullItems` row. `seed.ts` reads
 * this spec, calls `drawPull`, and inserts the result.
 */
export interface HistoricalPullSpec {
  readonly id: string;
  readonly userId: string;
  readonly machineId: string;
  readonly quantity: number;
  readonly clientSeed: string;
  readonly nonceIndex: number;
  readonly paymentMethod: "beezie_wallet" | "external_wallet" | "card";
  /** Backdated so the recent-pulls feed reads as live activity. */
  readonly createdAt: Date;
}

export interface SeedData {
  readonly machines: readonly MachineRow[];
  readonly machineTierWeights: readonly MachineTierWeightRow[];
  readonly items: readonly ItemRow[];
  readonly users: readonly UserRow[];
  readonly promoCodes: readonly PromoCodeRow[];
  readonly historicalPulls: readonly HistoricalPullSpec[];
}

export const TIER_WEIGHTS_BPS: readonly [number, number, number, number, number] = [
  7505, 2108, 348, 19, 72,
];

// --- machines -------------------------------------------------------------

type MachineKey = "gold" | "silver" | "platinum" | "wildcard";

interface MachineSeed {
  readonly key: MachineKey;
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly unitPriceCents: number;
  readonly pointsPerPull: number;
  readonly setName: string;
  readonly abbr: string;
}

const MACHINE_SEEDS: readonly MachineSeed[] = [
  {
    key: "gold",
    id: "mch_gold",
    slug: "gold-claw",
    name: "Gold Claw",
    description:
      "The flagship cabinet. Highest stakes, the deepest Ultra-Rare pool, and the machine every other row on the page points back to.",
    unitPriceCents: 50_000,
    pointsPerPull: 250,
    setName: "HIVEKIN GILDED",
    abbr: "GLD",
  },
  {
    key: "silver",
    id: "mch_silver",
    slug: "silver-claw",
    name: "Silver Claw",
    description: "A lower entry price for the same pool shape — the machine the payment sheet screenshot is built around.",
    unitPriceCents: 10_000,
    pointsPerPull: 100,
    setName: "HIVEKIN ORIGINS",
    abbr: "SLV",
  },
  {
    key: "platinum",
    id: "mch_platinum",
    slug: "platinum-claw",
    name: "Platinum Claw",
    description: "Same price point as Gold, a distinct card pool. Fills out the More Claw Machines row.",
    unitPriceCents: 50_000,
    pointsPerPull: 275,
    setName: "HIVEKIN PLATINUM",
    abbr: "PLT",
  },
  {
    key: "wildcard",
    id: "mch_wildcard",
    slug: "wildcard-claw",
    name: "Wildcard Claw",
    description: "The cheapest cabinet on the floor, kept in rotation for players who just want a quick pull.",
    unitPriceCents: 3_000,
    pointsPerPull: 30,
    setName: "HIVEKIN WILDCARD",
    abbr: "WLD",
  },
];

function buildMachines(): MachineRow[] {
  return MACHINE_SEEDS.map((seed, index) => ({
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    description: seed.description,
    unitPriceCents: seed.unitPriceCents,
    pointsPerPull: seed.pointsPerPull,
    artworkUrl: "/video/idle-loop-poster.jpg",
    artworkWidth: 800,
    artworkHeight: 800,
    revealDesktopUrl: "/video/reveal-desktop.mp4",
    revealDesktopPosterUrl: "/video/reveal-desktop-poster.jpg",
    revealMobileUrl: "/video/reveal-mobile.mp4",
    revealMobilePosterUrl: "/video/reveal-mobile-poster.jpg",
    status: "active",
    sortOrder: index,
  }));
}

function buildMachineTierWeights(): MachineTierWeightRow[] {
  const rows: MachineTierWeightRow[] = [];
  for (const machine of MACHINE_SEEDS) {
    TIER_WEIGHTS_BPS.forEach((weightBps, tierIndex) => {
      rows.push({ machineId: machine.id, tier: tierIndex + 1, weightBps });
    });
  }
  return rows;
}

// --- items ------------------------------------------------------------

function buildItemsForMachine(machine: MachineSeed, machineOrdinal: number): ItemRow[] {
  const rows: ItemRow[] = [];
  let globalIndex = 0;

  for (const tier of [1, 2, 3, 4, 5] as const) {
    for (const fmvCents of FMV_CENTS_BY_TIER[tier]) {
      const pair = CARD_PAIRS[(globalIndex + machineOrdinal * 8) % CARD_PAIRS.length];
      const derivedTier = tierForValue(fmvCents);

      rows.push({
        id: `itm_${machine.key}_${String(globalIndex + 1).padStart(2, "0")}`,
        machineId: machine.id,
        name: pair.name,
        imageUrl: pair.front,
        backImageUrl: pair.back,
        fmvCents,
        tier: derivedTier,
        grader: pair.grader,
        grade: pair.grade,
        certNumber: pair.certNumber,
        sortOrder: globalIndex,
      });

      globalIndex++;
    }
  }

  const sealed = rows[rows.length - 1];
  rows[rows.length - 1] = {
    ...sealed,
    name: `${machine.setName} Sealed Collector Box`,
    imageUrl: SEALED_BOX_IMAGE_URL,
    backImageUrl: null,
    grader: null,
    grade: null,
    certNumber: null,
  };

  return rows;
}

// --- users --------------------------------------------------------------

function avatarDataUri(initials: string, hue: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="hsl(${hue} 55% 42%)"/>` +
    `<text x="32" y="41" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" ` +
    `font-weight="600" fill="white" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface FakeUserSeed {
  readonly name: string;
  readonly initials: string;
}

// Twelve fake users, no real people. Avatars are inline data URIs generated
// from initials rather than files under public/ — avatar art was never part
// of this phase's asset scope (only card faces and machine artwork were),
// and a data URI can never be a broken path.
const FAKE_USERS: readonly FakeUserSeed[] = [
  { name: "Ava Rivera", initials: "AR" },
  { name: "Marcus Chen", initials: "MC" },
  { name: "Priya Anand", initials: "PA" },
  { name: "Liam O'Connor", initials: "LO" },
  { name: "Sofia Petrova", initials: "SP" },
  { name: "Noah Kim", initials: "NK" },
  { name: "Elena Rossi", initials: "ER" },
  { name: "Diego Alvarez", initials: "DA" },
  { name: "Maya Johnson", initials: "MJ" },
  { name: "Ethan Wright", initials: "EW" },
  { name: "Zara Ali", initials: "ZA" },
  { name: "Lucas Silva", initials: "LS" },
];

function buildUsers(): UserRow[] {
  const demo: UserRow = {
    id: DEMO_USER_ID,
    displayName: "You",
    avatarUrl: avatarDataUri("Y", 205),
    beezieWalletCents: 250_000,
    externalWalletCents: 5_000,
    pointsBalance: 1_250,
  };

  const fake = FAKE_USERS.map((user, index) => ({
    id: `usr_fake${String(index + 1).padStart(2, "0")}`,
    displayName: user.name,
    avatarUrl: avatarDataUri(user.initials, (index * 30) % 360),
    beezieWalletCents: 50_000 + index * 15_000,
    externalWalletCents: 2_000 + index * 500,
    pointsBalance: 100 + index * 80,
  }));

  return [demo, ...fake];
}

// --- promo codes ----------------------------------------------------------

function buildPromoCodes(): PromoCodeRow[] {
  return [
    {
      id: "promo_beezie10",
      code: "BEEZIE10",
      kind: "percent",
      valueBps: 1_000,
      valueCents: null,
      isActive: true,
      expiresAt: null,
      timesRedeemed: 0,
    },
    {
      id: "promo_firstpull",
      code: "FIRSTPULL",
      kind: "fixed",
      valueBps: null,
      valueCents: 2_500,
      isActive: true,
      expiresAt: null,
      timesRedeemed: 0,
    },
    {
      id: "promo_expired",
      code: "EXPIRED",
      kind: "percent",
      valueBps: 1_500,
      valueCents: null,
      isActive: false,
      expiresAt: new Date("2025-01-01T00:00:00.000Z"),
      timesRedeemed: 3,
    },
  ];
}

// --- historical pulls -----------------------------------------------------

// 12 users x 4 machines = 48 possible pairs; take the first 40 in
// (machine, user) order. That means every one of the 12 fake users pulls
// from the first three machines (gold, silver, platinum) and the first four
// users (index 0-3) additionally pull from wildcard — every user and every
// machine appears at least once, and every (userId, machineId) pair in the
// list is distinct, so `nonceIndex = 0` satisfies the pulls table's unique
// constraint for all of them without tracking a running counter per pair.
const HISTORICAL_PULL_COUNT = 40;
const HISTORICAL_SPAN_MS = 46 * 60 * 60 * 1000 + 30 * 60 * 1000; // ~46.5h, inside the 48h window

function buildHistoricalPulls(machineRows: readonly MachineRow[], userRows: readonly UserRow[]): HistoricalPullSpec[] {
  const fakeUserIds = userRows.filter((user) => user.id !== DEMO_USER_ID).map((user) => user.id as string);
  const machineIds = machineRows.map((machine) => machine.id as string);
  const paymentMethods = ["beezie_wallet", "external_wallet", "card"] as const;

  const now = Date.now(); // the sanctioned exception — see the file header.
  const stepMs = Math.floor(HISTORICAL_SPAN_MS / (HISTORICAL_PULL_COUNT - 1));

  const specs: HistoricalPullSpec[] = [];
  outer: for (let m = 0; m < machineIds.length; m++) {
    for (let u = 0; u < fakeUserIds.length; u++) {
      const index = m * fakeUserIds.length + u;
      if (index >= HISTORICAL_PULL_COUNT) break outer;

      specs.push({
        id: `pull_hist_${String(index).padStart(3, "0")}`,
        userId: fakeUserIds[u],
        machineId: machineIds[m],
        quantity: (index % 5) + 1,
        clientSeed: `hist-clientseed-${String(index).padStart(3, "0")}`,
        nonceIndex: 0,
        paymentMethod: paymentMethods[index % paymentMethods.length],
        createdAt: new Date(now - index * stepMs),
      });
    }
  }

  return specs;
}

export function buildSeed(): SeedData {
  const machineRows = buildMachines();
  const userRows = buildUsers();
  const itemRows = MACHINE_SEEDS.flatMap((machine, index) => buildItemsForMachine(machine, index));

  return {
    machines: machineRows,
    machineTierWeights: buildMachineTierWeights(),
    items: itemRows,
    users: userRows,
    promoCodes: buildPromoCodes(),
    historicalPulls: buildHistoricalPulls(machineRows, userRows),
  };
}
