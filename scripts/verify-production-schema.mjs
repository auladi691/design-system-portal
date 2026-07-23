#!/usr/bin/env node
// Verifies production schema after migration
// Works in two modes:
// 1. Local verification (no DB): checks migration files contain required columns
// 2. Production verification (with SUPABASE_DB_PASSWORD): connects via pg and checks live DB

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredAssetColumns = [
  "visibility",
  "purpose",
  "file_path",
  "file_url",
  "mime_type",
  "file_size",
  "original_file_name",
  "alt_text",
  "caption",
  "theme",
  "figma_url",
  "download_available",
];

const requiredBucket = "design-system-assets";
const requiredPublicTypes = ["icon", "icon-illustration", "illustration", "logo", "brand-asset", "template", "download"];

function checkLocalMigrations() {
  console.log("=== Local migration file verification ===\n");
  const migrationsDir = join(root, "supabase/migrations");
  const files = readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();
  let allContent = "";
  for (const file of files) {
    allContent += readFileSync(join(migrationsDir, file), "utf8") + "\n";
  }

  let ok = true;
  console.log(`Checking ${files.length} migration files for required columns...`);
  for (const col of requiredAssetColumns) {
    if (allContent.toLowerCase().includes(col)) {
      console.log(`  ✓ ${col}`);
    } else {
      console.error(`  ✖ Missing column definition for ${col}`);
      ok = false;
    }
  }

  console.log("\nChecking public asset categories constraint...");
  // Check that latest constraint allows internal type
  const hasInternalType = allContent.includes("'component-preview'") && allContent.includes("assets_type_check");
  if (hasInternalType) {
    console.log(`  ✓ component-preview allowed in assets_type_check (internal)`);
  } else {
    console.warn(`  ⚠ component-preview not found in type constraint — may need migration`);
  }

  for (const t of requiredPublicTypes) {
    if (allContent.includes(`'${t}'`)) {
      console.log(`  ✓ public type '${t}' present`);
    } else {
      console.error(`  ✖ public type '${t}' missing`);
      ok = false;
    }
  }

  console.log("\nChecking bucket and RLS...");
  if (allContent.includes(requiredBucket)) {
    console.log(`  ✓ bucket ${requiredBucket} referenced`);
  } else {
    console.warn(`  ⚠ bucket ${requiredBucket} not found in migrations`);
  }

  if (allContent.includes("is_administrator")) {
    console.log(`  ✓ RLS is_administrator policy present`);
  } else {
    console.error(`  ✖ RLS is_administrator missing`);
    ok = false;
  }

  console.log("\nChecking component-preview isolation...");
  if (allContent.includes("purpose = 'component-preview'") && allContent.includes("visibility = 'internal'")) {
    console.log(`  ✓ component-preview purpose -> internal backfill present`);
  } else {
    console.warn(`  ⚠ component-preview backfill may be missing`);
  }

  if (!ok) {
    console.error("\n✖ Local verification failed\n");
    process.exit(1);
  }
  console.log("\n✓ Local migration verification passed\n");
}

async function checkProductionDB() {
  const envFile = join(root, ".env.local");
  let env = { ...process.env };
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }

  const projectRef = env.SUPABASE_PROJECT_REF || env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  const dbPassword = env.SUPABASE_DB_PASSWORD;

  if (!projectRef || !dbPassword) {
    console.log("No SUPABASE_PROJECT_REF / SUPABASE_DB_PASSWORD — skipping live DB verification (local only mode)\n");
    console.log("To verify production DB, set in .env.local or GitHub secrets:\n  SUPABASE_PROJECT_REF\n  SUPABASE_DB_PASSWORD\n");
    return;
  }

  console.log("=== Live production DB verification ===\n");
  console.log(`Project ref: ${projectRef}`);
  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error("pg package required: npm install --save-dev pg");
    process.exit(1);
  }
  const { Client } = pg.default || pg;
  const host = env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
  const connectionString = env.SUPABASE_DB_URL || `postgresql://postgres:${dbPassword}@${host}:5432/postgres`;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    console.log("Checking public.assets columns...");
    const cols = await client.query(
      `select column_name from information_schema.columns where table_schema='public' and table_name='assets' order by column_name`
    );
    const colNames = cols.rows.map(r => r.column_name);
    console.log(`  Found: ${colNames.join(", ")}`);
    let ok = true;
    for (const c of requiredAssetColumns) {
      if (colNames.includes(c)) {
        console.log(`  ✓ ${c}`);
      } else {
        console.error(`  ✖ Missing column: ${c}`);
        ok = false;
      }
    }

    console.log("\nChecking assets_type_check constraint...");
    const con = await client.query(
      `select pg_get_constraintdef(oid) as def from pg_constraint where conname='assets_type_check'`
    );
    if (con.rows.length) {
      console.log(`  ${con.rows[0].def}`);
      if (con.rows[0].def.includes("component-preview")) {
        console.log(`  ✓ allows component-preview internal type`);
      } else {
        console.warn(`  ⚠ constraint does not allow component-preview — run migration 00010`);
      }
      for (const t of requiredPublicTypes) {
        if (con.rows[0].def.includes(t)) console.log(`  ✓ allows ${t}`);
        else { console.error(`  ✖ missing ${t}`); ok = false; }
      }
    } else {
      console.warn("  ⚠ assets_type_check not found");
    }

    console.log("\nChecking bucket...");
    const bucket = await client.query(`select id, public from storage.buckets where id='design-system-assets'`);
    if (bucket.rows.length) {
      console.log(`  ✓ bucket ${bucket.rows[0].id} public=${bucket.rows[0].public}`);
    } else {
      console.error(`  ✖ bucket ${requiredBucket} missing`);
      ok = false;
    }

    console.log("\nChecking RLS policies...");
    const pol = await client.query(
      `select tablename, policyname from pg_policies where schemaname='public' and tablename='assets' order by policyname`
    );
    console.log(`  ${pol.rows.map(r => r.policyname).join(", ")}`);
    if (pol.rows.some(r => r.policyname.includes("Administrators manage assets"))) {
      console.log(`  ✓ Administrators manage assets policy present`);
    } else {
      console.error(`  ✖ Administrator RLS missing`);
      ok = false;
    }

    console.log("\nChecking component-preview data...");
    const cp = await client.query(`select count(*) as count, status from public.assets where purpose='component-preview' group by status`);
    if (cp.rows.length) {
      console.log(`  Found ${cp.rows.length} groups:`);
      cp.rows.forEach(r => console.log(`    ${r.status}: ${r.count}`));
    } else {
      console.log(`  No component-preview assets yet (ok for empty DB)`);
    }

    if (!ok) {
      console.error("\n✖ Live DB verification failed\n");
      process.exit(1);
    }
    console.log("\n✓ Live DB verification passed\n");
  } finally {
    await client.end();
  }
}

(async () => {
  checkLocalMigrations();
  await checkProductionDB();
})();
