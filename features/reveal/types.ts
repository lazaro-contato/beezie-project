export interface MachineMediaDTO {
  readonly desktopUrl: string;
  readonly desktopPosterUrl: string;
  readonly mobileUrl: string;
  readonly mobilePosterUrl: string;
}

export interface RevealSourceDTO {
  readonly src: string;
  readonly poster: string;
}

import type { CardDTO } from "@/entities/card/types";

export type PullItemStatus = "pending" | "swapped" | "kept";

/** One drawn item, as the reveal route may show it. */
export interface RevealItemDTO {
  readonly pullItemId: string;
  readonly card: CardDTO;
  readonly swapValueCents: number;
  readonly status: PullItemStatus;
}

export interface RevealPullDTO {
  readonly pullId: string;
  readonly quoteExpiresAt: number;
  readonly items: readonly RevealItemDTO[];
}

/** One item's replayable draw, for `PullVerification.tsx` only. */
export interface PullVerificationItemDTO {
  readonly drawIndex: number;
  readonly rollValue: number;
  readonly tier: number;
}

export interface PullVerificationDTO {
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly clientSeed: string;
  readonly tierWeights: readonly number[];
  readonly items: readonly PullVerificationItemDTO[];
}

export type SwapErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "QUOTE_EXPIRED" | "STALE_SELECTION" | "INTERNAL";

export type SwapResult =
  | {
      readonly ok: true;
      readonly creditedCents: number;
      readonly count: number;
      readonly pointsAwarded: number;
    }
  | { readonly ok: false; readonly code: SwapErrorCode };
