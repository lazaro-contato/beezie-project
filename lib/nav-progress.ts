// No directive: a module-scope counter with a subscription, the same shape
// as `lib/quantity-memory.ts` and `lib/swap-outcome.ts`, and in `lib/` for
// the same reason — islands across three domains start it and one island in
// the layout renders it, and none of them may import each other.

/**
 * How many things are currently worth showing the top progress bar for.
 *
 * A counter rather than a boolean: two navigations can overlap — a link
 * clicked while a Server Action redirect is still in flight — and the bar
 * should finish when the last of them does, not the first.
 *
 * Module scope, so it survives the client-side navigations it exists to
 * describe and dies with the document.
 */
export type NavProgressPhase = "idle" | "loading" | "finishing";

/** How long the completion animation runs before the bar leaves the DOM.
 * Matches `TopProgressBar.module.css`'s finish plus fade. */
const FINISH_MS = 380;

let active = 0;
let phase: NavProgressPhase = "idle";
let finishTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/**
 * The phase lives here rather than in the island because the island may not
 * set state from an effect (`react-hooks/set-state-in-effect`), and the
 * completion is a timed transition that has to outlive the count reaching
 * zero — the bar must reach 100% and fade before it unmounts.
 */
function setPhase(next: NavProgressPhase): void {
  if (phase === next) {
    return;
  }
  phase = next;
  emit();
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function beginNavProgress(): void {
  active += 1;
  if (finishTimer !== null) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
  setPhase("loading");
}

/** Idempotent past zero: a caller that ends twice cannot make the bar owe a
 * begin it never got. */
export function endNavProgress(): void {
  if (active === 0) {
    return;
  }
  active -= 1;
  if (active === 0) {
    finish();
  }
}

/** Used when the URL actually changed, which settles every in-flight
 * navigation at once regardless of who started them. */
export function resetNavProgress(): void {
  if (active === 0) {
    return;
  }
  active = 0;
  finish();
}

function finish(): void {
  setPhase("finishing");
  if (finishTimer !== null) {
    clearTimeout(finishTimer);
  }
  finishTimer = setTimeout(() => {
    finishTimer = null;
    setPhase("idle");
  }, FINISH_MS);
}

export function readNavProgress(): NavProgressPhase {
  return phase;
}

export function subscribeNavProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nothing is in flight during a server render. */
export function serverNavProgress(): NavProgressPhase {
  return "idle";
}
