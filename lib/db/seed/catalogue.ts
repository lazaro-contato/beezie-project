import type { Tier } from "@/lib/pull/tiers";

/** The card artwork the seed draws from, and the fair-market values each tier
 *  is allowed to take. Data only: `seed-data.ts` decides how it is dealt. */
export interface CardPair {
  readonly front: string;
  readonly back: string;
  readonly name: string;
  readonly grader: string;
  readonly grade: string;
  readonly certNumber: string;
}

export const CARD_PAIRS: readonly CardPair[] = [
  {
    front: "/img/cards/tcg/1-front.webp",
    back: "/img/cards/tcg/1-back.webp",
    name: "1996 P.M. Japanese Basic Charizard-Holo #6",
    grader: "PSA",
    grade: "9",
    certNumber: "111979129",
  },
  {
    front: "/img/cards/tcg/2-front.webp",
    back: "/img/cards/tcg/2-back.webp",
    name: "2001 Pokémon Southern Islands Togepi #4 Reverse Holo",
    grader: "CGC",
    grade: "8.5",
    certNumber: "6006212020",
  },
  {
    front: "/img/cards/tcg/3-front.webp",
    back: "/img/cards/tcg/3-back.webp",
    name: "2021 Pokémon Japanese VMAX Climax Charizard #187 Character Rare",
    grader: "CGC",
    grade: "9",
    certNumber: "1401044776010",
  },
  {
    front: "/img/cards/tcg/4-front.webp",
    back: "/img/cards/tcg/4-back.webp",
    name: "2021 Pokémon Celebrations Mew #025 Full Art",
    grader: "PSA",
    grade: "10",
    certNumber: "68796700",
  },
  {
    front: "/img/cards/tcg/5-front.webp",
    back: "/img/cards/tcg/5-back.webp",
    name: "2024 Pokémon Trick or Trade BOOster Gengar #057 Cosmos Holo",
    grader: "CGC",
    grade: "10",
    certNumber: "6034089139",
  },
];

export const SEALED_BOX_IMAGE_URL = "/img/cards/card-01.svg";

const BASE_FMV_CENTS: readonly number[] = [
  25_000, 25_200, 25_500, 26_000, 26_500, 27_000, 27_500, 28_000, 28_500, 29_500, 30_500, 30_800,
]; // 12 — tier 1, band [25000, 50000], mean $275
const COMMON_FMV_CENTS: readonly number[] = [
  50_500, 52_000, 54_000, 56_000, 58_000, 61_000, 65_000, 70_000, 73_500,
]; // 9 — tier 2, band [50001, 150000], mean $600
const UNCOMMON_FMV_CENTS: readonly number[] = [155_000, 175_000, 200_000, 225_000, 245_000]; // 5 — tier 3, mean $2000
const RARE_FMV_CENTS: readonly number[] = [580_000, 720_000]; // 2 — tier 4
const ULTRA_FMV_CENTS: readonly number[] = [950_000, 1_680_000]; // 2 — tier 5

export const FMV_CENTS_BY_TIER: Readonly<Record<Tier, readonly number[]>> = {
  1: BASE_FMV_CENTS,
  2: COMMON_FMV_CENTS,
  3: UNCOMMON_FMV_CENTS,
  4: RARE_FMV_CENTS,
  5: ULTRA_FMV_CENTS,
};
