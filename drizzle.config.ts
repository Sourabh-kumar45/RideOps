import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit settings for `npm run db:push`.
 * `tablesFilter` limits push to the tables this app owns, so any other table in
 * the database (for example an old experiment) is never altered or dropped.
 */
export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  tablesFilter: ["tickets", "gate_checks"],
});
