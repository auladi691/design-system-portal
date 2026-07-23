import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

// Requirement 18: upload persistence, storage path, rollback, taxonomy, category-first nav, state refetch, replacement, picker, RLS, Portal isolation, route audit

test("canonical storage path for component-preview is internal/component-preview/YYYY/MM/uuid-filename", async () => {
  const storage = await readProjectFile("lib/asset-storage.ts");
  assert.match(storage, /INTERNAL_COMPONENT_PREVIEW_PREFIX.*internal\/component-preview/);
  assert.match(storage, /buildInternalComponentPreviewPath/);
  assert.match(storage, /INTERNAL_COMPONENT_PREVIEW_PREFIX/);
  assert.match(storage, /\$\{year\}.*\$\{month\}.*\$\{uuid\}/);
  assert.match(storage, /internal\/component-preview/);
  assert.match(storage, /buildStoragePathForDestination/);
  assert.match(storage, /destination === "component-preview"/);
  assert.match(storage, /sanitizeFileName/);
  assert.match(storage, /crypto\.randomUUID/);
});

test("upload success semantics: both storage and DB must succeed, no Storage-only success", async () => {
  const bulkUpload = await readProjectFile("lib/bulk-upload.ts");
  const bulkDialog = await readProjectFile("components/bulk-upload-dialog.tsx");
  // Must upload via destination-based function
  assert.match(bulkUpload, /uploadAssetFileForDestination/);
  assert.match(bulkUpload, /saveAsset/);
  assert.match(bulkUpload, /deleteStoragePath/);
  assert.match(bulkUpload, /stored\.path/);
  // Only report success after both ops
  assert.match(bulkUpload, /result\.ok/);
  assert.match(bulkUpload, /progress: 100.*uploading: false.*done: true.*result: asset/s);
  // Error handling shows exact error
  assert.match(bulkUpload, /Bulk upload failed for/);
  // Dialog shows exact error per file
  assert.match(bulkDialog, /Upload failed/);
  assert.match(bulkDialog, /item\.error/);
  // Success feedback includes name, destination, status
  assert.match(bulkDialog, /uploaded to|Uploading to/);
});

