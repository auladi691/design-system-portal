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

test("asset model extended for Figma-to-documentation workflow", async () => {
  const types = await readProjectFile("types/content.ts");
  const repo = await readProjectFile("lib/repository.ts");
  const schema = await readProjectFile("supabase/schema.sql");
  const migration = fileExists("supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql")
    ? await readProjectFile("supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql")
    : "";
  // Types
  assert.match(types, /AssetPurpose/);
  assert.match(types, /component-preview/);
  assert.match(types, /anatomy/);
  assert.match(types, /variant/);
  assert.match(types, /state/);
  assert.match(types, /pattern-flow/);
  assert.match(types, /foundation-visual/);
  assert.match(types, /cover-visual/);
  assert.match(types, /general-asset/);
  assert.match(types, /purpose: AssetPurpose/);
  assert.match(types, /caption: string/);
  assert.match(types, /theme: AssetTheme/);
  assert.match(types, /figmaUrl\?/);
  assert.match(types, /downloadAvailable: boolean/);
  assert.match(types, /coverAssetId\?/);
  assert.match(types, /AssetTheme/);
  assert.match(types, /ASSET_PURPOSE_OPTIONS/);
  // Taxonomy correction: internal-only component-preview
  assert.match(types, /AssetVisibility/);
  assert.match(types, /INTERNAL_PURPOSES/);
  assert.match(types, /isInternalPurpose/);
  assert.match(types, /visibility: AssetVisibility/);
  assert.match(types, /internal.*not listed in public/i);
  // Repository maps new columns
  assert.match(repo, /purpose/);
  assert.match(repo, /caption/);
  assert.match(repo, /figma_url/);
  assert.match(repo, /download_available/);
  assert.match(repo, /cover_asset_id/);
  assert.match(repo, /sanitizePurpose|sanitizeTheme/);
  assert.match(repo, /TOKEN_IMPORTS_TABLE/);
  // Schema
  assert.match(schema, /purpose text/);
  assert.match(schema, /caption text/);
  assert.match(schema, /figma_url text/);
  assert.match(schema, /download_available boolean/);
  assert.match(schema, /cover_asset_id/);
  // Migration exists
  assert.ok(migration.length > 0, "Asset purpose migration must exist");
  assert.match(migration, /purpose/);
  assert.match(migration, /caption/);
});

test("real asset picker exists for CMS", async () => {
  const picker = await readProjectFile("components/asset-picker.tsx");
  const studio = await readProjectFile("components/studio.tsx");
  const assetImage = await readProjectFile("components/asset-image.tsx");
  assert.match(picker, /export function AssetPicker/);
  assert.match(picker, /search/i);
  assert.match(picker, /Filter by category|filter.*category/i);
  assert.match(picker, /purpose/i);
  assert.match(picker, /draft/);
  assert.match(picker, /published/);
  assert.match(picker, /fileUrl/);
  // Actual image preview via fileUrl -> img, thumb logic
  assert.match(picker, /asset-picker-thumb|asset-picker-card/);
  assert.match(picker, /ASSET_PURPOSE_OPTIONS/);
  assert.match(studio, /AssetPicker/);
  assert.match(studio, /assetId/);
  // Asset image component provides neutral unavailable states
  assert.match(assetImage, /AssetImage/);
});

test("visual block system upgraded to designer-facing kinds", async () => {
  const types = await readProjectFile("types/content.ts");
  const visualBlock = await readProjectFile("components/visual-block.tsx");
  const studio = await readProjectFile("components/studio.tsx");

  // New kinds
  const requiredKinds = [
    "design-preview",
    "asset-gallery",
    "variant-gallery",
    "state-gallery",
    "token-reference",
    "interactive-preview",
    "anatomy",
    "do-dont",
    "flow-diagram",
    "typography-specimen",
    "spacing-specimen",
    "icon-construction",
  ];
  for (const kind of requiredKinds) {
    assert.match(types, new RegExp(kind), `types must contain ${kind}`);
    assert.match(visualBlock, new RegExp(kind), `visual-block renderer must handle ${kind}`);
  }
  // Backward compat aliases kept
  assert.match(types, /component-preview/);
  assert.match(types, /token-swatch/);
  assert.match(types, /normalizeVisualBlockKind/);

  // VisualBlock type has assetId, GalleryItem, etc.
  assert.match(types, /GalleryItem/);
  assert.match(types, /assetId\?: string/);
  assert.match(types, /variant\?: string/);
  assert.match(types, /figmaUrl\?: string/);
  assert.match(types, /tokenNames\?/);

  // Studio per-kind editor
  assert.match(studio, /VISUAL_BLOCK_KINDS_NEW/);
  assert.match(studio, /VisualBlockEditor/);
  assert.match(studio, /AssetPickerButton/);
  assert.match(studio, /gallery-items-editor|GalleryItems/i);
});

