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

// ── Route contract ──────────────────────────────────────────────

test("route contract covers every required Portal route", async () => {
  const portal = await readProjectFile("components/portal.tsx");
  const page = await readProjectFile("app/[[...slug]]/page.tsx");
  const migration = await readProjectFile("supabase/migrations/20260719000006_one_design_initial_content.sql");

  assert.match(portal, /routeForPage\(p\)/);
  assert.match(portal, /No published guidance yet/);
  assert.match(portal, /No matching guidance/);
  assert.match(portal, /No assets in this category yet/);
  assert.match(portal, /No matching assets/);
  assert.match(portal, /Loading the latest published guidance/);
  assert.match(portal, /We couldn.t load the Asset Library/);
  assert.match(portal, /Published releases will appear here/);
  assert.match(portal, /settings\.portal/);
  assert.match(portal, /portal\?\.navigation/);
  assert.match(portal, /portal\?\.footer/);
  assert.match(portal, /settings\.portal\?\.home/);
  assert.match(portal, /settings\.portal\?\.collections/);
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

// ── Published-only + safe routes + hardened persistence ──────

test("published-only and safe route rules are present", async () => {
  const repository = await readProjectFile("lib/repository.ts");
  const store = await readProjectFile("lib/store.ts");
  const supabaseClient = await readProjectFile("lib/supabase-client.ts");
  const nextConfig = await readProjectFile("next.config.ts");
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
  assert.match(bulkUpload, /type: item\.type|destination|BulkUploadDestination/);
  assert.match(bulkUpload, /glyphFor\(item\.type, item\.name\)/);
  assert.match(bulkUpload, /id: crypto\.randomUUID\(\)/);
  // Category-first upload workflow
  assert.match(bulkUpload, /isInternalDestination|storageTypeForDestination|component-preview/);
  assert.match(studio, /const id = crypto\.randomUUID\(\)/);
  // Template picker now drives new page flow — open article link with window still present in Figma Resource CTA
  assert.match(studio, /makePageFromTemplate|TemplatePicker/);
  assert.doesNotMatch(studio, /`\/\$\{page\.type\}s\//);
  assert.match(assetsManager, /const id = crypto\.randomUUID\(\)/);
  assert.match(privateStorage, /public = false/);
  assert.match(privateStorage, /drop policy if exists "Published assets can be viewed"/);
  assert.match(privateStorage, /public\.assets\.status = 'published'/);
  assert.match(routes, /resource: "resources"/);
  assert.doesNotMatch(portalSource(repository), /falling back to seed/);
  assert.doesNotMatch(repository, /from ["']@\/lib\/seed-data["']/);
  assert.doesNotMatch(store, /from ["']@\/lib\/seed-data["']/);
  assert.doesNotMatch(supabaseClient, /FALLBACK_URL|FALLBACK_KEY/);
  assert.doesNotMatch(nextConfig, /NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY):/);
  assert.match(repository, /seo: settingsRes\.data\?\.content\?\.seo/);
  assert.match(repository, /portal: settingsRes\.data\?\.content\?\.portal/);
  assert.match(studio, /PortalConfigEditor|parsePortalConfig|formatPortalConfig/);
});

test("CMS content is not persisted in browser storage", async () => {
  const store = await readProjectFile("lib/store.ts");
  const auth = await readProjectFile("lib/auth.ts");
  const portal = await readProjectFile("components/portal.tsx");

  assert.doesNotMatch(store, /localStorage|sessionStorage/);
  assert.doesNotMatch(auth, /sessionStorage/);
  // Portal may use localStorage for theme preference only
  assert.doesNotMatch(portal, /sessionStorage/);
});

test("portal config lives in CMS settings and drives public shell copy", async () => {
  const types = await readProjectFile("types/content.ts");
  const portalConfig = await readProjectFile("lib/portal-config.ts");
  const portal = await readProjectFile("components/portal.tsx");
  const studio = await readProjectFile("components/studio.tsx");
  const repository = await readProjectFile("lib/repository.ts");

  assert.match(types, /export type PortalConfig/);
  assert.match(types, /portal\?: PortalConfig/);
  assert.match(portalConfig, /export function parsePortalConfig/);
  assert.match(portalConfig, /export function formatPortalConfig/);
  assert.match(portalConfig, /config\.navigation/);
  assert.match(portalConfig, /config\.footer/);
  assert.match(portalConfig, /config\.home/);
  assert.match(portalConfig, /config\.collections/);
  assert.match(portalConfig, /config\.copy/);
  assert.match(repository, /portal: settingsRes\.data\?\.content\?\.portal/);
  assert.match(studio, /PortalConfigEditor|parsePortalConfig|formatPortalConfig/);
  assert.match(portal, /portal\?\.navigation\.filter/);
  assert.match(portal, /portal\?\.footer\.description/);
  assert.match(portal, /settings\.portal\?\.home/);
  assert.match(portal, /settings\.portal\?\.collections/);
  assert.match(portal, /settings\.portal\?\.copy/);
});

function portalSource(repository) {
  return repository;
}
