/**
 * Shared Drizzle client over Neon's HTTP driver.
 *
 * The HTTP driver suits serverless hosting (Vercel): no connection pool to
 * manage. Multi-statement writes use `db.batch`, which runs atomically.
 *
 * `cache: "no-store"` matters: Neon queries are `fetch` calls, and Next.js
 * would otherwise store their responses in its data cache, so reads would
 * keep returning old rows after a write.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");

export const db = drizzle(neon(url, { fetchOptions: { cache: "no-store" } }), { schema });
