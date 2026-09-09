import "server-only";
import { z } from "zod";

// A fixed dev secret so a fresh clone runs without a `.env` file. Permitted
// only outside production — see the `superRefine` below — because a
// production deploy signing pull commitments with a public string is a
// silent integrity hole, not a convenience.
const DEV_DEFAULT_PULL_SERVER_SECRET =
  "dev-only-pull-server-secret-do-not-use-in-production!!";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1).default("./.data/beezie.db"),
    PULL_SERVER_SECRET: z
      .string()
      .min(32)
      .default(DEV_DEFAULT_PULL_SERVER_SECRET),
  });

export const env = envSchema.parse({
  // `|| undefined`: a host panel stores an unset variable as an empty
  // string, and a zod `.default()` only fills in for `undefined` — an empty
  // `DATABASE_URL` would fail `.min(1)` and refuse to boot.
  NODE_ENV: process.env.NODE_ENV || undefined,
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  PULL_SERVER_SECRET: process.env.PULL_SERVER_SECRET || undefined,
});

export function requirePullServerSecret(): string {
  if (
    env.NODE_ENV === "production" &&
    env.PULL_SERVER_SECRET === DEV_DEFAULT_PULL_SERVER_SECRET
  ) {
    throw new Error(
      "PULL_SERVER_SECRET must be set to a real secret in production; the dev default is not permitted.",
    );
  }
  return env.PULL_SERVER_SECRET;
}
