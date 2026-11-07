// Applies db/migrations/*.sql in order using the `postgres` driver, so migrations
// can run on hosts that do not ship the psql client. Idempotent (all DDL is IF NOT EXISTS).
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const dir = join(process.cwd(), "db", "migrations");
const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
const sql = postgres(url, {
  max: 1,
  prepare: false,
  ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
});

try {
  for (const file of files) {
    const text = await readFile(join(dir, file), "utf8");
    await sql.unsafe(text);
    console.log("applied", file);
  }
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;
  console.log("tables:", tables.map((row) => row.table_name).join(", "));
} finally {
  await sql.end({ timeout: 5 });
}
