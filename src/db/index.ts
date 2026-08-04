import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

// Fail fast on a misconfigured deploy rather than starting up and letting every
// query fail at runtime. CI builds run without a database on purpose, so the
// placeholder is only tolerated there.
if (!connectionString && process.env.CI !== "true") {
  throw new Error("DATABASE_URL environment variable is required");
}

// `||` not `??`: an env var set but left blank arrives as "", which `??` would
// pass straight through to neon() and crash. The guard above treats "" as
// missing, so the fallback has to agree.
const sql = neon(
  connectionString || "postgresql://placeholder:placeholder@localhost/placeholder",
);

export const db = drizzle(sql, { schema });

export * from "@/db/schema";