test("portal uses real uploaded visuals and neutral unavailable states", async () => {
  const portal = await readProjectFile("components/portal.tsx");
  const visualBlock = await readProjectFile("components/visual-block.tsx");
  const assetResolver = await readProjectFile("lib/asset-resolver.ts");
  const assetImage = await readProjectFile("components/asset-image.tsx");

  // No hardcoded Continue as primary production preview — old PreviewGlyph path must not be primary
  // It can exist as internal fallback only, but CardVisual / real asset flow must be present
  assert.match(portal, /resolveAsset/);
  assert.match(portal, /CardVisual/);
  assert.match(portal, /card-real-image|hero-real-art|collection-hero-visual|doc-cover/);
  assert.match(portal, /asset-unavailable|card-neutral-placeholder|neutral/i);

  // Visual block renderer must use fileUrl, not hardcoded glyphs
  assert.match(visualBlock, /fileUrl/);
  assert.match(visualBlock, /asset-unavailable|visual-unavailable/);
  // Must not have hardcoded token rows as production source only
  // Token reference should use resolvedTokens
  assert.match(visualBlock, /resolvedTokens|TokenReference/);

  // asset-resolver helper exists
  assert.match(assetResolver, /resolveAsset/);
  assert.match(assetResolver, /isValidFigmaUrl/);
  assert.match(assetResolver, /isDownloadAvailable/);
  assert.match(assetResolver, /requirePublished/);

  // asset-image component exists
  assert.match(assetImage, /AssetImage/);
  assert.match(assetImage, /Visual not available yet/);
});

test("portal link and CTA rules enforced", async () => {
  const portal = await readProjectFile("components/portal.tsx");
  const assetResolver = await readProjectFile("lib/asset-resolver.ts");
  const visualBlock = await readProjectFile("components/visual-block.tsx");

  // Figma URL validation
  assert.match(portal, /isValidFigmaUrl/);
  assert.match(assetResolver, /isValidFigmaUrl/);
  assert.match(assetResolver, /figma\.com/);
  // Download only when file exists
  assert.match(portal, /isDownloadAvailable|downloadAvailable|canDownload/);
  // Resource cards unavailable not clickable
  assert.match(portal, /unavailable.*not.*clickable|resource-card unavailable|aria-disabled/i);
  // No fake href #
  assert.doesNotMatch(portal, /href=\{"#"\}|href='#'|href="#" /);
  // Draft filtering still present
  const repo = await readProjectFile("lib/repository.ts");
  assert.match(repo, /from\(ASSET_TABLE\).*?eq\("status", "published"\)/s);
  // Gallery items use own figmaUrl/download links
  assert.match(visualBlock, /figmaUrl/);
  assert.match(visualBlock, /isDownloadAvailable|download/);
});

test("document templates exist for all four page types", async () => {
  const templates = await readProjectFile("lib/page-templates.ts");
  const picker = await readProjectFile("components/template-picker.tsx");
  const types = await readProjectFile("types/content.ts");
  const studio = await readProjectFile("components/studio.tsx");

  assert.match(templates, /PAGE_TEMPLATES/);
  assert.match(templates, /foundation/);
  assert.match(templates, /component/);
  assert.match(templates, /pattern/);
  assert.match(templates, /resource/);
  assert.match(templates, /makePageFromTemplate/);
  // template labels live in the template library, not hardcoded in picker JSX
  assert.match(templates, /Foundation template/);
  assert.match(templates, /Component template/);
  assert.match(templates, /Pattern template/);
  assert.match(templates, /Resource template/);
  assert.match(picker, /TemplatePicker/);
  assert.match(picker, /PAGE_TEMPLATES/);
  assert.match(studio, /TemplatePicker|makePageFromTemplate/);
  // TemplateFactory does not insert fake final doc copy
  assert.match(templates, /Add a clear|Explain|Describe|List/);
  assert.match(types, /PageTemplateId/);
});

