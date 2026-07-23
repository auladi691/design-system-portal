import { ASSET_CATEGORY_MAP, INTERNAL_COLLECTION_MAP } from "@/lib/asset-categories";
import type { AssetType } from "@/types/content";
import type { BulkUploadDestination } from "@/lib/bulk-upload";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

function getConfigForDestination(destination: BulkUploadDestination | AssetType) {
  if ((INTERNAL_COLLECTION_MAP as Record<string, unknown>)[destination as string]) {
    return INTERNAL_COLLECTION_MAP[destination as keyof typeof INTERNAL_COLLECTION_MAP] as unknown as {
      label: string;
      allowedExtensions: readonly string[];
      allowedMimeTypes: readonly string[];
      maxSizeBytes: number;
    };
  }
  return ASSET_CATEGORY_MAP[destination as AssetType];
}

function normalizeMime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Strip charset and params: "image/svg+xml; charset=utf-8" -> "image/svg+xml"
  const base = raw.split(";")[0]?.trim().toLowerCase();
  if (!base) return null;
  // Normalize common aliases for SVG
  if (base === "image/svg" || base === "image/svg-xml" || base === "text/xml" || base === "application/xml")
    return "image/svg+xml";
  return base;
}

export function validateAssetFile(
  file: File,
  destination: BulkUploadDestination | AssetType,
  queue: { name: string }[],
): ValidationResult {
  const config = getConfigForDestination(destination);
  const errors: string[] = [];
  if (!config) {
    errors.push("This category is not available yet.");
    return { ok: false, errors };
  }

  const ext = getExtension(file.name);
  const extLower = ext.toLowerCase();
  if (!config.allowedExtensions.includes(extLower)) {
    errors.push(
      `This file format is not available for ${config.label.toLowerCase()}. Allowed formats: ${config.allowedExtensions.join(", ")}.`,
    );
  }

  const rawMime = file.type || guessMimeFromExtension(ext) || "";
  const detectedMime = normalizeMime(rawMime);
  const allowedNormalized = config.allowedMimeTypes.map((m) => normalizeMime(m) ?? m.toLowerCase());
  // If we have a detected mime, check normalized list; allow empty mime (fallback to extension already checked)
  if (detectedMime && !allowedNormalized.includes(detectedMime)) {
    // For SVG family, be permissive if extension is svg and detected is something svg-like
    const isSvgExt = extLower === "svg";
    const isSvgMime = detectedMime.includes("svg") || detectedMime.includes("xml");
    if (!(isSvgExt && isSvgMime)) {
      errors.push(
        `This file type (${file.type || "unknown"}) is not available for ${config.label.toLowerCase()}. Allowed: ${config.allowedExtensions.join(", ")}.`,
      );
    }
  }

  if (file.size <= 0) {
    errors.push("This file appears to be empty.");
  } else if (file.size > config.maxSizeBytes) {
    const limit = (config.maxSizeBytes / (1024 * 1024)).toFixed(0);
    errors.push(`The file is larger than the allowed size (${limit} MB).`);
  }

  const duplicate = queue.some((entry) => entry.name.toLowerCase() === file.name.toLowerCase());
  if (duplicate) {
    errors.push("A file with the same name is already in the upload list.");
  }

  return { ok: errors.length === 0, errors };
}

export function validatePublish(asset: {
  altText: string;
  type: AssetType;
  name: string;
}): string[] {
  const errors: string[] = [];
  if (!asset.name.trim()) errors.push("Add a name before publishing this asset.");
  if (!asset.altText.trim()) errors.push("Add alternative text before publishing this asset.");
  return errors;
}

export function guessMimeFromExtension(ext: string): string | null {
  const map: Record<string, string> = {
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    pdf: "application/pdf",
    zip: "application/zip",
    json: "application/json",
    fig: "application/octet-stream",
    sketch: "application/octet-stream",
  };
  return map[ext.toLowerCase()] ?? null;
}
