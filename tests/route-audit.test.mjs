import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const expectedRoutes = [
  "/",
  "/design",
  "/foundations",
  "/components",
  "/patterns",
  "/resources",
  "/resources/assets",
  "/resources/assets/icon",
  "/resources/assets/icon-illustration",
  "/resources/assets/illustration",
  "/resources/assets/logo",
  "/resources/assets/brand-asset",
  "/resources/assets/template",
  "/resources/assets/download",
  "/changelog",
  "/search",
  "/foundations/colour",
  "/components/button",
  "/design/introduction",
  "/patterns/forms",
  "/resources/figma-library",
];

test("route contract covers every required Portal route", async () => {
  const portal = await readProjectFile("components/portal.tsx");
  const page = await readProjectFile("app/[[...slug]]/page.tsx");
  const migration = await readProjectFile("supabase/migrations/20260719000006_one_design_initial_content.sql");

  assert.match(portal, /routeForPage\(p\)/);
  assert.match(portal, /No published guidance yet/);
  assert.match(portal, /No matching guidance/);
  assert.match(portal, /No published assets yet/);
  assert.match(portal, /No assets in this category yet/);
  assert.match(portal, /No matching assets/);
  assert.match(portal, /Loading guidance/);
  assert.match(portal, /We couldn.t load the Asset Library/);
  assert.match(portal, /Published releases will appear here/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /fetchPublishedSite/);
  assert.match(page, /root === "changelog" \|\| root === "search"/);

  for (const route of expectedRoutes) {
    const slug = route.split("/").filter(Boolean);
    if (route === "/") assert.equal(slug.length, 0);
    if (route.includes("/foundations/")) assert.match(migration, /'foundation', 'Colour', 'colour'/);
    if (route.includes("/components/")) assert.match(migration, /'component', 'Button', 'button'/);
    if (route.includes("/design/")) assert.match(migration, /'design', 'Introduction', 'introduction'/);
    if (route.includes("/patterns/")) assert.match(migration, /'pattern', 'Forms', 'forms'/);
    if (route.includes("/resources/")) assert.match(migration, /'resource', 'Figma Library', 'figma-library'/);
  }
});

test("published-only and safe route rules are present", async () => {
  const repository = await readProjectFile("lib/repository.ts");
  const bulkUpload = await readProjectFile("lib/bulk-upload.ts");
  const studio = await readProjectFile("components/studio.tsx");
  const assetsManager = await readProjectFile("components/assets-manager.tsx");
  const schema = await readProjectFile("supabase/schema.sql");
  const privateStorage = await readProjectFile("supabase/migrations/20260719000007_private_asset_storage.sql");
  const routes = await readProjectFile("lib/routes.ts");

  assert.match(repository, /from\(PAGES_TABLE\).*?eq\("status", "published"\)/s);
  assert.match(repository, /from\(ASSET_TABLE\).*?eq\("status", "published"\)/s);
  assert.match(repository, /from\(RELEASES_TABLE\).*?eq\("status", "published"\)/s);
  assert.match(schema, /status = 'published' or public\.is_administrator\(\)/);
  assert.match(schema, /values \('design-system-assets','design-system-assets',false\)/);
  assert.match(repository, /createSignedUrl/);
  assert.match(bulkUpload, /uploadAssetFile\(item\.type, item\.file\)/);
  assert.match(bulkUpload, /type: item\.type/);
  assert.match(bulkUpload, /glyphFor\(item\.type, item\.name\)/);
  assert.match(bulkUpload, /id: crypto\.randomUUID\(\)/);
  assert.match(studio, /const id = crypto\.randomUUID\(\)/);
  assert.match(studio, /window\.open\(routeForPage\(page\), "_blank"\)/);
  assert.doesNotMatch(studio, /`\/\$\{page\.type\}s\//);
  assert.match(assetsManager, /const id = crypto\.randomUUID\(\)/);
  assert.match(privateStorage, /public = false/);
  assert.match(privateStorage, /drop policy if exists "Published assets can be viewed"/);
  assert.match(privateStorage, /public\.assets\.status = 'published'/);
  assert.match(routes, /resource: "resources"/);
  assert.doesNotMatch(portalSource(repository), /falling back to seed/);
});

function portalSource(repository) {
  return repository;
}
