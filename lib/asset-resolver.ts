import { isInternalPurpose, type Asset } from "@/types/content";

export const INTERNAL_ASSET_PURPOSES = ["component-preview"] as const;

export function isInternalAsset(asset: Pick<Asset, "purpose" | "visibility"> | null | undefined): boolean {
  if (!asset) return false;
  if (asset.visibility === "internal") return true;
  return isInternalPurpose(asset.purpose as never);
}

export function isPublicAsset(asset: Pick<Asset, "purpose" | "visibility"> | null | undefined): boolean {
  return !isInternalAsset(asset);
}

export function resolveAsset(
  assetId: string | undefined,
  assets: Asset[],
  options: { requirePublished?: boolean } = {},
): Asset | null {
  if (!assetId) return null;
  const found = assets.find((a) => a.id === assetId);
  if (!found) return null;
  if (options.requirePublished && found.status !== "published") return null;
  return found;
}

export function resolvePublishedDocAsset(
  assetId: string | undefined,
  assets: Asset[],
): Asset | null {
  // Published doc relation: asset must be published and, if internal (component-preview),
  // it is only included when referenced by a published page (handled in fetchPublishedSite).
  // Draft / archived assets never pass this gate.
  const asset = resolveAsset(assetId, assets, { requirePublished: true });
  if (!asset) return null;
  return asset;
}

export function resolvePublishedDocAssets(
  assetIds: (string | undefined)[],
  assets: Asset[],
): Asset[] {
  return resolveAssets(assetIds, assets, { requirePublished: true });
}

export function resolveAssetFileUrl(
  assetId: string | undefined,
  assets: Asset[],
  options: { requirePublished?: boolean } = {},
): string | null {
  const asset = resolveAsset(assetId, assets, options);
  if (!asset) return null;
  return asset.fileUrl ?? null;
}

export function isDownloadAvailable(asset: Asset | null | undefined): boolean {
  if (!asset) return false;
  if (!asset.downloadAvailable) return false;
  if (!asset.fileUrl) return false;
  return true;
}

export function isValidFigmaUrl(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return false;
    return url.hostname === "figma.com" || url.hostname.endsWith(".figma.com") || url.hostname === "www.figma.com";
  } catch {
    return false;
  }
}

export function resolveAssets(
  assetIds: (string | undefined)[],
  assets: Asset[],
  options: { requirePublished?: boolean } = {},
): Asset[] {
  const set = new Set(assetIds.filter(Boolean) as string[]);
  if (!set.size) return [];
  const map = new Map(assets.filter((a) => set.has(a.id)).map((a) => [a.id, a]));
  const out: Asset[] = [];
  for (const id of assetIds) {
    if (!id) continue;
    const found = map.get(id);
    if (!found) continue;
    if (options.requirePublished && found.status !== "published") continue;
    out.push(found);
  }
  return out;
}
