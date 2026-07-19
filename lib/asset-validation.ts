import { ASSET_CATEGORY_MAP } from "@/lib/asset-categories";
import type { AssetType } from "@/types/content";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

export function validateAssetFile(
  file: File,
  type: AssetType,
  queue: { name: string }[],
): ValidationResult {
  const config = ASSET_CATEGORY_MAP[type];
  const errors: string[] = [];
  if (!config) {
    errors.push("This category is not available yet.");
    return { ok: false, errors };
  }

  const ext = getExtension(file.name);
  if (!config.allowedExtensions.includes(ext)) {
    errors.push(
      `This file format is not available for ${config.label.toLowerCase()}. Allowed formats: ${config.allowedExtensions.join(", ")}.`,
    );
  }

  const detectedMime = file.type || guessMimeFromExtension(ext);
  if (detectedMime && !config.allowedMimeTypes.includes(detectedMime)) {
    errors.push(
      `This file type is not available for ${config.label.toLowerCase()}.`,
    );
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
