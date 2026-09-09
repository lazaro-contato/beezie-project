import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "@/lib/env";
import * as schema from "./schema";
import { resolveDatabasePath } from "./location";

function connect() {
  const sqlite = new Database(resolveDatabasePath(env.DATABASE_URL));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

// Inferred rather than annotated: the seed reaches through to `$client` for a
// WAL checkpoint, and a hand-written type drops it.
type Db = ReturnType<typeof connect>;

let instance: Db | null = null;

/**
 * Connected on first use, not on import.
 *
 * `next build` imports every route module to read its exports before it
 * renders anything. Opening the database at module scope made that phase
 * depend on the file already existing, and a failure there surfaces as
 * "Failed to collect page data" with no mention of SQLite. Deferring it means
 * an import costs nothing and a genuine connection problem is reported by the
 * query that needed it.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, property) {
    instance ??= connect();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
