import { ASSET_CATEGORY_MAP } from "@/lib/asset-categories";
import { deleteStoragePath, uploadAssetFileForDestination } from "@/lib/asset-storage";
import { saveAsset } from "@/lib/repository";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Asset, AssetType } from "@/types/content";
import type { InternalAssetCollectionId } from "@/lib/asset-categories";

export type BulkUploadDestination = AssetType | InternalAssetCollectionId;

export type BulkUploadItem = {
  id: string;
  file: File;
  type: AssetType;
  destination: BulkUploadDestination;
  name: string;
  slug: string;
  category: string;
  brand: Asset["brand"];
  purpose: Asset["purpose"];
  visibility: Asset["visibility"];
  theme: Asset["theme"];
  description: string;
  keywords: string[];
  version: string;
  altText: string;
  caption: string;
  figmaUrl?: string;
  downloadAvailable: boolean;
  status: Asset["status"];
  progress: number;
  error: string | null;
  validationErrors: string[];
  uploading: boolean;
  done: boolean;
  result?: Asset;
};

export function isInternalDestination(dest: BulkUploadDestination): boolean {
  return dest === "component-preview";
}

export function storageTypeForDestination(dest: BulkUploadDestination): AssetType {
  // Canonical internal type per spec: component-preview has its own type, not fake public category
  // Migration 00010 allows 'component-preview' type in DB constraint
  if (dest === "component-preview") return "component-preview";
  return dest as AssetType;
}

const MAX_CONCURRENCY = 3;

export async function runBulkUpload(
  items: BulkUploadItem[],
  publishAfterUpload: boolean,
  onItemChange: (id: string, patch: Partial<BulkUploadItem>) => void,
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, () =>
    runWorker(queue, publishAfterUpload, onItemChange),
  );
  await Promise.allSettled(workers);
}

async function runWorker(
  queue: BulkUploadItem[],
  publishAfterUpload: boolean,
  onItemChange: (id: string, patch: Partial<BulkUploadItem>) => void,
): Promise<void> {
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) return;
    if (item.done || item.uploading) continue;
    onItemChange(item.id, { uploading: true, error: null, progress: 5 });
    try {
      onItemChange(item.id, { progress: 40 });
      // Use destination-based upload so internal/component-preview/YYYY/MM/uuid-... path is used
      const stored = await uploadAssetFileForDestination(item.destination, item.file);
      onItemChange(item.id, { progress: 85 });
      const asset: Asset = {
        id: item.id,
        type: item.type,
        name: item.name,
        slug: item.slug,
        category: item.category,
        brand: item.brand,
        purpose: item.purpose,
        visibility: item.visibility,
        theme: item.theme,
        status: publishAfterUpload ? "published" : "draft",
        description: item.description,
        keywords: item.keywords,
        glyph: glyphFor(item.type, item.name),
        version: item.version,
        updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        altText: item.altText,
        caption: item.caption,
        figmaUrl: item.figmaUrl,
        downloadAvailable: item.downloadAvailable,
        filePath: stored.path,
        fileUrl: stored.url,
        mimeType: stored.mimeType,
        fileSize: stored.size,
        originalFileName: stored.originalFileName,
        createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };
      const result = await saveAsset(asset);
      if (!result.ok) {
        await deleteStoragePath(stored.path);
        throw new Error(result.error ?? "We couldn't save this asset.");
      }
      onItemChange(item.id, {
        progress: 100,
        uploading: false,
        done: true,
        error: null,
        result: asset,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn't upload this file.";
      // Log for debugging in Studio console
      console.warn(`Bulk upload failed for ${item.file.name}:`, message, error);
      onItemChange(item.id, {
        uploading: false,
        done: false,
        progress: 0,
        error: message,
      });
    }
  }
}

export function makeItemFromFile(
  file: File,
  destination: BulkUploadDestination,
  existingSlugs: string[],
): BulkUploadItem {
  const name = cleanName(file.name);
  const slug = uniqueSlug(slugify(name), existingSlugs);
  const isInternal = isInternalDestination(destination);
  const type: AssetType = storageTypeForDestination(destination);
  // For internal destination, type is component-preview which is not in public map — use generic category
  const config = (ASSET_CATEGORY_MAP as Record<string, { label?: string } | undefined>)[type as string];

  return {
    id: crypto.randomUUID(),
    file,
    type,
    destination,
    name,
    slug,
    // Per spec, avoid using internal id as category — use General
    category: isInternal ? "General" : config ? defaultCategory(type as never) : "General",
    brand: "Shared",
    purpose: isInternal ? "component-preview" : "general-asset",
    visibility: isInternal ? "internal" : "public",
    theme: "both",
    description: "",
    keywords: [],
    version: "1.0",
    altText: "",
    caption: "",
    figmaUrl: undefined,
    downloadAvailable: true,
    status: "draft",
    progress: 0,
    error: null,
    validationErrors: [],
    uploading: false,
    done: false,
  };
}

export function makeItemFromFileLegacy(file: File, type: AssetType, existingSlugs: string[]): BulkUploadItem {
  return makeItemFromFile(file, type, existingSlugs);
}

function cleanName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function defaultCategory(type: AssetType): string {
  switch (type) {
    case "icon":
      return "Actions";
    case "icon-illustration":
      return "Product";
    case "illustration":
      return "Empty state";
    case "logo":
      return "Corporate";
    case "brand-asset":
      return "Background";
    case "template":
      return "UI template";
    case "download":
      return "Resource";
    case "component-preview":
      return "General";
  }
}

function glyphFor(type: AssetType, name: string): string {
  if (type === "icon" || type === "icon-illustration") return name.slice(0, 1).toUpperCase();
  if (type === "illustration") return "◌";
  if (type === "logo") return name.slice(0, 2).toUpperCase();
  if (type === "brand-asset") return "▧";
  if (type === "template") return "▯";
  return "↓";
}
