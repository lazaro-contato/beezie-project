import { defineConfig } from "drizzle-kit";
import { ensureDatabaseDir } from "./lib/db/ensure-dir";

const url = process.env.DATABASE_URL ?? "./.data/beezie.db";
ensureDatabaseDir(url);

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url,
  },
});