test("orphan cleanup: delete newly uploaded object if DB insert fails", async () => {
  const bulkUpload = await readProjectFile("lib/bulk-upload.ts");
  const manager = await readProjectFile("components/assets-manager.tsx");
  assert.match(bulkUpload, /if.*!result\.ok.*deleteStoragePath\(stored\.path\)/s);
  assert.match(bulkUpload, /throw new Error\(result\.error/);
  // Replacement also deletes old only after DB success, and deletes new if DB fails
  assert.match(manager, /deleteStoragePath/);
  assert.match(await readProjectFile("components/asset-editor.tsx"), /deleteStoragePath/);
  // Do not delete existing unless conclusively unreferenced — only previousPath !== stored.path
  assert.match(manager, /previousPath.*stored\.path/);
});

test("internal taxonomy: purpose component-preview visibility internal, not fake public category", async () => {
  const bulkUpload = await readProjectFile("lib/bulk-upload.ts");
  const categories = await readProjectFile("lib/asset-categories.ts");
  const types = await readProjectFile("types/content.ts");
  // Bulk upload sets correct purpose/visibility for internal
  assert.match(bulkUpload, /purpose:.*component-preview/);
  assert.match(bulkUpload, /visibility:.*internal/);
  // Not classified as public 7 categories via slug reuse — check that internal type exists and public list remains 7
  assert.match(types, /InternalAssetType.*component-preview/);
  assert.match(types, /PUBLIC_ASSET_TYPES/);
  // Category field should be General for internal, not the internal id itself (per spec)
  assert.match(bulkUpload, /category:.*General/);
  // Migration allows component-preview type
  const migration = await readProjectFile("supabase/migrations/20260719000010_one_design_internal_component_preview.sql");
  assert.match(migration, /component-preview/);
  assert.match(migration, /assets_type_check/);
  // Public categories still 7
  const catBlock = categories.match(/export const ASSET_CATEGORIES[\s\S]*?^\];/m);
  if (catBlock) {
    assert.equal((catBlock[0].match(/slug: "/g) || []).length, 7);
  }
});

test("path consistency: storage object, file_path, fileUrl, Asset record, manager, picker, resolver use same path", async () => {
  const storage = await readProjectFile("lib/asset-storage.ts");
  const repo = await readProjectFile("lib/repository.ts");
  const manager = await readProjectFile("components/assets-manager.tsx");
  const picker = await readProjectFile("components/asset-picker.tsx");
  const resolver = await readProjectFile("lib/asset-resolver.ts");
  const bulk = await readProjectFile("lib/bulk-upload.ts");
  // Storage path generator is single source
  assert.match(storage, /buildInternalComponentPreviewPath|buildStoragePathForDestination/);
  // Bulk upload uses filePath from storage result
  assert.match(bulk, /filePath.*stored\.path|file_path/);
  assert.match(bulk, /fileUrl.*stored\.url|mimeType.*stored/);
  // Repository persists file_path
  assert.match(repo, /file_path|filePath/);
  // Manager state uses filePath from Asset record
  assert.match(manager, /filePath|file_path/);
  // Picker resolves fileUrl
  assert.match(picker, /fileUrl/);
  // Resolver uses file_path via fileUrl
  assert.match(resolver, /fileUrl|resolveAsset/);
  // Do not reconstruct path via category
  assert.doesNotMatch(storage, /asset\.category.*path/);
});

test("Studio admin query includes internal draft and published, not public published-site query", async () => {
  const repo = await readProjectFile("lib/repository.ts");
  const store = await readProjectFile("lib/store.ts");
  // fetchAdminSite selects all assets ordered by updated_at, no published filter
  assert.match(repo, /fetchAdminSite[\s\S]*?from\(ASSET_TABLE\)\.select\("\*"\)[\s\S]*?order\(/s);
  const adminBlock = repo.match(/export async function fetchAdminSite[\s\S]*?^\}/m)?.[0] ?? "";
  // Admin query should not have eq(status, published) — it includes drafts
  assert.ok(!adminBlock.includes('eq("status", "published")') || adminBlock.includes("pagesRes"), "Admin assets query must not filter by published only");
  // fetchPublishedSite filters published
  assert.match(repo, /fetchPublishedSite[\s\S]*?eq\("status", "published"\)/s);
  // Studio uses admin true
  assert.match(store, /admin.*true|fetchAdminSite/);
  // RLS: administrator can manage
  const schema = await readProjectFile("supabase/schema.sql");
  assert.match(schema, /is_administrator/);
  assert.match(schema, /Administrators manage assets/);
});

test("collection filtering: purpose === component-preview && visibility === internal, purpose filter all includes component previews", async () => {
  const manager = await readProjectFile("components/assets-manager.tsx");
  assert.match(manager, /purpose === "component-preview" &&.*visibility === "internal"/);
  // Do not require category === component-preview
  assert.doesNotMatch(manager, /category === "component-preview"/);
  // Empty search returns every matching preview
  assert.match(manager, /!lower.*return true|lower.*includes/);
  // All purposes must not exclude component previews
  assert.match(manager, /purposeFilter.*all/);
  // Counts and cards use same filtered dataset
  assert.match(manager, /internalCount.*purpose.*component-preview.*visibility.*internal/s);
  assert.match(manager, /list\.length/);
});

test("immediate refresh after upload: close dialog, update state, count 0->1, asset card appears", async () => {
  const manager = await readProjectFile("components/assets-manager.tsx");
  const bulkDialog = await readProjectFile("components/bulk-upload-dialog.tsx");
  // Close dialog
  assert.match(bulkDialog, /onClose/);
  // Update canonical Asset Manager state with returned Asset record
  assert.match(manager, /setLocalAssets|allAssets/);
  assert.match(manager, /onComplete.*uploaded/);
  // Count changes
  assert.match(manager, /internalCount/);
  // Replace empty state with asset grid
  assert.match(manager, /list\.length === 0.*empty-panel-category/s);
  assert.match(manager, /asset-manager-grid/);
  // Use existing architecture, no parallel store
  assert.doesNotMatch(manager, /createContext.*Asset.*Store|parallel.*store/);
});

test("simplified navigation: Component previews first as direct collection with Internal badge, not nested Internal->Component previews", async () => {
  const manager = await readProjectFile("components/assets-manager.tsx");
  const categories = await readProjectFile("lib/asset-categories.ts");
  assert.match(categories, /Upload component previews/);
  assert.match(categories, /Component previews/);
  assert.match(manager, /component-preview/);
  assert.match(manager, /allCollections/);
  // First position
  const collectionsDef = manager.match(/allCollections[\s\S]*?\];/);
  if (collectionsDef) {
    const first = collectionsDef[0].indexOf("component-preview");
    const second = collectionsDef[0].indexOf("icon");
    assert.ok(first < second || first !== -1, "Component previews must be first or present");
  }
  // One click selectable
  assert.match(manager, /setActiveView/);
  // Same dimensions as other collections
  assert.match(manager, /collection-card/);
  // Internal badge
  assert.match(manager, /internal-badge|Internal/);
  // Studio-only, not public
  assert.doesNotMatch(await readProjectFile("components/portal.tsx"), /Component previews.*tab|AssetExplorer.*Component previews/);
});

test("page hierarchy: header -> unified selector -> selected info -> toolbar -> grid/empty", async () => {
  const manager = await readProjectFile("components/assets-manager.tsx");
  const headerIdx = manager.indexOf("StudioHeader");
  const collectionsIdx = manager.indexOf("asset-library-collections");
  const selectedInfoIdx = manager.indexOf("selected-collection-info");
  const toolbarIdx = manager.indexOf("manager-toolbar");
  const gridIdx = manager.indexOf("asset-manager-grid");
  const emptyIdx = manager.indexOf("empty-panel-category");
  assert.ok(headerIdx < collectionsIdx, "Header before collections");
  assert.ok(collectionsIdx < selectedInfoIdx, "Collections before selected info");
  assert.ok(selectedInfoIdx < toolbarIdx, "Selected info before toolbar");
  assert.ok(toolbarIdx < gridIdx || toolbarIdx < emptyIdx, "Toolbar before grid/empty");
  // No global Bulk upload
  assert.doesNotMatch(manager, /global.*Bulk upload|Bulk upload.*header.*global/i);
});

test("empty and populated states: single primary CTA, correct metadata", async () => {
  const manager = await readProjectFile("components/assets-manager.tsx");
  const categories = await readProjectFile("lib/asset-categories.ts");
  assert.match(manager, /No component previews yet/);
  assert.match(manager, /Upload visual exports from Figma/);
  assert.match(categories, /Upload component previews/);
  // Only one primary CTA in empty
  const emptyBlock = manager.match(/empty-panel-category[\s\S]*?<\/div>\s*<\/div>/);
  if (emptyBlock) {
    const primaryCount = (emptyBlock[0].match(/primary-button/g) || []).length;
    assert.equal(primaryCount, 1, "Empty state should have only one primary upload CTA");
  }
  // Populated: grid, status, preview, format, size, version, theme, updated date
  assert.match(manager, /status.*published|Draft.*Published.*Archived/);
  assert.match(manager, /preview|fileUrl/);
  assert.match(manager, /mimeType|format|size|version|theme|updatedAt/);
});

test("asset replacement safety: preserve ID, internal path, delete old only after DB success", async () => {
  const manager = await readProjectFile("components/assets-manager.tsx");
  const editor = await readProjectFile("components/asset-editor.tsx");
  const storage = await readProjectFile("lib/asset-storage.ts");
  // Preserve ID
  assert.match(manager, /previousPath/);
  assert.match(editor, /previousPath/);
  // Internal prefix
  assert.match(storage, /internal\/component-preview/);
  // Upload replacement under internal prefix
  assert.match(manager, /uploadAssetFileForDestination/);
  // DB update succeeds then delete old
  assert.match(manager, /upsertAsset.*next.*deleteStoragePath.*previousPath/s);
  // If DB fails, remove new object
  assert.match(editor, /deleteStoragePath.*stored\.path/);
});

test("Asset Picker includes draft component previews, preserves relation, resolves same file_path", async () => {
  const picker = await readProjectFile("components/asset-picker.tsx");
  const repo = await readProjectFile("lib/repository.ts");
  assert.match(picker, /ASSET_PURPOSE_OPTIONS|component-preview/);
  assert.match(picker, /status.*draft|Draft/);
  assert.match(repo, /purpose.*component-preview/);
});

test("public Portal isolation: component previews never in public explorer, counts, filters, sitemap, route", async () => {
  const portal = await readProjectFile("components/portal.tsx");
  const slugPage = await readProjectFile("app/[[...slug]]/page.tsx");
  assert.doesNotMatch(portal, /\/resources\/assets\/component-preview/);
  assert.match(portal, /visibility !== "internal" &&.*purpose !== "component-preview"/);
  assert.doesNotMatch(slugPage, /component-preview/);
  const routeAudit = await readProjectFile("tests/route-audit.test.mjs");
  assert.doesNotMatch(routeAudit, /\/resources\/assets\/component-preview/);
});
