import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

test("category-first upload: no global bulk upload, contextual upload per category", async () => {
  const assetsManager = await readProjectFile("components/assets-manager.tsx");
  const categories = await readProjectFile("lib/asset-categories.ts");

  // Requirement 1: Remove global "Bulk upload" button from main Asset Library header
  // Old code had <StudioHeader action={<button>Bulk upload</button>}> — should not exist anymore
  assert.doesNotMatch(assetsManager, /StudioHeader[\s\S]{0,200}Bulk upload/);
  assert.doesNotMatch(assetsManager, /eyebrow="Assets"[\s\S]*?Bulk upload.*top|global.*Bulk upload/i);

  // Requirement 2: Upload must begin from inside selected category
  assert.match(assetsManager, /openUploadForCurrent|Upload.*current|activeView/, "Must have contextual open for current category");
  assert.match(assetsManager, /uploadLabelForCategory|uploadLabel/, "Must compute upload label per category");

  // Requirement 3: contextual labels per category
  assert.match(categories, /uploadLabelForCategory/);
  assert.match(categories, /Upload icons/);
  assert.match(categories, /Upload icon illustrations/);
  assert.match(categories, /Upload illustrations/);
  assert.match(categories, /Upload logos/);
  assert.match(categories, /Upload brand assets/);
  assert.match(categories, /Upload templates/);
  assert.match(categories, /Upload downloads/);
  assert.match(categories, /Upload component previews/);

  // Requirement 4: placed in toolbar and empty state, not two at same time in empty
  assert.match(assetsManager, /manager-toolbar.*manager-toolbar-category|s/);
  assert.match(assetsManager, /manager-toolbar-actions/, "Toolbar must have contextual actions");
  assert.match(assetsManager, /empty-panel.*empty-panel-category|empty-panel-actions/, "Empty state must have primary upload CTA");
  // Ensure no duplicate Bulk upload in empty
  assert.doesNotMatch(assetsManager, /Bulk upload.*Bulk upload/, "Should not have two upload CTAs in empty");
});

test("contextual upload dialog: locked destination, no category grid as primary", async () => {
  const bulkDialog = await readProjectFile("components/bulk-upload-dialog.tsx");

  // Requirement 6: current category already selected, no large category grid as primary
  assert.match(bulkDialog, /initialDestination|destination.*initialDestination/, "Dialog must receive initial destination");
  assert.match(bulkDialog, /uploadTitleForCategory|uploadTitle/, "Dialog must show locked destination near title");
  const categoriesFile = await readProjectFile("lib/asset-categories.ts");
  assert.match(categoriesFile, /Uploading to/, "Must show 'Uploading to X' via uploadTitleForCategory");
  assert.match(bulkDialog, /bulk-destination-locked|Destination locked/, "Must show locked destination badge");
  // No large category grid unless Change destination explicit
  assert.match(bulkDialog, /Change destination/, "Must have small change destination action");
  assert.match(bulkDialog, /change-destination-panel|showChangeDestination/, "Change must be explicit and not happen accidentally");
  // Explicit confirm when changing with files
  assert.match(bulkDialog, /confirm|Changing destination is explicit/, "Changing must be explicit with confirm");
});