test("structured portal config editor replaces raw textarea as primary", async () => {
  const editor = await readProjectFile("components/portal-config-editor.tsx");
  const studio = await readProjectFile("components/studio.tsx");
  const portalConfig = await readProjectFile("lib/portal-config.ts");

  assert.match(editor, /PortalConfigEditor/);
  assert.match(editor, /navigation/);
  assert.match(editor, /homepage|home/);
  assert.match(editor, /collections/);
  assert.match(editor, /footer/);
  assert.match(editor, /copy/);
  assert.match(editor, /seo/);
  assert.match(editor, /JSON details/);
  assert.match(editor, /AssetPickerButton|heroAssetId/);
  assert.match(studio, /PortalConfigEditor/);
  assert.match(portalConfig, /validatePortalConfig/);
  assert.match(portalConfig, /getDefaultPortalConfig/);
});

test("token persistence: import -> validate -> draft -> publish -> Portal uses published", async () => {
  const tokensLib = await readProjectFile("lib/tokens.ts");
  const tokenResolver = await readProjectFile("lib/token-resolver.ts");
  const studio = await readProjectFile("components/studio.tsx");
  const repo = await readProjectFile("lib/repository.ts");
  const store = await readProjectFile("lib/store.ts");
  const types = await readProjectFile("types/content.ts");

  // Types include TokenImport
  assert.match(types, /TokenImport/);
  assert.match(types, /TokenLibrarySummary/);
  assert.match(types, /tokenImports: TokenImport/);

  // tokens.ts validates structure and aliases
  assert.match(tokensLib, /validateTokenStructure/);
  assert.match(tokensLib, /validateTokenAliases/);
  assert.match(tokensLib, /brokenAliases|broken/i);

  // token-resolver resolves aliases
  assert.match(tokenResolver, /resolveTokenLibrary|getResolvedTokensFromImport/);
  assert.match(tokenResolver, /getPublishedTokenImport/);
  assert.match(tokenResolver, /resolvedValue/);

  // Repository persists token imports
  assert.match(repo, /TOKEN_IMPORTS_TABLE/);
  assert.match(repo, /saveTokenImport/);
  assert.match(repo, /token_imports|TokenImportRow/);
  assert.match(repo, /published_at/);

  // Store supports token imports
  assert.match(store, /tokenImports/);
  assert.match(store, /upsertTokenImport/);

  // Studio tokens flow: draft save, publish blocked when invalid aliases
  assert.match(studio, /TokensManager/);
  assert.match(studio, /Import JSON|handleFileImport/);
  assert.match(studio, /Save as draft|saveDraft/);
  assert.match(studio, /brokenAlias|broken alias|Broken aliases/i);
  assert.match(studio, /Cannot publish|blocked|validat/i);
  assert.match(studio, /never.*edit|original.*never.*edit|never edited/i);
});

test("asset replacement stable by ID preserves usages", async () => {
  const assetEditor = await readProjectFile("components/asset-editor.tsx");
  const repo = await readProjectFile("lib/repository.ts");
  const types = await readProjectFile("types/content.ts");

  // Asset editor preserves ID on replacement
  assert.match(assetEditor, /previousPath|Replacement file saved|same asset ID|ID.*preserved/i);
  assert.match(assetEditor, /filePath|fileUrl/);
  assert.match(assetEditor, /All usages now show|published pages automatically show/i);

  // Visual blocks reference assetId, not fileUrl, so replacement propagates
  assert.match(types, /assetId\?: string/);
  assert.match(repo, /file_path|filePath/);
  // Repo upsert uses onConflict id
  assert.match(repo, /onConflict: "id"/);
});

