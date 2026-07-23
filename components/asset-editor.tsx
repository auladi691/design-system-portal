"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogFocus } from "@/components/dialog-focus";
import { ASSET_CATEGORIES, INTERNAL_ASSET_COLLECTIONS, formatFileSize } from "@/lib/asset-categories";
import { deleteStoragePath, uploadAssetFileForDestination } from "@/lib/asset-storage";
import { validatePublish } from "@/lib/asset-validation";
import { friendlyErrorMessage } from "@/lib/repository";
import { pushToast } from "@/lib/toast";
import { slugify } from "@/lib/slug";
import type { AppContext } from "@/components/design-system-app";
import { ASSET_PURPOSE_OPTIONS, type Asset, type AssetBrand, type AssetPurpose, type AssetTheme, type AssetType } from "@/types/content";

const BRANDS: AssetBrand[] = ["Shared", "IM3", "Indosat", "Tri", "Partner"];
const THEMES: { value: AssetTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "both", label: "Both" },
];

type AssetEditorProps = {
  asset: Asset;
  app: AppContext;
  close: () => void;
  onDelete?: (asset: Asset) => void;
  onReplace?: (asset: Asset, file: File) => Promise<void>;
};

export function AssetEditor({ asset, app, close, onDelete, onReplace }: AssetEditorProps) {
  const [item, setItem] = useState<Asset>(asset);
  const [lastAssetId, setLastAssetId] = useState(asset.id);
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  useDialogFocus(editorRef, !confirmDelete);

  if (lastAssetId !== asset.id) {
    setLastAssetId(asset.id);
    setItem(asset);
    setPublishError(null);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !confirmDelete) close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, confirmDelete]);

  const update = (patch: Partial<Asset>) => {
    setItem((current) => ({ ...current, ...patch }));
    setPublishError(null);
  };

  const handleReplaceFile = async (file: File) => {
    if (onReplace) {
      setReplacing(true);
      try {
        await onReplace(item, file);
        // Parent will handle toast and reload; refresh local state from parent via props
        setItem((prev) => ({ ...prev }));
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "We couldn't replace this file.");
      } finally {
        setReplacing(false);
      }
      return;
    }
    setReplacing(true);
    try {
      const isInternal = item.purpose === "component-preview" && item.visibility === "internal";
      const destination = isInternal ? "component-preview" : item.type;
      const stored = await uploadAssetFileForDestination(destination, file);
      const previousPath = item.filePath;
      const next: Asset = {
        ...item,
        filePath: stored.path,
        fileUrl: stored.url,
        mimeType: stored.mimeType,
        fileSize: stored.size,
        originalFileName: stored.originalFileName,
        updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };
      const result = await app.upsertAsset(next);
      if (!result.ok) {
        await deleteStoragePath(stored.path);
        pushToast("error", "We couldn't save the new file. The original file is kept.");
        return;
      }
      if (previousPath && previousPath !== stored.path) {
        const previousDeleted = await deleteStoragePath(previousPath);
        if (!previousDeleted) pushToast("warning", "The replacement was saved, but the original file could not be removed.");
      }
      setItem(next);
      pushToast("success", "Replacement file saved. All usages now show the new file.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't replace this file.");
    } finally {
      setReplacing(false);
    }
  };

  const save = async (publish = false) => {
    if (publish) {
      const errors = validatePublish({ name: item.name, altText: item.altText, type: item.type });
      if (errors.length) {
        setPublishError(errors[0]);
        pushToast("warning", errors[0]);
        return;
      }
    }
    setSaving(true);
    const next: Asset = {
      ...item,
      slug: item.slug || slugify(item.name),
      status: publish ? "published" : item.status === "published" ? "published" : "draft",
      updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    try {
      const result = await app.upsertAsset(next);
      if (!result.ok) throw new Error(result.error ?? "We couldn't save this asset.");
      setItem(next);
      pushToast("success", publish ? "Asset published." : "Asset saved.");
      if (publish) close();
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    setSaving(true);
    try {
      const result = await app.upsertAsset({ ...item, status: "archived", updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
      if (!result.ok) throw new Error(result.error ?? "We couldn't archive this asset.");
      pushToast("success", "Asset archived.");
      close();
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async () => {
    setSaving(true);
    try {
      const result = await app.upsertAsset({ ...item, status: "draft", updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
      if (!result.ok) throw new Error(result.error ?? "We couldn't move this asset to draft.");
      setItem({ ...item, status: "draft" });
      pushToast("success", "Asset moved to draft.");
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const canPreviewImage = item.fileUrl && item.mimeType && item.mimeType.startsWith("image/");

  return (
    <div className="drawer-backdrop" onClick={close}>
       <aside ref={editorRef} className="asset-editor" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Edit ${item.name}`}>
        <header className="asset-editor-head">
          <div>
            <span className="eyebrow">{item.type.replace("-", " ")}</span>
            <h2>Edit asset</h2>
            <span className={`status ${item.status}`} style={{ display: "inline-block", marginTop: 6 }}>{item.status}</span>
            <small className="muted-note" style={{ display: "block", marginTop: 8 }}>Asset ID is preserved when replacing — published pages automatically show the new file.</small>
          </div>
          <button onClick={close} aria-label="Close editor"><Icon name="close" /></button>
        </header>

        <div className="asset-edit-preview" aria-hidden="true">
          {canPreviewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.fileUrl!} alt={item.altText || item.name} />
          ) : <span>{item.glyph}</span>}
        </div>

        <div className="properties-form">
          <label>Name<input value={item.name} onChange={(e) => update({ name: e.target.value })} /></label>
          <label>Slug<input value={item.slug} onChange={(e) => update({ slug: e.target.value })} /></label>
          <label>Type
            <select value={item.type} onChange={(e) => update({ type: e.target.value as AssetType })}>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
              {INTERNAL_ASSET_COLLECTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} (internal)
                </option>
              ))}
            </select>
          </label>
          <label>Category<input value={item.category} onChange={(e) => update({ category: e.target.value })} /></label>
          <label>Asset purpose
            <select value={item.purpose} onChange={(e) => {
              const newPurpose = e.target.value as AssetPurpose;
              const newVisibility = newPurpose === "component-preview" ? "internal" as const : "public" as const;
              update({ purpose: newPurpose, visibility: newVisibility });
            }}>
              {ASSET_PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}{o.internal ? " (internal)" : ""}</option>)}
            </select>
          </label>
          <small className="muted-note">{ASSET_PURPOSE_OPTIONS.find((o) => o.value === item.purpose)?.description}{item.visibility === "internal" || item.purpose === "component-preview" ? " — This asset is internal-only and will not appear in public Asset Explorer." : ""}</small>
          <label>Brand
            <select value={item.brand} onChange={(e) => update({ brand: e.target.value as AssetBrand })}>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label>Theme
            <select value={item.theme} onChange={(e) => update({ theme: e.target.value as AssetTheme })}>
              {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label>Version<input value={item.version} onChange={(e) => update({ version: e.target.value })} /></label>
          <label>Description<textarea rows={4} value={item.description} onChange={(e) => update({ description: e.target.value })} /></label>
          <label>Caption<input value={item.caption} onChange={(e) => update({ caption: e.target.value })} placeholder="Short caption shown with the visual" /></label>
          <label>Keywords<input value={item.keywords.join(", ")} onChange={(e) => update({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })} placeholder="Comma separated" /></label>
          <label>Alternative text<input value={item.altText} onChange={(e) => update({ altText: e.target.value })} placeholder="Describe the asset for screen readers" /></label>
          <label>Figma URL<input value={item.figmaUrl ?? ""} onChange={(e) => update({ figmaUrl: e.target.value || undefined })} placeholder="https://www.figma.com/file/..." /></label>
          <label className="inline-check">
            <input type="checkbox" checked={item.downloadAvailable} onChange={(e) => update({ downloadAvailable: e.target.checked })} />
            Allow download
          </label>
          <label>Preview glyph<input value={item.glyph} onChange={(e) => update({ glyph: e.target.value })} maxLength={3} /></label>

          <div className="asset-file-info">
            <h3>File information</h3>
            <dl>
              <div><dt>Original filename</dt><dd>{item.originalFileName ?? "—"}</dd></div>
              <div><dt>MIME type</dt><dd>{item.mimeType ?? "—"}</dd></div>
              <div><dt>File size</dt><dd>{formatFileSize(item.fileSize)}</dd></div>
              <div><dt>Storage path</dt><dd>{item.filePath ?? "—"}</dd></div>
            </dl>
            <button
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={replacing || saving}
            >
              <Icon name="upload" /> {replacing ? "Replacing..." : "Upload replacement file"}
            </button>
            <small className="muted-note">Replacing keeps the same asset ID — all published pages automatically show the new file.</small>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleReplaceFile(file);
                e.currentTarget.value = "";
              }}
            />
          </div>

          {publishError && <p className="form-error" role="alert">{publishError}</p>}

          <div className="asset-editor-actions">
            <button className="primary-button" onClick={() => save(false)} disabled={saving}><Icon name="check" />Save asset</button>
            {item.status !== "published" && <button className="secondary-button" onClick={() => save(true)} disabled={saving}>Publish</button>}
            {item.status === "published" && <button className="secondary-button" onClick={unpublish} disabled={saving}>Unpublish to draft</button>}
            <button className="secondary-button" onClick={archive} disabled={saving}><Icon name="layers" />Archive</button>
            {onDelete && <button className="danger-button" onClick={() => setConfirmDelete(true)} disabled={saving}><Icon name="trash" />Delete</button>}
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete asset?"
        description="This asset and its file will be removed permanently. This action cannot be undone. Check that no published page is using it first."
        confirmLabel="Delete asset"
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.(item);
          close();
        }}
      />
    </div>
  );
}
