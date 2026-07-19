import { getSupabase, STORAGE_BUCKET } from "@/lib/supabase-client";
import type { AssetType } from "@/types/content";

export type StoredFile = {
  path: string;
  url: string;
  mimeType: string | null;
  size: number;
  originalFileName: string;
};

export function sanitizeFileName(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "");
  const safe = base || "file";
  const trimmed = safe.length > 60 ? safe.slice(0, 60) : safe;
  const cleaned = trimmed.replace(/\.{2,}/g, ".");
  return cleaned.replace(/^\.+|\.+$/g, "") || "file";
}

export function buildStoragePath(type: AssetType, file: File): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const safe = sanitizeFileName(file.name);
  return `${type}/${year}/${month}/${uuid}-${safe}`;
}

export async function uploadAssetFile(
  type: AssetType,
  file: File,
): Promise<StoredFile> {
  const client = getSupabase();
  if (!client) {
    throw new Error("Storage is not configured. Connect Supabase before uploading files.");
  }
  const path = buildStoragePath(type, file);
  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (error) {
    throw new Error("We could not upload this file. Try again in a moment.");
  }
  const { data: signedUrlData, error: signedUrlError } = await client.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600);
  if (signedUrlError || !signedUrlData.signedUrl) {
    await deleteStoragePath(path);
    throw new Error("We could not prepare this file for preview. Try again in a moment.");
  }
  return {
    path,
    url: signedUrlData.signedUrl,
    mimeType: file.type || null,
    size: file.size,
    originalFileName: file.name,
  };
}

export async function deleteStoragePath(path: string): Promise<void> {
  if (!path) return;
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.warn("Storage cleanup failed for path:", path, error.message);
  }
}

export async function deleteStoragePaths(paths: string[]): Promise<{ deleted: string[]; failed: string[] }> {
  const valid = paths.filter(Boolean);
  if (!valid.length) return { deleted: [], failed: [] };
  const client = getSupabase();
  if (!client) {
    return { deleted: [], failed: valid };
  }
  const { error } = await client.storage.from(STORAGE_BUCKET).remove(valid);
  if (error) {
    console.warn("Bulk storage delete failed:", error.message);
    return { deleted: [], failed: valid };
  }
  return { deleted: valid, failed: [] };
}