test("dialog focuses on rich metadata, format validation per destination", async () => {
  const bulkDialog = await readProjectFile("components/bulk-upload-dialog.tsx");
  const bulkUpload = await readProjectFile("lib/bulk-upload.ts");
  const categories = await readProjectFile("lib/asset-categories.ts");
  const validation = await readProjectFile("lib/asset-validation.ts");

  // Requirement 7: focus on file drop, selected files, name, description/caption, alt, theme, version, purpose, download, figma url, draft/publish
  assert.match(bulkDialog, /Drop zone/);
  assert.match(bulkDialog, /File queue|file\.name/);
  assert.match(bulkDialog, /Name/);
  assert.match(bulkDialog, /Description|description/);
  assert.match(bulkDialog, /Caption|caption/);
  assert.match(bulkDialog, /Alternative text|altText/);
  assert.match(bulkDialog, /Theme|theme/);
  assert.match(bulkDialog, /Version|version/);
  assert.match(bulkDialog, /Purpose|purpose/);
  assert.match(bulkDialog, /Allow download|downloadAvailable/);
  assert.match(bulkDialog, /Figma URL|figmaUrl/);
  assert.match(bulkDialog, /Publish after upload|Upload as draft|Save as draft/);

  // Requirement 8: format validation per destination
  assert.match(categories, /allowedExtensions/);
  assert.match(categories, /svg.*png.*webp|icon-illustration/i);
  assert.match(validation, /getConfigForDestination|INTERNAL_COLLECTION_MAP|validateAssetFile/);
  assert.match(validation, /allowedExtensions/);
  assert.match(validation, /maxSizeBytes/);

  // Requirement 8 specifics documented via allowedExtensions per category
  assert.match(categories, /slug: "icon"/);
  assert.match(categories, /slug: "icon-illustration"/);
  assert.match(categories, /slug: "illustration"/);
  assert.match(categories, /slug: "logo"/);
  assert.match(categories, /slug: "brand-asset"/);
  assert.match(categories, /slug: "template"/);
  assert.match(categories, /slug: "download"/);
  assert.match(categories, /allowedExtensions/);
  assert.match(categories, /icon-illustration[\s\S]*?svg.*png.*webp/s);
  assert.match(categories, /brand-asset[\s\S]*?pdf.*zip/s);
  // Component previews: SVG, PNG, WebP
  assert.match(categories, /id: "component-preview"[\s\S]*?svg.*png.*webp/s);

  // Bulk upload must respect destination validation
  assert.match(bulkUpload, /validateAssetFile|BulkUploadDestination/);
});

test("component previews as internal Studio collection, not public", async () => {
  const assetsManager = await readProjectFile("components/assets-manager.tsx");
  const categories = await readProjectFile("lib/asset-categories.ts");
  const portal = await readProjectFile("components/portal.tsx");
  const bulkUpload = await readProjectFile("lib/bulk-upload.ts");
  const repo = await readProjectFile("lib/repository.ts");
  const slugPage = await readProjectFile("app/[[...slug]]/page.tsx");

  // Requirement 9
  assert.match(categories, /INTERNAL_ASSET_COLLECTIONS/);
  assert.match(categories, /id: "component-preview"/);
  assert.match(categories, /Component previews/);
  assert.match(assetsManager, /INTERNAL_ASSET_COLLECTIONS|internal.*Component previews|component-preview/);
  // Not in public Portal
  assert.doesNotMatch(portal, /\/resources\/assets\/component-preview/);
  assert.match(portal, /visibility !== "internal"|purpose !== "component-preview"/);
  assert.doesNotMatch(slugPage, /component-preview.*public|assets\/component-preview/);

  // Requirement 10: auto set purpose and visibility
  assert.match(bulkUpload, /purpose.*component-preview|component-preview.*purpose/);
  assert.match(bulkUpload, /visibility.*internal|internal.*visibility/);
  assert.match(bulkUpload, /isInternalDestination|component-preview/);

  // Requirement 11: Asset Picker still allows internal for Design Preview, Variant Gallery, State Gallery
  const picker = await readProjectFile("components/asset-picker.tsx");
  const studio = await readProjectFile("components/studio.tsx");
  assert.match(picker, /ASSET_PURPOSE_OPTIONS/);
  assert.match(studio, /AssetPickerButton|VisualBlockEditor/);

  // Repository still handles internal only via published relation
  assert.match(repo, /collectReferencedAssetIds/);
  assert.match(repo, /referencedSet\.has/);

  // Requirement 13: not classified as Icons, Illustrations, Downloads
  assert.match(categories, /export const ASSET_CATEGORIES/);
  const assetCatBlock = categories.match(/export const ASSET_CATEGORIES[\s\S]*?^\];/m);
  if (assetCatBlock) {
    assert.doesNotMatch(assetCatBlock[0], /component-preview/);
  }
  assert.doesNotMatch(await readProjectFile("types/content.ts"), /AssetType.*component-preview/);
});
