import type { CardDTO } from "@/entities/card/types";

export type { OddsDTO, OddsTierDTO } from "@/lib/pull/odds";

export interface MachineDTO {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly unitPriceCents: number;
  readonly status: "active" | "restocking";
}

/** One tile of the "More claw machines" row. */
export interface MoreMachineDTO {
  readonly slug: string;
  readonly name: string;
  readonly unitPriceCents: number;
}

export interface RecentPullDTO {
  readonly pullItemId: string;
  readonly card: CardDTO;
  readonly buyerDisplayName: string;
  readonly pricePaidCents: number;
}

export interface OddsLiveDTO {
  readonly averageValueCents: number;
}
