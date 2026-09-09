import "server-only";
import { createHash, createHmac } from "node:crypto";
import { cumulative, drawTier, uniformInt, type Uint32Source } from "./rng";

/** Derives the per-pull server seed from the secret and the pull's identity. */
export function deriveServerSeed(
  secret: string,
  userId: string,
  machineId: string,
  nonceIndex: number,
): string {
  return createHmac("sha256", secret)
    .update(`${userId}:${machineId}:${nonceIndex}`)
    .digest("hex");
}

/** The commitment: a one-way hash of the server seed, safe to publish. */
export function commit(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest("hex");
}

/**
 * Builds the deterministic uint32 word stream for one draw. The first eight
 * words come directly from a single `HMAC-SHA256(serverSeed,
 * "clientSeed:drawIndex")` digest, sliced into four-byte big-endian words.
 * If a caller (rejection sampling, or a within-tier pick chained onto the
 * same source) needs more than eight words — astronomically unlikely for
 * the weight ranges this project uses — the stream extends itself by
 * re-keying the HMAC on its own last digest, so it stays fully determined
 * by `(serverSeed, clientSeed, drawIndex)` with no additional input.
 */
export function rollStream(
  serverSeed: string,
  clientSeed: string,
  drawIndex: number,
): Uint32Source {
  let digest = createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${drawIndex}`)
    .digest();
  let offset = 0;

  return () => {
    if (offset + 4 > digest.length) {
      digest = createHmac("sha256", serverSeed).update(digest).digest();
      offset = 0;
    }
    const word = digest.readUInt32BE(offset);
    offset += 4;
    return word;
  };
}

/** The fields of a `pulls` row needed to replay and verify its draw. */
export interface VerifiablePull {
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly clientSeed: string;
  readonly tierWeights: readonly number[];
}

/** The fields of one `pullItems` row needed to check it against a replay. */
export interface VerifiablePullItem {
  readonly drawIndex: number;
  readonly rollValue: number;
  readonly tier: number;
}

/**
 * Recomputes `SHA-256(pull.serverSeed) === pull.serverSeedHash` and replays
 * the roll stream against `pull.tierWeights` to reproduce every claimed
 * `(rollValue, tier)` pair. Returns `false` on the first mismatch rather
 * than throwing — a failed verification is an expected outcome to check,
 * not an exceptional one.
 */
export function verifyPull(
  pull: VerifiablePull,
  items: readonly VerifiablePullItem[],
): boolean {
  if (commit(pull.serverSeed) !== pull.serverSeedHash) {
    return false;
  }

  const total = cumulative(pull.tierWeights).at(-1) ?? 0;

  for (const item of items) {
    const source = rollStream(pull.serverSeed, pull.clientSeed, item.drawIndex);
    const roll = uniformInt(source, total);
    if (roll !== item.rollValue) {
      return false;
    }
    if (drawTier(pull.tierWeights, roll) !== item.tier) {
      return false;
    }
  }

  return true;
}
