export function millisecondsUntil(deadlineMs: number): number {
  return deadlineMs - Date.now();
}
