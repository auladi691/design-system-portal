import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { existsSync } from "node:fs";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

function fileExists(path) {
  return existsSync(new URL(path, root));
}

// Requirement 3: Do not create /resources/assets/component-preview
// Requirement 4: Keep public categories unchanged
// Requirement 7: assetPurpose + visibility internal
// Requirement 8: public portal resolves only via published doc relation
// Requirement 10: explicit verification

test("component-preview taxonomy: internal-only purpose, not public category", async () => {
  const categoriesFile = await readProjectFile("lib/asset-categories.ts");
  const typesFile = await readProjectFile("types/content.ts");
  const resolverFile = await readProjectFile("lib/asset-resolver.ts");
  const repoFile = await readProjectFile("lib/repository.ts");

  // 7 public categories only
  const expectedSlugs = ["icon", "icon-illustration", "illustration", "logo", "brand-asset", "template", "download"];
  for (const slug of expectedSlugs) {
    assert.match(categoriesFile, new RegExp(`slug: "${slug}"`), `ASSET_CATEGORIES must contain ${slug}`);
  }
  assert.doesNotMatch(categoriesFile, /ASSET_CATEGORIES[\s\S]*?slug: "component-preview"/, "component-preview must NOT be a public AssetType category in ASSET_CATEGORIES");
  // Exactly 7 public categories — count slugs inside ASSET_CATEGORIES array definition
  const assetCatBlock = categoriesFile.match(/export const ASSET_CATEGORIES[\s\S]*?^\];/m);
  if (assetCatBlock) {
    const slugMatches = assetCatBlock[0].match(/slug: "/g) || [];
    assert.equal(slugMatches.length, 7, "ASSET_CATEGORIES must have exactly 7 entries");
  }
  // Internal collection exists separately for Studio
  assert.match(categoriesFile, /INTERNAL_ASSET_COLLECTIONS|INTERNAL_COLLECTION_MAP/, "Internal collection map must exist");
  assert.match(categoriesFile, /component-preview/, "Internal collection component-preview should exist as internal");

  // Types: internal purpose
  assert.match(typesFile, /export const INTERNAL_PURPOSES.*component-preview/s);
  assert.match(typesFile, /component-preview.*AssetPurpose|AssetPurpose.*component-preview/s);
  assert.match(typesFile, /assetVisibilityForPurpose/);
  assert.match(typesFile, /not listed in public Asset Explorer/i);
  assert.match(typesFile, /internal/);
  assert.match(typesFile, /value: "component-preview".*label: "Component preview".*internal: true/s);

  // Resolver
  assert.match(resolverFile, /INTERNAL_ASSET_PURPOSES.*component-preview/);
  assert.match(resolverFile, /isInternalAsset/);
  assert.match(resolverFile, /isPublicAsset/);
  assert.match(resolverFile, /resolvePublishedDocAsset/);
  assert.match(resolverFile, /requirePublished/);

  // Repository stores as purpose + visibility
  assert.match(repoFile, /purpose.*component-preview|component-preview.*purpose/s);
  assert.match(repoFile, /visibility.*internal|component-preview.*internal/s);
  assert.match(repoFile, /isInternalAssetRow/);
  assert.match(repoFile, /collectReferencedAssetIds/);
  assert.match(repoFile, /referencedSet.*has|\.has\(.*id\)/);
  // Public query only published
  assert.match(repoFile, /eq\("status", "published"\)/);
  assert.match(repoFile, /Public portal: component-preview|internal-only|referenced by a published doc/i);
});

