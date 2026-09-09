import { z } from "zod";

export const PREFS_COOKIE_NAME = "beezie_prefs";

export const prefsSchema = z.object({
  muted: z.boolean(),
  /** Skip straight to the reveal route without waiting for the video. */
  skipReveal: z.boolean(),
  reducedMotion: z.boolean(),
});

export type Prefs = z.infer<typeof prefsSchema>;

export const DEFAULT_PREFS: Prefs = {
  muted: false,
  skipReveal: false,
  reducedMotion: false,
};

export const PREFS_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365, // one year
  path: "/",
};

/**
 * Parses a raw cookie value into `Prefs`, falling back to `DEFAULT_PREFS`
 * for anything missing, malformed or absent. Never throws: an unparseable
 * preferences cookie must never break the page that reads it.
 */
export function parsePrefs(raw: string | undefined): Prefs {
  if (!raw) {
    return DEFAULT_PREFS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = prefsSchema.safeParse(parsed);
    return result.success ? result.data : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
