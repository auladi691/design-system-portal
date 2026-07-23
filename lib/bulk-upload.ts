import { ASSET_CATEGORY_MAP } from "@/lib/asset-categories";
import { deleteStoragePath, uploadAssetFile } from "@/lib/asset-storage";
import { saveAsset } from "@/lib/repository";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Asset, AssetType } from "@/types/content";

export type BulkUploadItem = {
  id: string;
  file: File;
  type: AssetType;
  name: string;
  slug: string;
  category: string;
  brand: Asset["brand"];
  purpose: Asset["purpose"];
  theme: Asset["theme"];
  description: string;
  keywords: string[];
  version: string;
  altText: string;
  caption: string;
  status: Asset["status"];
  progress: number;
  error: string | null;
  validationErrors: string[];
  uploading: boolean;
  done: boolean;
  result?: Asset;
};

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
      const stored = await uploadAssetFile(item.type, item.file);
      onItemChange(item.id, { progress: 85 });
      const isInternalForUpload = item.purpose === "component-preview";
      const asset: Asset = {
        id: item.id,
        type: item.type,
        name: item.name,
        slug: item.slug,
        category: item.category,
        brand: item.brand,
        purpose: item.purpose,
        visibility: isInternalForUpload ? "internal" : "public",
        theme: item.theme,
        status: publishAfterUpload ? "published" : "draft",
        description: item.description,
        keywords: item.keywords,
        glyph: glyphFor(item.type, item.name),
        version: item.version,
        updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        altText: item.altText,
        caption: item.caption,
        figmaUrl: undefined,
        downloadAvailable: true,
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
      onItemChange(item.id, {
        uploading: false,
        done: false,
        progress: 0,
        error: error instanceof Error ? error.message : "We couldn't upload this file.",
      });
    }
  }
}

export function makeItemFromFile(file: File, type: AssetType, existingSlugs: string[]): BulkUploadItem {
  const name = cleanName(file.name);
  const slug = uniqueSlug(slugify(name), existingSlugs);
  const config = ASSET_CATEGORY_MAP[type];
  return {
    id: crypto.randomUUID(),
    file,
    type,
    name,
    slug,
    category: config ? defaultCategory(type) : "General",
    brand: "Shared",
    purpose: "general-asset",
    theme: "both",
    description: "",
    keywords: [],
    version: "1.0",
    altText: "",
    caption: "",
    status: "draft",
    progress: 0,
    error: null,
    validationErrors: [],
    uploading: false,
    done: false,
  };
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
