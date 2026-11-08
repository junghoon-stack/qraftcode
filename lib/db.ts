import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

const globalForSql = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

export const sql = globalForSql.sql ?? (databaseUrl ? postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
}) : null);

if (process.env.NODE_ENV !== "production") globalForSql.sql = sql ?? undefined;

export function database() {
  if (!sql) throw new Error("Database is not configured. Set DATABASE_URL and run the migrations.");
  return sql;
}
