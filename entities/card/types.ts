import type { Tier } from "@/lib/pull/tiers";

export interface CardDTO {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly backImageUrl?: string;
  readonly tier: Tier;
  readonly tierName: string;
  readonly fmvCents: number;
  readonly grader?: string;
  readonly grade?: string;
  readonly certNumber?: string;
}
