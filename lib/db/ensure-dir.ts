import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * better-sqlite3 will create the database file but not the directory holding
 * it, so a fresh clone — where `.data/` is gitignored and therefore absent —
 * fails with "Cannot open database because the directory does not exist"
 * before any SQL runs.
 *
 * Both entry points that open the database call this first: `lib/db/client.ts`
 * for the app and the seed, and `drizzle.config.ts` for `db:push`. They cannot
 * share the call site because drizzle-kit runs out-of-process and must not
 * import a `server-only` module, so this file carries no directive.
 */
export function ensureDatabaseDir(dbPath: string): void {
  if (dbPath === ":memory:" || dbPath.startsWith("file::memory:")) return;
  mkdirSync(dirname(dbPath), { recursive: true });
}
