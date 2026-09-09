// No directive and no `server-only`: a module-scope store with a
// subscription, which is plain TypeScript and belongs in `lib/` for the same
// reason `lib/machines.ts` does — `features/machine`'s stepper writes it and
// `features/reveal`'s swap panel clears it, and the ESLint zones forbid
// those two importing each other.

const memory = new Map<string, number>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** `undefined` means "nothing chosen yet", which the caller reads as its
 * minimum. Stable between emits, which `useSyncExternalStore` requires. */
export function recallQuantity(slug: string): number | undefined {
  return memory.get(slug);
}

export function rememberQuantity(slug: string, quantity: number): void {
  if (memory.get(slug) === quantity) {
    return;
  }
  memory.set(slug, quantity);
  emit();
}

export function forgetQuantities(): void {
  if (memory.size === 0) {
    return;
  }
  memory.clear();
  emit();
}

export function subscribeQuantity(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The server's snapshot: nothing is remembered before the page loads, so
 * every server render starts at the caller's minimum and hydration matches. */
export function serverQuantitySnapshot(): undefined {
  return undefined;
}
