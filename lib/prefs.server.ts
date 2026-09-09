import "server-only";
import { cookies } from "next/headers";
import {
  PREFS_COOKIE_NAME,
  PREFS_COOKIE_OPTIONS,
  parsePrefs,
  type Prefs,
} from "@/lib/prefs";

/**
 * Reads and parses the preferences cookie. Never throws — an unparseable or
 * absent cookie falls back to defaults via `parsePrefs`.
 */
export async function readPrefs(): Promise<Prefs> {
  const store = await cookies();
  return parsePrefs(store.get(PREFS_COOKIE_NAME)?.value);
}

export async function writePrefs(patch: Partial<Prefs>): Promise<void> {
  const store = await cookies();
  const current = parsePrefs(store.get(PREFS_COOKIE_NAME)?.value);
  const next: Prefs = { ...current, ...patch };
  store.set(PREFS_COOKIE_NAME, JSON.stringify(next), PREFS_COOKIE_OPTIONS);
}
