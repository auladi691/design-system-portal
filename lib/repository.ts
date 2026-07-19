import { getSupabase } from "@/lib/supabase-client";
import { seedData } from "@/lib/seed-data";
import type { Asset, ContentPage, Release, SiteData, SiteSettings } from "@/types/content";

export const ASSET_TABLE = "assets";
export const PAGES_TABLE = "pages";
export const RELEASES_TABLE = "releases";
export const SETTINGS_TABLE = "site_settings";

export type RealtimeListener = () => void;

type AssetRow = {
  id: string;
  type: Asset["type"];
  name: string;
  slug: string;
  category: string;
  brand: Asset["brand"];
  status: Asset["status"];
  description: string;
  keywords: string[] | null;
  metadata: Record<string, unknown> | null;
  version: string;
  alt_text: string | null;
  file_path: string | null;
  file_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  original_file_name: string | null;
  created_at: string;
  updated_at: string;
};

type PageRow = {
  id: string;
  type: ContentPage["type"];
  title: string;
  slug: string;
  summary: string;
  category: string;
  status: ContentPage["status"];
  maturity: ContentPage["maturity"];
  version: string;
  owner: string;
  figma_url: string | null;
  featured: boolean | null;
  content: ContentPage["sections"] | null;
  created_at: string;
  updated_at: string;
};

type ReleaseRow = {
  id: string;
  version: string;
  title: string;
  summary: string;
  status: Release["status"];
  changes: string[] | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  id: string;
  content: SiteSettings;
  updated_at: string;
};

export type { SettingsRow };

function mapAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    slug: row.slug,
    category: row.category,
    brand: row.brand,
    status: row.status,
    description: row.description ?? "",
    keywords: row.keywords ?? [],
    glyph: (row.metadata?.glyph as string) ?? row.name.slice(0, 1).toUpperCase(),
    version: row.version ?? "1.0",
    updatedAt: formatDate(row.updated_at),
    altText: row.alt_text ?? "",
    filePath: row.file_path ?? null,
    fileUrl: row.file_url ?? null,
    mimeType: row.mime_type ?? null,
    fileSize: row.file_size ?? null,
    originalFileName: row.original_file_name ?? null,
    createdAt: formatDate(row.created_at),
  };
}

function mapPage(row: PageRow): ContentPage {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    category: row.category ?? "General",
    status: row.status,
    maturity: row.maturity ?? "experimental",
    version: row.version ?? "1.0",
    owner: row.owner ?? "Design System Team",
    updatedAt: formatDate(row.updated_at),
    figmaUrl: row.figma_url ?? undefined,
    featured: row.featured ?? false,
    sections: row.content ?? [],
  };
}

function mapRelease(row: ReleaseRow): Release {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    summary: row.summary ?? "",
    status: row.status,
    date: row.release_date ?? formatDate(row.updated_at),
    changes: row.changes ?? [],
  };
}

