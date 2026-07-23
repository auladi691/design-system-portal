import { getSupabase, STORAGE_BUCKET } from "@/lib/supabase-client";
import { emptySiteData } from "@/lib/empty-site-data";
import type {
  Asset,
  AssetPurpose,
  AssetTheme,
  ContentPage,
  Release,
  SiteData,
  SiteSettings,
  TokenImport,
  TokenLibrarySummary,
} from "@/types/content";

export const ASSET_TABLE = "assets";
export const PAGES_TABLE = "pages";
export const RELEASES_TABLE = "releases";
export const SETTINGS_TABLE = "site_settings";
export const TOKEN_IMPORTS_TABLE = "token_imports";

export type RealtimeListener = () => void;

export type SiteFetchResult = {
  data: SiteData;
  error: string | null;
  isPreview: boolean;
};

type AssetRow = {
  id: string;
  type: Asset["type"];
  name: string;
  slug: string;
  category: string;
  brand: Asset["brand"];
  purpose?: string | null;
  status: Asset["status"];
  description: string;
  keywords: string[] | null;
  metadata: Record<string, unknown> | null;
  version: string;
  alt_text: string | null;
  caption?: string | null;
  theme?: string | null;
  figma_url?: string | null;
  download_available?: boolean | null;
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
  cover_asset_id?: string | null;
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

type TokenImportRow = {
  id: string;
  file_name: string;
  source_json: unknown;
  summary: Record<string, unknown> | null;
  status: TokenImport["status"];
  created_at: string;
  published_at: string | null;
};

export type { SettingsRow };

function formatDate(value: string | null): string {
  if (!value) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sanitizePurpose(value: unknown): AssetPurpose {
  const allowed: AssetPurpose[] = [
    "component-preview",
    "anatomy",
    "variant",
    "state",
    "pattern-flow",
    "foundation-visual",
    "cover-visual",
    "general-asset",
  ];
  if (typeof value === "string" && (allowed as string[]).includes(value)) return value as AssetPurpose;
  return "general-asset";
}

function sanitizeTheme(value: unknown): AssetTheme {
  if (value === "light" || value === "dark" || value === "both") return value;
  return "both";
}

async function mapAsset(row: AssetRow, client: NonNullable<ReturnType<typeof getSupabase>>): Promise<Asset> {
  let fileUrl: string | null = null;
  if (row.file_path) {
    try {
      const signed = await client.storage.from(STORAGE_BUCKET).createSignedUrl(row.file_path, 3600);
      fileUrl = signed.data?.signedUrl ?? null;
    } catch {
      fileUrl = null;
    }
  }
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    slug: row.slug,
    category: row.category,
    brand: row.brand,
    purpose: sanitizePurpose(row.purpose),
    status: row.status,
    description: row.description ?? "",
    keywords: row.keywords ?? [],
    glyph: (row.metadata?.glyph as string) ?? row.name.slice(0, 1).toUpperCase(),
    version: row.version ?? "1.0",
    updatedAt: formatDate(row.updated_at),
    altText: row.alt_text ?? "",
    caption: (row.caption as string) ?? "",
    theme: sanitizeTheme(row.theme),
    figmaUrl: (row.figma_url as string) ?? undefined,
    downloadAvailable: row.download_available ?? true,
    filePath: row.file_path ?? null,
    fileUrl,
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
    coverAssetId: (row.cover_asset_id as string) ?? undefined,
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

function mapTokenImport(row: TokenImportRow): TokenImport {
  const summaryRaw = (row.summary ?? {}) as Record<string, unknown>;
  const summary: TokenLibrarySummary = {
    fileName: (summaryRaw.fileName as string) ?? row.file_name,
    total: (summaryRaw.total as number) ?? 0,
    references: (summaryRaw.references as number) ?? 0,
    uniqueReferences: (summaryRaw.uniqueReferences as number) ?? 0,
    withDescription: (summaryRaw.withDescription as number) ?? 0,
    groups: (summaryRaw.groups as TokenLibrarySummary["groups"]) ?? [],
  };
  const validationErrors = (summaryRaw.validationErrors as string[]) ?? [];
  const validationBrokenAliases = (summaryRaw.validationBrokenAliases as string[]) ?? [];
  return {
    id: row.id,
    fileName: row.file_name,
    sourceJson: row.source_json,
    summary,
    status: row.status,
    createdAt: formatDate(row.created_at),
    publishedAt: row.published_at ? formatDate(row.published_at) : null,
    validationErrors,
    validationBrokenAliases,
  };
}

export async function fetchPublishedSite(): Promise<SiteFetchResult> {
  const client = getSupabase();
  if (!client) return { data: emptySiteData, error: "Supabase is not configured.", isPreview: false };
  try {
    const [pagesRes, assetsRes, releasesRes, settingsRes, tokenImportsRes] = await Promise.all([
      client.from(PAGES_TABLE).select("*").eq("status", "published").order("updated_at", { ascending: false }),
      client.from(ASSET_TABLE).select("*").eq("status", "published").order("updated_at", { ascending: false }),
      client.from(RELEASES_TABLE).select("*").eq("status", "published").order("release_date", { ascending: false }),
      client.from(SETTINGS_TABLE).select("*").eq("id", "default").maybeSingle(),
      client.from(TOKEN_IMPORTS_TABLE).select("*").eq("status", "published").order("published_at", { ascending: false }),
    ]);
    if (pagesRes.error) throw pagesRes.error;
    if (assetsRes.error) throw assetsRes.error;
    if (releasesRes.error) throw releasesRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (tokenImportsRes.error && !/does not exist/i.test(tokenImportsRes.error.message)) throw tokenImportsRes.error;
    const settings: SiteSettings = {
      name: settingsRes.data?.content?.name ?? "",
      tagline: settingsRes.data?.content?.tagline ?? "",
      description: settingsRes.data?.content?.description ?? "",
      visibility: settingsRes.data?.content?.visibility ?? "unlisted",
      seo: settingsRes.data?.content?.seo ?? { title: "", description: "" },
      portal: settingsRes.data?.content?.portal,
    };
    return {
      data: {
        settings,
        pages: (pagesRes.data as PageRow[]).map(mapPage),
        assets: await Promise.all((assetsRes.data as AssetRow[]).map((row) => mapAsset(row, client))),
        releases: (releasesRes.data as ReleaseRow[]).map(mapRelease),
        tokenImports: ((tokenImportsRes.data as TokenImportRow[]) ?? []).map(mapTokenImport),
      },
      error: null,
      isPreview: false,
    };
  } catch (error) {
    return { data: emptySiteData, error: friendlyErrorMessage(error), isPreview: false };
  }
}

export async function fetchAdminSite(): Promise<SiteFetchResult> {
  const client = getSupabase();
  if (!client) return { data: emptySiteData, error: "Supabase is not configured.", isPreview: false };
  try {
    const [pagesRes, assetsRes, releasesRes, settingsRes, tokenImportsRes] = await Promise.all([
      client.from(PAGES_TABLE).select("*").order("updated_at", { ascending: false }),
      client.from(ASSET_TABLE).select("*").order("updated_at", { ascending: false }),
      client.from(RELEASES_TABLE).select("*").order("release_date", { ascending: false }),
      client.from(SETTINGS_TABLE).select("*").eq("id", "default").maybeSingle(),
      client.from(TOKEN_IMPORTS_TABLE).select("*").order("created_at", { ascending: false }),
    ]);
    if (pagesRes.error) throw pagesRes.error;
    if (assetsRes.error) throw assetsRes.error;
    if (releasesRes.error) throw releasesRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (tokenImportsRes.error && !/does not exist/i.test(tokenImportsRes.error.message)) throw tokenImportsRes.error;
    const settings: SiteSettings = {
      name: settingsRes.data?.content?.name ?? "",
      tagline: settingsRes.data?.content?.tagline ?? "",
      description: settingsRes.data?.content?.description ?? "",
      visibility: settingsRes.data?.content?.visibility ?? "unlisted",
      seo: settingsRes.data?.content?.seo ?? { title: "", description: "" },
      portal: settingsRes.data?.content?.portal,
    };
    return {
      data: {
        settings,
        pages: (pagesRes.data as PageRow[]).map(mapPage),
        assets: await Promise.all((assetsRes.data as AssetRow[]).map((row) => mapAsset(row, client))),
        releases: (releasesRes.data as ReleaseRow[]).map(mapRelease),
        tokenImports: ((tokenImportsRes.data as TokenImportRow[]) ?? []).map(mapTokenImport),
      },
      error: null,
      isPreview: false,
    };
  } catch (error) {
    return { data: emptySiteData, error: friendlyErrorMessage(error), isPreview: false };
  }
}

type AssetInsert = {
  id?: string;
  type: Asset["type"];
  name: string;
  slug: string;
  category: string;
  brand: Asset["brand"];
  purpose: AssetPurpose;
  status: Asset["status"];
  description: string;
  keywords: string[];
  metadata: { glyph: string };
  version: string;
  alt_text: string;
  caption: string;
  theme: AssetTheme;
  figma_url: string | null;
  download_available: boolean;
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
    purpose: asset.purpose,
    status: asset.status,
    description: asset.description,
    keywords: asset.keywords,
    metadata: { glyph: asset.glyph },
    version: asset.version,
    alt_text: asset.altText,
    caption: asset.caption,
    theme: asset.theme,
    figma_url: asset.figmaUrl ?? null,
    download_available: asset.downloadAvailable,
    file_path: asset.filePath,
    file_url: null,
    mime_type: asset.mimeType,
    file_size: asset.fileSize,
    original_file_name: asset.originalFileName,
  };
}

export async function saveAsset(asset: Asset): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const insert = assetToInsert(asset);
  // Attempt full insert, fall back to insert without new columns if DB not migrated yet
  const { error } = await client.from(ASSET_TABLE).upsert(insert as never, { onConflict: "id" });
  if (error) {
    // If new columns don't exist yet (pre-migration environment), retry without them
    if (/column .* (purpose|caption|theme|figma_url|download_available) .* does not exist/i.test(error.message)) {
      const legacy = {
        id: insert.id,
        type: insert.type,
        name: insert.name,
        slug: insert.slug,
        category: insert.category,
        brand: insert.brand,
        status: insert.status,
        description: insert.description,
        keywords: insert.keywords,
        metadata: insert.metadata,
        version: insert.version,
        alt_text: insert.alt_text,
        file_path: insert.file_path,
        file_url: insert.file_url,
        mime_type: insert.mime_type,
        file_size: insert.file_size,
        original_file_name: insert.original_file_name,
      } as unknown as Record<string, unknown>;
      const { error: legacyError } = await client.from(ASSET_TABLE).upsert(legacy as never, { onConflict: "id" });
      if (legacyError) {
        console.warn("saveAsset fallback failed:", legacyError.message);
        return { ok: false, error: friendlyErrorMessage(legacyError) };
      }
      return { ok: true, error: null };
    }
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
  const payload: Record<string, unknown> = {
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
    cover_asset_id: page.coverAssetId ?? null,
    content: page.sections,
  };
  const { error: initialError } = await client.from(PAGES_TABLE).upsert(payload as never, { onConflict: "id" });
  if (!initialError) return { ok: true, error: null };
  if (/column .*cover_asset_id.* does not exist/i.test(initialError.message)) {
    const { cover_asset_id: _coverAssetId, ...legacy } = payload as Record<string, unknown> & { cover_asset_id?: unknown };
    void _coverAssetId; // used via destructuring to strip from legacy
    const retry = await client.from(PAGES_TABLE).upsert(legacy as never, { onConflict: "id" });
    if (retry.error) return { ok: false, error: friendlyErrorMessage(retry.error) };
    return { ok: true, error: null };
  }
  return { ok: false, error: friendlyErrorMessage(initialError) };
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

type TokenImportInsert = {
  id?: string;
  file_name: string;
  source_json: unknown;
  summary: Record<string, unknown>;
  status: TokenImport["status"];
  published_at?: string | null;
};

export function tokenImportToInsert(tokenImport: TokenImport): TokenImportInsert {
  return {
    id: tokenImport.id,
    file_name: tokenImport.fileName,
    source_json: tokenImport.sourceJson,
    summary: {
      fileName: tokenImport.summary.fileName,
      total: tokenImport.summary.total,
      references: tokenImport.summary.references,
      uniqueReferences: tokenImport.summary.uniqueReferences,
      withDescription: tokenImport.summary.withDescription,
      groups: tokenImport.summary.groups,
      validationErrors: tokenImport.validationErrors,
      validationBrokenAliases: tokenImport.validationBrokenAliases,
    },
    status: tokenImport.status,
    published_at: tokenImport.status === "published" ? new Date().toISOString() : null,
  };
}

export async function saveTokenImport(tokenImport: TokenImport): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const insert = tokenImportToInsert(tokenImport);
  const { error } = await client.from(TOKEN_IMPORTS_TABLE).upsert(insert as never, { onConflict: "id" });
  if (error) return { ok: false, error: friendlyErrorMessage(error) };
  return { ok: true, error: null };
}

export async function deleteTokenImportRecord(importId: string): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "Storage is not configured." };
  const { error } = await client.from(TOKEN_IMPORTS_TABLE).delete().eq("id", importId);
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
    .on("postgres_changes", { event: "*", schema: "public", table: TOKEN_IMPORTS_TABLE }, callback)
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
