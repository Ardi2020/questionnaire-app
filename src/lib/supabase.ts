// Migrated from Supabase → Neon Serverless Postgres
import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("Missing POSTGRES_URL environment variable.");
  return neon(url);
}
