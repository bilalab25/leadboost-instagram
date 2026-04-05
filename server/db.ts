import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === "production";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 5, // Max connections in the pool
  idleTimeoutMillis: 30_000, // Close idle connections after 30s
  connectionTimeoutMillis: 5_000, // Timeout connecting after 5s
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }, // Required for cloud PostgreSQL (Neon, Supabase, etc.)
});

// Log pool errors (don't crash the server)
pool.on("error", (err) => {
  console.error("[Database] Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });
