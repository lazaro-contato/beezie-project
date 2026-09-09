// No directive: a module-scope store with a subscription, the same shape as
// `lib/quantity-memory.ts` and in `lib/` for the same reason — the reveal
// island publishes to it and a layout-level island reads it, and neither may
// import the other.

/** What a completed swap credited, as the confirmation needs to say it. */
export interface SwapOutcome {
  readonly creditedCents: number;
  readonly pointsAwarded: number;
  readonly count: number;
}

let outcome: SwapOutcome | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function readSwapOutcome(): SwapOutcome | null {
  return outcome;
}

export function publishSwapOutcome(next: SwapOutcome): void {
  outcome = next;
  emit();
}

export function clearSwapOutcome(): void {
  if (outcome === null) {
    return;
  }
  outcome = null;
  emit();
}

export function subscribeSwapOutcome(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nothing has been swapped before the page loads, so every server render
 * starts empty and hydration matches. */
export function serverSwapOutcome(): null {
  return null;
}
