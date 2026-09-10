// No directive: a module-scope phase with a subscription, the same shape as
// `lib/nav-progress.ts`, and in `lib/` for the same reason — the island that
// reads it is remounted by the very navigation it describes, so the phase
// cannot live in component state.

/**
 * Where a machine-to-machine navigation is.
 *
 * `idle` is also what a first load reads, which is what keeps the enter
 * animation off the initial paint: only a click that begins a transition can
 * reach `leaving`, and only `leaving` can reach `entering`.
 */
export type MachineTransitionPhase = "idle" | "leaving" | "entering";

/** Matches `MachineCrossfade.module.css`'s enter animation. */
const ENTER_MS = 260;

/**
 * Restores the page if the click never became a navigation — a route that
 * throws, or a link the router declines. Long enough to cover a cold machine
 * fetch, which is every one of them: sibling params of the segment the router
 * is already on are not prefetched.
 */
const FAILSAFE_MS = 2500;

let phase: MachineTransitionPhase = "idle";
/** The path the transition started from. It lives here, not in the island,
 *  because the island is remounted by the navigation: an origin captured in an
 *  effect would be read back after the URL had already changed, and the
 *  arrival would never be detected. */
let origin: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function setPhase(next: MachineTransitionPhase): void {
  if (phase === next) {
    return;
  }
  phase = next;
  for (const listener of listeners) {
    listener();
  }
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

export function beginMachineTransition(fromPath: string): void {
  clearTimer();
  origin = fromPath;
  setPhase("leaving");
  timer = setTimeout(() => {
    timer = null;
    endMachineTransition();
  }, FAILSAFE_MS);
}

/** Only a transition in flight can be ended: a pathname change that no click
 * started must not animate anything. */
export function endMachineTransition(): void {
  if (phase === "idle") {
    return;
  }
  origin = null;
  clearTimer();
  setPhase("entering");
  timer = setTimeout(() => {
    timer = null;
    setPhase("idle");
  }, ENTER_MS);
}

/** Null once the transition has ended. */
export function readMachineTransitionOrigin(): string | null {
  return origin;
}

export function readMachineTransition(): MachineTransitionPhase {
  return phase;
}

export function subscribeMachineTransition(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nothing is in flight during a server render. */
export function serverMachineTransition(): MachineTransitionPhase {
  return "idle";
}