function formatDate(value: string | null): string {
  if (!value) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function fetchPublishedSite(): Promise<SiteData | null> {
  const client = getSupabase();
  if (!client) return seedData;
  try {
    const [pagesRes, assetsRes, releasesRes, settingsRes] = await Promise.all([
      client.from(PAGES_TABLE).select("*").eq("status", "published").order("updated_at", { ascending: false }),
      client.from(ASSET_TABLE).select("*").eq("status", "published").order("updated_at", { ascending: false }),
      client.from(RELEASES_TABLE).select("*").eq("status", "published").order("release_date", { ascending: false }),
      client.from(SETTINGS_TABLE).select("*").eq("id", "default").maybeSingle(),
    ]);
    if (pagesRes.error) throw pagesRes.error;
    if (assetsRes.error) throw assetsRes.error;
    if (releasesRes.error) throw releasesRes.error;
    if (settingsRes.error) throw settingsRes.error;
    const settings: SiteSettings = {
      name: settingsRes.data?.content?.name ?? seedData.settings.name,
      tagline: settingsRes.data?.content?.tagline ?? seedData.settings.tagline,
      description: settingsRes.data?.content?.description ?? seedData.settings.description,
      visibility: settingsRes.data?.content?.visibility ?? seedData.settings.visibility,
    };
    return {
      settings,
      pages: (pagesRes.data as PageRow[]).map(mapPage),
      assets: (assetsRes.data as AssetRow[]).map(mapAsset),
      releases: (releasesRes.data as ReleaseRow[]).map(mapRelease),
    };
  } catch (error) {
    console.warn("fetchPublishedSite failed, falling back to seed data:", error);
    return seedData;
  }
}

export async function fetchAdminSite(): Promise<SiteData | null> {
  const client = getSupabase();
  if (!client) return seedData;
  try {
    const [pagesRes, assetsRes, releasesRes, settingsRes] = await Promise.all([
      client.from(PAGES_TABLE).select("*").order("updated_at", { ascending: false }),
      client.from(ASSET_TABLE).select("*").order("updated_at", { ascending: false }),
      client.from(RELEASES_TABLE).select("*").order("release_date", { ascending: false }),
      client.from(SETTINGS_TABLE).select("*").eq("id", "default").maybeSingle(),
    ]);
    if (pagesRes.error) throw pagesRes.error;
    if (assetsRes.error) throw assetsRes.error;
    if (releasesRes.error) throw releasesRes.error;
    if (settingsRes.error) throw settingsRes.error;
    const settings: SiteSettings = {
      name: settingsRes.data?.content?.name ?? seedData.settings.name,
      tagline: settingsRes.data?.content?.tagline ?? seedData.settings.tagline,
      description: settingsRes.data?.content?.description ?? seedData.settings.description,
      visibility: settingsRes.data?.content?.visibility ?? seedData.settings.visibility,
    };
    return {
      settings,
      pages: (pagesRes.data as PageRow[]).map(mapPage),
      assets: (assetsRes.data as AssetRow[]).map(mapAsset),
      releases: (releasesRes.data as ReleaseRow[]).map(mapRelease),
    };
  } catch (error) {
    console.warn("fetchAdminSite failed, falling back to seed data:", error);
    return seedData;
  }
}

type AssetInsert = {
  id?: string;
  type: Asset["type"];
  name: string;
  slug: string;
  category: string;
  brand: Asset["brand"];
  status: Asset["status"];
  description: string;
  keywords: string[];
  metadata: { glyph: string };
  version: string;
  alt_text: string;
  file_path: string | null;
  file_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  original_file_name: string | null;
};

export function assetToInsert(asset: Asset): AssetInsert {
  return {
    id: asset.id,
    type: asset.type,
    name: asset.name,
    slug: asset.slug,
    category: asset.category,
    brand: asset.brand,
    status: asset.status,
    description: asset.description,
    keywords: asset.keywords,
    metadata: { glyph: asset.glyph },
    version: asset.version,
    alt_text: asset.altText,
    file_path: asset.filePath,
    file_url: asset.fileUrl,
    mime_type: asset.mimeType,
    file_size: asset.fileSize,
    original_file_name: asset.originalFileName,
  };
}

export async function saveAsset(asset: Asset): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const insert = assetToInsert(asset);
  const { error } = await client.from(ASSET_TABLE).upsert(insert, { onConflict: "id" });
  if (error) {
    console.warn("saveAsset failed:", error.message);
    return { ok: false, error: friendlyErrorMessage(error) };
  }
  return { ok: true, error: null };
}

export async function deleteAssetRecord(assetId: string): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const { error } = await client.from(ASSET_TABLE).delete().eq("id", assetId);
  if (error) return { ok: false, error: friendlyErrorMessage(error) };
  return { ok: true, error: null };
}

export async function savePage(page: ContentPage): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const { error } = await client.from(PAGES_TABLE).upsert(
    {
      id: page.id,
      type: page.type,
      title: page.title,
      slug: page.slug,
      summary: page.summary,
      category: page.category,
      status: page.status,
      maturity: page.maturity,
      version: page.version,
      owner: page.owner,
      figma_url: page.figmaUrl ?? null,
      featured: page.featured ?? false,
      content: page.sections,
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false, error: friendlyErrorMessage(error) };
  return { ok: true, error: null };
}

export async function saveRelease(release: Release): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const { error } = await client.from(RELEASES_TABLE).upsert(
    {
      id: release.id,
      version: release.version,
      title: release.title,
      summary: release.summary,
      status: release.status,
      changes: release.changes,
      release_date: release.date,
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false, error: friendlyErrorMessage(error) };
  return { ok: true, error: null };
}

export async function saveSettings(settings: SiteSettings): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const { error } = await client.from(SETTINGS_TABLE).upsert(
    { id: "default", content: settings },
    { onConflict: "id" },
  );
  if (error) return { ok: false, error: friendlyErrorMessage(error) };
  return { ok: true, error: null };
}

export function subscribeToAssets(callback: RealtimeListener): () => void {
  const client = getSupabase();
  if (!client) return () => {};
  const channel = client
    .channel("assets-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: ASSET_TABLE }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: PAGES_TABLE }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: RELEASES_TABLE }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: SETTINGS_TABLE }, callback)
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

export function friendlyErrorMessage(error: { message?: string } | unknown): string {
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message) : "";
  if (!message) return "Something went wrong. Try again in a moment.";
  if (/duplicate key/i.test(message)) return "An asset with this name already exists. Try a different name.";
  if (/permission denied|policy/i.test(message)) return "You don't have permission to do this. Sign in as an administrator.";
  if (/network|fetch|Failed to fetch/i.test(message)) return "We couldn't reach the server. Check your connection and try again.";
  if (/JWT|token|expired|session/i.test(message)) return "Your session has expired. Sign in again to continue.";
  return "Something went wrong. Try again in a moment.";
}
