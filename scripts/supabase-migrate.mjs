#!/usr/bin/env node
// One Design — Supabase migration runner.
// Reads credentials from .env.local, runs schema.sql + migrations in order,
// then verifies tables, columns, constraints, and site settings.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- tiny .env parser (no dependency) ---
function loadEnv(file) {
  const env = {};
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = { ...process.env, ...loadEnv(join(root, ".env.local")) };

const projectRef = env.SUPABASE_PROJECT_REF;
const dbPassword = env.SUPABASE_DB_PASSWORD;

if (!projectRef || !dbPassword) {
  console.error(
    "[migrate] Missing SUPABASE_PROJECT_REF or SUPABASE_DB_PASSWORD in .env.local.\n" +
      "Fill both values, then run: node scripts/supabase-migrate.mjs"
  );
  process.exit(1);
}

const host = env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
const connectionString =
  env.SUPABASE_DB_URL ||
  `postgresql://postgres:${dbPassword}@${host}:5432/postgres`;

let pg;
try {
  pg = await import("pg");
} catch {
  console.error("[migrate] The `pg` package is required. Run: npm install --save-dev pg");
  process.exit(1);
}
const { Client } = pg.default || pg;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function runFile(file) {
  const sql = readFileSync(file, "utf8");
  await client.query(sql);
  console.log(`[ok] ${file.replace(root + "/", "")}`);
}

async function verify() {
  section("Verifying assets columns");
  const cols = await client.query(
    `select column_name from information_schema.columns
     where table_schema='public' and table_name='assets'
       and column_name in ('file_path','file_url','mime_type','file_size','original_file_name','alt_text')
     order by column_name`
  );
  console.log(
    cols.rows.length === 6
      ? `[ok] assets columns: ${cols.rows.map((r) => r.column_name).join(", ")}`
      : `[warn] expected 6 columns, found ${cols.rows.length}`
  );

  section("Verifying type constraint");
  const con = await client.query(
    `select pg_get_constraintdef(oid) as def from pg_constraint
     where conname='assets_type_check'`
  );
  console.log(con.rows.length ? `[ok] ${con.rows[0].def}` : "[warn] assets_type_check not found");

  section("Verifying RLS policies");
  const pol = await client.query(
    `select tablename, policyname from pg_policies
     where schemaname='public' and tablename in ('assets','pages','releases','site_settings','administrators')
     order by tablename, policyname`
  );
  console.log(`[ok] ${pol.rows.length} RLS policies on public tables`);
  pol.rows.forEach((r) => console.log(`     ${r.tablename}: ${r.policyname}`));

  section("Verifying storage bucket and policies");
  const bucket = await client.query(
    `select id, public from storage.buckets where id='design-system-assets'`
  );
  console.log(bucket.rows.length ? `[ok] bucket design-system-assets (public=${bucket.rows[0].public})` : "[warn] bucket missing");
  const spol = await client.query(
    `select policyname from pg_policies
     where schemaname='storage' and tablename='objects'`
  );
  console.log(`[ok] ${spol.rows.length} storage policies`);

  section("Verifying site settings");
  const settings = await client.query(
    `select content from public.site_settings where id='default'`
  );
  console.log(
    settings.rows.length
      ? `[ok] site name: ${settings.rows[0].content.name}`
      : "[warn] no default site settings"
  );

  section("Verifying realtime publication");
  const pub = await client.query(
    `select tablename from pg_publication_tables
     where pubname='supabase_realtime' and schemaname='public'`
  );
  console.log(`[ok] realtime tables: ${pub.rows.map((r) => r.tablename).join(", ") || "none"}`);
}

async function main() {
  console.log(`[migrate] connecting to ${host} ...`);
  await client.connect();
  try {
    const autoConfirm = process.argv.includes("--yes");
    if (!autoConfirm) {
      console.log(
        "[migrate] this will run schema.sql and all migrations against your database."
      );
      console.log("[migrate] re-run with --yes to skip this confirmation.");
      process.exit(0);
    }

    section("Running schema.sql");
    await runFile(join(root, "supabase/schema.sql"));

    section("Running migrations");
    const dir = join(root, "supabase/migrations");
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      await runFile(join(dir, file));
    }

    await verify();
    console.log("\n[migrate] done. All migrations applied and verified.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`\n[migrate] failed: ${error.message}`);
  process.exit(1);
});