test("component-preview selectable only in Studio, not public Portal", async () => {
  const portalFile = await readProjectFile("components/portal.tsx");
  const pickerFile = await readProjectFile("components/asset-picker.tsx");
  const editorFile = await readProjectFile("components/asset-editor.tsx");
  const managerFile = await readProjectFile("components/assets-manager.tsx");
  const studioFile = await readProjectFile("components/studio.tsx");
  const slugPage = await readProjectFile("app/[[...slug]]/page.tsx");
  const categoriesFile = await readProjectFile("lib/asset-categories.ts");
  const bulkUploadFile = await readProjectFile("lib/bulk-upload.ts");

  // Studio: selectable
  // Requirement 1: Show Component preview only in Studio Asset Library, Editor, Picker, Doc visual block config
  assert.match(managerFile, /ASSET_PURPOSE_OPTIONS|purposeFilter/, "AssetsManager must allow purpose filter with component-preview");
  assert.match(managerFile, /component-preview|Component preview|ASSET_PURPOSE_OPTIONS/s);
  assert.match(editorFile, /component-preview/, "AssetEditor must handle component-preview purpose");
  assert.match(editorFile, /visibility.*internal|internal.*visibility/s, "AssetEditor must set internal visibility");
  assert.match(pickerFile, /ASSET_PURPOSE_OPTIONS|component-preview/, "AssetPicker must list component-preview");
  assert.match(studioFile, /VisualBlockEditor|AssetPickerButton/, "Studio visual block config must use AssetPicker");
  assert.match(bulkUploadFile, /isInternalDestination|component-preview.*internal|internal.*component-preview/s, "Bulk upload must force internal visibility for component-preview");

  // Public Portal: NOT visible
  // Requirement 2: Do not expose in public navigation, resource cards, Asset Explorer tabs, routes, counts, search filters, sitemap
  // Asset Explorer tabs are from ASSET_CATEGORIES (7 public only) — internal collection separate
  assert.match(portalFile, /ASSET_CATEGORIES/, "Portal uses ASSET_CATEGORIES for tabs");
  assert.doesNotMatch(portalFile, /\/resources\/assets\/component-preview/, "Portal must not have /resources/assets/component-preview route");
  // Explorer must filter out internal
  assert.match(portalFile, /visibility !== "internal"/, "AssetExplorer must filter visibility !== internal");
  assert.match(portalFile, /purpose !== "component-preview"/, "AssetExplorer must filter purpose !== component-preview");
  // Purpose filter in Portal is limited — no component-preview in public list
  assert.match(portalFile, /anatomy.*variant.*state/, "Public purpose filter must be limited to public purposes");
  assert.doesNotMatch(portalFile, /\["component-preview", "anatomy"/);
  // No component-preview route created — slug page uses ASSET_CATEGORY_MAP (7 public only)
  assert.doesNotMatch(slugPage, /slug: "component-preview"|assets\/component-preview/, "Catch-all page must not have component-preview public route");
  // Public category map must not include component-preview as AssetType
  assert.doesNotMatch(categoriesFile, /export const ASSET_CATEGORIES[\s\S]*?slug: "component-preview"/);
  // Resources page category cards not linking to component-preview
  assert.doesNotMatch(portalFile, /\/resources\/assets\/component-preview/);
  // Public asset counts derived from filtered categoryAssets (which excludes internal)
  assert.match(portalFile, /categoryAssets.*filter|asset-count/, "Asset counts must derive from filtered categoryAssets");
  // Search filters — search page only searches pages, not assets with component-preview
  assert.doesNotMatch(portalFile, /Search.*component-preview|component-preview.*search/i);
});

test("component-preview renders only via published doc relation, draft/archived hidden", async () => {
  const visualBlockFile = await readProjectFile("components/visual-block.tsx");
  const repoFile = await readProjectFile("lib/repository.ts");
  const portalFile = await readProjectFile("components/portal.tsx");
  const resolverFile = await readProjectFile("lib/asset-resolver.ts");

  // Requirement 5: published preview may render only when referenced by published block (design-preview, variant-gallery, state-gallery)
  assert.match(repoFile, /collectReferencedAssetIds/, "Repository must collect referenced assetIds from pages");
  assert.match(repoFile, /coverAssetId|visualBlocks.*assetId|block\.items.*assetId/s);
  assert.match(repoFile, /referencedSet\.has/, "Repository must only include internal asset if referencedSet.has(id)");
  // Visual blocks use published-only resolver
  assert.match(visualBlockFile, /resolvePublishedDocAsset/, "Visual blocks must resolve via published doc relation");
  assert.match(visualBlockFile, /requirePublished|resolvePublishedDocAsset/, "Visual block must require published");
  // No resolve with requirePublished:false anymore for public blocks
  assert.doesNotMatch(visualBlockFile, /resolveAsset\(.*requirePublished:\s*false/);
  // Portal CardVisual fallback also requires published
  assert.match(portalFile, /resolveAsset\(.*requirePublished:\s*true/);
  // Requirement 6: draft/archived hidden
  assert.match(visualBlockFile, /No design preview selected|Design preview — select a visual/, "DesignPreview must have empty state when not published");
  // Doc page filtering: portal only queries published status
  assert.match(repoFile, /from\(ASSET_TABLE\).*eq\("status", "published"\)/s);
  assert.match(resolverFile, /requirePublished/);
});

test("no Button previews classified as Illustrations or Downloads", async () => {
  const categoriesFile = await readProjectFile("lib/asset-categories.ts");
  const typesFile = await readProjectFile("types/content.ts");
  // Button preview must be component-preview purpose, not illustration/download type
  // Public categories have specific allowed extensions — ensure component-preview is not in illustration/download config as public
  assert.match(categoriesFile, /INTERNAL_ASSET_COLLECTIONS|component-preview/);
  // Public asset types remain 7, internal type component-preview allowed via migration 00010
  assert.match(typesFile, /PUBLIC_ASSET_TYPES/);
  assert.match(typesFile, /PublicAssetType.*icon.*icon-illustration.*illustration.*logo.*brand-asset.*template.*download/s);
  assert.match(typesFile, /InternalAssetType.*component-preview/);
  // AssetType includes internal now, but ASSET_CATEGORIES stays 7
  assert.match(categoriesFile, /export const ASSET_CATEGORIES/);
  const catBlock = categoriesFile.match(/export const ASSET_CATEGORIES[\s\S]*?^\];/m);
  if (catBlock) {
    const publicSlugs = (catBlock[0].match(/slug: "/g) || []).length;
    assert.equal(publicSlugs, 7, "Public ASSET_CATEGORIES must still be 7");
  }
  // AssetPurpose separates visual role from category
  assert.match(typesFile, /AssetPurpose/, "AssetPurpose must exist to classify visual role separately from AssetType");
  assert.match(typesFile, /component-preview/);
});

test("public metadata no component-preview route, sitemap safe", async () => {
  const routeAuditFile = await readProjectFile("tests/route-audit.test.mjs");
  const slugPageFile = await readProjectFile("app/[[...slug]]/page.tsx");
  const portalDna = fileExists("PORTAL_DNA.md") ? await readProjectFile("PORTAL_DNA.md") : "";
  const assetSystem = fileExists("ASSET_SYSTEM.md") ? await readProjectFile("ASSET_SYSTEM.md") : "";

  // Route audit expectedRoutes must be 7 categories only
  assert.match(routeAuditFile, /\/resources\/assets\/icon/);
  assert.match(routeAuditFile, /\/resources\/assets\/download/);
  assert.doesNotMatch(routeAuditFile, /\/resources\/assets\/component-preview/);
  // slug page uses ASSET_CATEGORY_MAP
  assert.match(slugPageFile, /ASSET_CATEGORY_MAP/);
  // PORTAL_DNA lists only 7 asset routes in its Routes code block (the negative doc "No /resources/assets/component-preview route" is allowed)
  if (portalDna) {
    assert.match(portalDna, /\/resources\/assets\/\{icon\|icon-illustration\|illustration\|logo\|brand-asset\|template\|download\}/);
    // The Routes code block must not contain component-preview as valid route
    const routesBlock = portalDna.match(/```text[\s\S]*?```/);
    if (routesBlock) {
      assert.doesNotMatch(routesBlock[0], /\/resources\/assets\/component-preview/);
    }
  }
  // No sitemap file generating component-preview — glob check
  const hasSitemap = fileExists("app/sitemap.ts") ? await readProjectFile("app/sitemap.ts") : "";
  if (hasSitemap) {
    assert.doesNotMatch(hasSitemap, /\/resources\/assets\/component-preview/);
  }
  // ASSET_SYSTEM doc mentions 7 categories; it may document component-preview as internal but not as a public route
  if (assetSystem) {
    assert.match(assetSystem, /seven categories/i);
    assert.doesNotMatch(assetSystem, /-\s*\/resources\/assets\/component-preview/);
  }
});
