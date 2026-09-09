import { defineConfig } from "drizzle-kit";
import { ensureDatabaseDir } from "./lib/db/ensure-dir";

// `||`, not `??`: a host panel stores an unset variable as an empty string,
// which `??` would pass through as a valid path.
const url = process.env.DATABASE_URL || "./.data/beezie.db";
ensureDatabaseDir(url);

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url,
  },
});