test("no hardcoded editorial content as production source", async () => {
  const portal = await readProjectFile("components/portal.tsx");
  await readProjectFile("lib/seed-data.ts");

  // Portal should not render hardcoded "Continue" as primary button preview
  // Allow "Continue" only inside token samples or as legacy fallback, but not as the main component demo when asset exists
  // Check that portal uses CardVisual / asset-backed flow instead of PreviewGlyph as sole source
  assert.match(portal, /CardVisual|card-real-image/);

  // seed-data still exists for local preview only, but repository must not import it
  const repo = await readProjectFile("lib/repository.ts");
  assert.doesNotMatch(repo, /from ["']@\/lib\/seed-data["']/);
});

test("component-preview is internal-only, not public asset explorer category", async () => {
  const types = await readProjectFile("types/content.ts");
  const portal = await readProjectFile("components/portal.tsx");
  const categories = await readProjectFile("lib/asset-categories.ts");
  const resolver = await readProjectFile("lib/asset-resolver.ts");
  const repo = await readProjectFile("lib/repository.ts");
  const studioPicker = await readProjectFile("components/asset-picker.tsx");
  const assetEditor = await readProjectFile("components/asset-editor.tsx");
  const visualBlock = await readProjectFile("components/visual-block.tsx");
  const migration = fileExists("supabase/migrations/20260719000009_one_design_asset_visibility.sql")
    ? await readProjectFile("supabase/migrations/20260719000009_one_design_asset_visibility.sql")
    : fileExists("supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql")
      ? await readProjectFile("supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql")
      : "";

  // Type level: internal purpose definition
  assert.match(types, /INTERNAL_PURPOSES.*component-preview/s);
  assert.match(types, /isInternalPurpose/);
  assert.match(types, /assetVisibilityForPurpose/);
  assert.match(types, /visibility/);

  // Public categories unchanged: 7 categories, no component-preview
  assert.match(categories, /slug: "icon"/);
  assert.match(categories, /slug: "icon-illustration"/);
  assert.match(categories, /slug: "illustration"/);
  assert.match(categories, /slug: "logo"/);
  assert.match(categories, /slug: "brand-asset"/);
  assert.match(categories, /slug: "template"/);
  assert.match(categories, /slug: "download"/);
  assert.doesNotMatch(categories, /slug: "component-preview"/);

  // Resolver has internal helpers
  assert.match(resolver, /isInternalAsset/);
  assert.match(resolver, /isPublicAsset|INTERNAL_ASSET_PURPOSES/);
  assert.match(resolver, /component-preview/);

  // Portal: AssetExplorer must NOT have component-preview in public purpose filter
  // It should only show anatomy, variant, state, foundation-visual, cover-visual
  assert.doesNotMatch(portal, /\["component-preview", "anatomy"/);
  assert.match(portal, /anatomy.*variant.*state/s);

  // Portal explorer filters out internal assets
  assert.match(portal, /visibility !== "internal"|purpose !== "component-preview"/);

  // No route /resources/assets/component-preview created
  // Expected routes are only the 7 known categories - check route-audit covers this
  const slugPage = await readProjectFile("app/[[...slug]]/page.tsx");
  // Slug page uses ASSET_CATEGORY_MAP - component-preview is not in it
  assert.doesNotMatch(slugPage, /component-preview/);

  // Studio: component-preview IS selectable
  // Studio picker uses ASSET_PURPOSE_OPTIONS which includes component-preview (internal)
  assert.match(studioPicker, /ASSET_PURPOSE_OPTIONS|component-preview|Component preview/);
  assert.match(assetEditor, /component-preview|Asset purpose/);
  // Visual block can render component-preview via published doc relation
  assert.match(visualBlock, /design-preview/);

  // Repository: fetchPublishedSite logic for internal assets only via published doc relation
  assert.match(repo, /component-preview|isInternalAssetRow|INTERNAL_PURPOSES|visibility/);

  // Migration for visibility column
  assert.ok(migration.length > 0, "visibility migration must exist");
  assert.match(migration, /visibility/);
});

test("no Figma API, no localStorage for CMS content", async () => {
  const repo = await readProjectFile("lib/repository.ts");
  const store = await readProjectFile("lib/store.ts");
  const portal = await readProjectFile("components/portal.tsx");
  const studio = await readProjectFile("components/studio.tsx");
  const assetPicker = await readProjectFile("components/asset-picker.tsx");

  // Must not use Figma API / OAuth
  assert.doesNotMatch(portal, /figma.*api|Figma OAuth/i);
  assert.doesNotMatch(studio, /figma.*api|Figma OAuth|figma.*oauth/i);
  assert.doesNotMatch(repo, /figma.*api/i);
  assert.doesNotMatch(assetPicker, /figma.*api/i);

  // No localStorage/sessionStorage for CMS data, only theme
  assert.doesNotMatch(store, /localStorage|sessionStorage/);
  assert.doesNotMatch(repo, /localStorage|sessionStorage/);
  // Portal may use localStorage for theme only
  if ((portal.match(/localStorage/g) || []).length > 0) {
    assert.match(portal, /theme/);
  }
  // Studio must not use sessionStorage for CMS content anymore
  assert.doesNotMatch(studio, /sessionStorage\.setItem.*one-design/i);
});
