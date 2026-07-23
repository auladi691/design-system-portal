import { getSupabase, STORAGE_BUCKET } from "@/lib/supabase-client";
import type { AssetType } from "@/types/content";

export type StoredFile = {
  path: string;
  url: string;
  mimeType: string | null;
  size: number;
  originalFileName: string;
};

export const INTERNAL_COMPONENT_PREVIEW_PREFIX = "internal/component-preview";

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

export function buildInternalComponentPreviewPath(file: File): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const safe = sanitizeFileName(file.name);
  // Canonical path per spec: internal/component-preview/YYYY/MM/uuid-filename
  return `${INTERNAL_COMPONENT_PREVIEW_PREFIX}/${year}/${month}/${uuid}-${safe}`;
}

export function buildStoragePathForDestination(
  destination: string,
  file: File,
): string {
  if (destination === "component-preview") {
    return buildInternalComponentPreviewPath(file);
  }
  return buildStoragePath(destination as AssetType, file);
}

function mimeForUpload(file: File): string {
  const raw = file.type?.trim();
  if (raw) {
    const base = raw.split(";")[0]?.trim();
    if (base) return base;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
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
  return map[ext] ?? "application/octet-stream";
}

export async function uploadAssetFileForDestination(
  destination: string,
  file: File,
): Promise<StoredFile> {
  const client = getSupabase();
  if (!client) {
    throw new Error("Storage is not configured. Connect Supabase before uploading files.");
  }
  const path = buildStoragePathForDestination(destination, file);
  const contentType = mimeForUpload(file);
  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });
  if (error) {
    const msg = error.message || "";
    if (/row.*security|policy|permission|not.*allowed/i.test(msg)) {
      throw new Error(`Storage upload blocked by policy: ${msg} — sign in as administrator and check Storage RLS.`);
    }
    if (/JWT|token|expired|session/i.test(msg)) {
      throw new Error(`Storage session expired: ${msg} — sign in again.`);
    }
    throw new Error(`Storage upload failed: ${msg || "We could not upload this file. Try again in a moment."}`);
  }
  const { data: signedUrlData, error: signedUrlError } = await client.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600);
  if (signedUrlError || !signedUrlData.signedUrl) {
    await deleteStoragePath(path);
    throw new Error(
      `We could not prepare this file for preview: ${signedUrlError?.message ?? "signed URL failed"} — file was removed. Try again.`,
    );
  }
  return {
    path,
    url: signedUrlData.signedUrl,
    mimeType: contentType,
    size: file.size,
    originalFileName: file.name,
  };
}

export async function uploadAssetFile(
  type: AssetType,
  file: File,
): Promise<StoredFile> {
  return uploadAssetFileForDestination(type, file);
}

export async function deleteStoragePath(path: string): Promise<boolean> {
  if (!path) return true;
  const client = getSupabase();
  if (!client) return false;
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.warn("Storage cleanup failed for path:", path, error.message);
    return false;
  }
  return true;
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
