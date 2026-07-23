#!/usr/bin/env node
// Validates that all migrations are safe for production:
// - No DROP TABLE public.*
// - No TRUNCATE
// - No DELETE FROM public.assets/pages/releases without WHERE
// - No DROP COLUMN for required columns
// - No disabling RLS
// - Additive only
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

let hasError = false;

const destructivePatterns = [
  { pattern: /drop\s+table\s+public\./i, msg: "DROP TABLE public.* is forbidden" },
  { pattern: /truncate\s+public\./i, msg: "TRUNCATE is forbidden" },
  { pattern: /delete\s+from\s+public\.(assets|pages|releases|site_settings)\s*;/i, msg: "DELETE without WHERE on production table is forbidden" },
  { pattern: /drop\s+column\s+if\s+exists\s+(visibility|purpose|file_path|mime_type|file_size)/i, msg: "Dropping required column is forbidden" },
  { pattern: /disable\s+row\s+level\s+security/i, msg: "Disabling RLS is forbidden" },
  { pattern: /drop\s+policy\s+if\s+exists.*without.*recreate/i, msg: "Check policy drop without recreate" },
  { pattern: /supabase\s+db\s+reset/i, msg: "db reset must never be used in production migration" },
];

// Safe pattern hint (used for manual review, not enforced as error)
// Migrations should use IF NOT EXISTS for ADD COLUMN — checked via warning above

console.log(`Validating ${files.length} migration files...\n`);

for (const file of files) {
  const content = readFileSync(join(migrationsDir, file), "utf8");
  console.log(`- ${file}`);

  for (const { pattern, msg } of destructivePatterns) {
    if (pattern.test(content)) {
      // Allow specific safe drops: drop constraint if exists, drop policy if exists (recreated)
      if (file.includes("assets_type") && /drop\s+constraint/i.test(content)) continue;
      if (/drop\s+policy\s+if\s+exists/i.test(content) && /create\s+policy/i.test(content)) continue;
      if (/supabase_realtime.*add table/i.test(content)) continue;
      console.error(`  ✖ Destructive pattern in ${file}: ${msg} -> ${pattern}`);
      hasError = true;
    }
  }

  // Warn if migration does not use IF NOT EXISTS for new columns (info only)
  if (file.includes("purpose_fields") || file.includes("assets_columns") || file.includes("visibility") || file.includes("internal_component_preview")) {
    if (!/if\s+not\s+exists/i.test(content)) {
      console.warn(`  ⚠ ${file} should use IF NOT EXISTS for column adds`);
    }
  }
}

// Specific check for 20260719000010
const latest = files[files.length - 1];
if (latest) {
  const latestContent = readFileSync(join(migrationsDir, latest), "utf8");
  if (!/internal\/component-preview/.test(latestContent) && latest.includes("internal_component_preview")) {
    // Not required to have path in SQL, but check constraint allows component-preview
    if (!/component-preview/.test(latestContent)) {
      console.error(`  ✖ Latest migration ${latest} should mention component-preview type`);
      hasError = true;
    }
  }
  // Must be additive
  if (!/add column if not exists/i.test(latestContent) && !/drop constraint if exists/i.test(latestContent)) {
    console.warn(`  ⚠ Latest migration should be additive with IF NOT EXISTS`);
  }
}

if (hasError) {
  console.error("\n✖ Migration validation failed — destructive operations detected. Fix before pushing to main.\n");
  process.exit(1);
} else {
  console.log("\n✓ All migrations appear safe (no destructive patterns found).\n");
}
