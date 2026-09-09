import { accessSync, constants, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

/**
 * Where the SQLite file is, and where it can be written.
 *
 * The database is built at deploy time and shipped in the bundle, which on a
 * serverless host is mounted read-only. SQLite writes even to read, so the
 * file is copied once per container into the one writable directory there is.
 *
 * The copy is per container: a pull persists for as long as that container
 * lives and the data returns to the seed on the next cold start. A deployment
 * meant to keep its data points `DATABASE_URL` at a volume, and none of this
 * runs.
 *
 * Paths are built by string, not by `path.resolve`: the bundler treats a
 * computed `resolve()` as a possible dynamic require and refuses to analyse
 * the module. There is no require here, only a data file.
 */
export function resolveDatabasePath(configured: string): string {
  if (configured === ":memory:" || configured.startsWith("file::memory:")) {
    return configured;
  }

  const source = absolute(configured);
  const directory = source.slice(0, source.lastIndexOf("/"));

  if (existsSync(source) && !isWritable(directory)) {
    const writable = `${tmpdir()}/beezie-claw.db`;
    if (!existsSync(writable)) {
      copyFileSync(source, writable);
    }
    return writable;
  }

  try {
    mkdirSync(directory, { recursive: true });
  } catch {
    // Read-only and the file is not there either. Opening it will fail with a
    // message naming the path, which is more useful than failing here.
  }
  return source;
}

function absolute(configured: string): string {
  if (configured.startsWith("/")) {
    return configured;
  }
  const relative = configured.startsWith("./") ? configured.slice(2) : configured;
  return `${process.cwd()}/${relative}`;
}

function isWritable(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
