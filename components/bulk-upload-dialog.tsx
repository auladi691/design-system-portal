"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ASSET_CATEGORIES, ASSET_CATEGORY_MAP, formatFileSize } from "@/lib/asset-categories";
import { validateAssetFile } from "@/lib/asset-validation";
import { makeItemFromFile, runBulkUpload, type BulkUploadItem } from "@/lib/bulk-upload";
import { pushToast } from "@/lib/toast";
import type { AssetBrand, AssetType } from "@/types/content";

type BulkUploadDialogProps = {
  open: boolean;
  initialCategory: AssetType;
  existingSlugs: string[];
  onClose: () => void;
  onComplete: () => void;
};

const BRANDS: AssetBrand[] = ["Shared", "IM3", "Indosat", "Tri", "Partner"];

export function BulkUploadDialog({ open, initialCategory, existingSlugs, onClose, onComplete }: BulkUploadDialogProps) {
  const [category, setCategory] = useState<AssetType>(initialCategory);
  const [items, setItems] = useState<BulkUploadItem[]>([]);
  const [shared, setShared] = useState({ name: "", description: "", brand: "Shared" as AssetBrand, version: "1.0", altText: "", publishAfterUpload: false });
  const [running, setRunning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setCategory(initialCategory);
      setItems([]);
      setShared({ name: "", description: "", brand: "Shared", version: "1.0", altText: "", publishAfterUpload: false });
      setRunning(false);
      setDragActive(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !running) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, running, onClose]);

  const updateItem = useCallback((id: string, patch: Partial<BulkUploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setItems((current) => {
      const next = [...current];
      const slugs = [...existingSlugs, ...next.map((i) => i.slug)];
      for (const file of files) {
        const validation = validateAssetFile(file, category, next.map((i) => ({ name: i.file.name })));
        const item = makeItemFromFile(file, category, slugs);
        item.validationErrors = validation.errors;
        if (shared.name) item.name = `${shared.name} ${next.length + 1}`;
        if (shared.description) item.description = shared.description;
        if (shared.altText) item.altText = shared.altText;
        item.brand = shared.brand;
        item.version = shared.version;
        slugs.push(item.slug);
        next.push(item);
      }
      return next;
    });
  }, [category, existingSlugs, shared]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (running) return;
    addFiles(e.dataTransfer.files);
  }, [addFiles, running]);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const retryItem = useCallback((id: string) => {
    updateItem(id, { error: null, done: false, uploading: false, progress: 0, validationErrors: [] });
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const validation = validateAssetFile(target.file, category, items.filter((i) => i.id !== id).map((i) => ({ name: i.file.name })));
    updateItem(id, { validationErrors: validation.errors });
  }, [items, category, updateItem]);

  const startUpload = useCallback(async () => {
    const ready = items.filter((item) => !item.done && !item.uploading && item.validationErrors.length === 0);
    if (!ready.length) {
      pushToast("warning", "Add files without validation issues before uploading.");
      return;
    }
    setRunning(true);
    pushToast("info", "Upload started.");
    const pending = items.filter((item) => !item.done && !item.uploading && item.validationErrors.length === 0);
    await runBulkUpload(pending, shared.publishAfterUpload, updateItem);
    setRunning(false);
    setItems((current) => {
      const failed = current.filter((item) => item.error);
      const succeeded = current.filter((item) => item.done);
      if (!failed.length && succeeded.length) {
        pushToast("success", `${succeeded.length} asset${succeeded.length === 1 ? "" : "s"} uploaded.`);
      } else if (failed.length && succeeded.length) {
        pushToast("warning", `${succeeded.length} uploaded, ${failed.length} failed. Review the list and retry.`);
      } else if (failed.length) {
        pushToast("error", "Some files could not be uploaded. Review the list and try again.");
      }
      return current;
    });
    onComplete();
  }, [items, shared.publishAfterUpload, updateItem, onComplete]);

  const cancelItem = useCallback((id: string) => {
    updateItem(id, { uploading: false, done: false, progress: 0, error: null, validationErrors: ["Cancelled by administrator."] });
  }, [updateItem]);

  const stats = useMemo(() => {
    let queued = 0, uploading = 0, succeeded = 0, failed = 0;
    for (const item of items) {
      if (item.done) succeeded += 1;
      else if (item.uploading) uploading += 1;
      else if (item.error) failed += 1;
      else queued += 1;
    }
    return { queued, uploading, succeeded, failed };
  }, [items]);

  if (!open) return null;
  const config = ASSET_CATEGORY_MAP[category];
  const allDone = items.length > 0 && items.every((item) => item.done);

  return (
    <div className="dialog-backdrop" onClick={() => !running && onClose()} role="presentation">
      <div className="bulk-upload-dialog" role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title" onClick={(e) => e.stopPropagation()}>
        <header className="bulk-header">
          <div>
            <span className="eyebrow">Bulk upload</span>
            <h2 id="bulk-upload-title">Upload assets</h2>
          </div>
          <button className="drawer-close" onClick={() => !running && onClose()} aria-label="Close bulk upload" disabled={running}><Icon name="close" /></button>
        </header>

        <div className="bulk-body">
          <section className="bulk-section">
            <label className="bulk-label">Asset category</label>
            <div className="bulk-category-grid" role="radiogroup" aria-label="Asset category">
              {ASSET_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  role="radio"
                  aria-checked={category === c.slug}
                  className={`bulk-category-card ${category === c.slug ? "active" : ""}`}
                  onClick={() => setCategory(c.slug)}
                  disabled={running}
                >
                  <strong>{c.label}</strong>
                  <small>{c.allowedExtensions.join(", ")}</small>
                </button>
              ))}
            </div>
            <p className="bulk-hint">Allowed formats: {config.allowedExtensions.join(", ")}. Max size: {formatFileSize(config.maxSizeBytes)}.</p>
          </section>

          <section className="bulk-section">
            <label className="bulk-label">Drop zone</label>
            <div
              ref={dropRef}
              className={`bulk-dropzone ${dragActive ? "drag-active" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Choose files or drag them here"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={onDrop}
            >
              <Icon name="upload" />
              <strong>Choose files or drag them here</strong>
              <small>Files are saved as draft by default.</small>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={config.allowedExtensions.map((ext) => `.${ext}`).join(",")}
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.currentTarget.value = ""; }}
                hidden
                aria-label="Choose files to upload"
              />
            </div>
          </section>

          <section className="bulk-section">
            <label className="bulk-label">Shared metadata</label>
            <p className="bulk-hint">Apply the same value to all files. Leave blank to edit each file separately.</p>
            <div className="bulk-shared-grid">
              <label>Brand
                <select value={shared.brand} onChange={(e) => setShared({ ...shared, brand: e.target.value as AssetBrand })} disabled={running}>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              <label>Version
                <input value={shared.version} onChange={(e) => setShared({ ...shared, version: e.target.value })} disabled={running} />
              </label>
              <label>Default name prefix
                <input value={shared.name} onChange={(e) => setShared({ ...shared, name: e.target.value })} placeholder="Optional" disabled={running} />
              </label>
              <label>Default description
                <input value={shared.description} onChange={(e) => setShared({ ...shared, description: e.target.value })} placeholder="Optional" disabled={running} />
              </label>
              <label>Default alternative text
                <input value={shared.altText} onChange={(e) => setShared({ ...shared, altText: e.target.value })} placeholder="Required for publishing" disabled={running} />
              </label>
              <label className="bulk-checkbox">
                <input type="checkbox" checked={shared.publishAfterUpload} onChange={(e) => setShared({ ...shared, publishAfterUpload: e.target.checked })} disabled={running} />
                <span>Publish after upload</span>
              </label>
            </div>
          </section>

          {items.length > 0 && (
            <section className="bulk-section">
              <div className="bulk-queue-head">
                <label className="bulk-label">File queue ({items.length})</label>
                <div className="bulk-stats" aria-live="polite">
                  <span>{stats.succeeded} done</span>
                  <span>{stats.uploading} uploading</span>
                  <span>{stats.failed} failed</span>
                  <span>{stats.queued} queued</span>
                </div>
              </div>
              <ul className="bulk-queue" role="list">
                {items.map((item) => (
                  <li key={item.id} className={`bulk-queue-item ${item.error ? "has-error" : ""} ${item.done ? "is-done" : ""}`}>
                    <div className="bulk-queue-info">
                      <strong>{item.file.name}</strong>
                      <small>{formatFileSize(item.file.size)} · {item.file.type || "unknown"}</small>
                      {item.validationErrors.length > 0 && (
                        <ul className="bulk-errors" role="alert">
                          {item.validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                        </ul>
                      )}
                      {item.error && <p className="bulk-item-error" role="alert">{item.error}</p>}
                      {item.done && <p className="bulk-item-success">Saved as {item.result?.status ?? "draft"}.</p>}
                      {item.uploading && (
                        <div className="bulk-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress} aria-label={`Uploading ${item.file.name}`}>
                          <span style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="bulk-queue-fields">
                      <label>Name<input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} disabled={item.uploading || item.done} /></label>
                      <label>Alt text<input value={item.altText} onChange={(e) => updateItem(item.id, { altText: e.target.value })} disabled={item.uploading || item.done} placeholder="Describe this asset" /></label>
                      {item.error && !item.uploading && (
                        <button className="text-button" onClick={() => retryItem(item.id)}><Icon name="upload" />Retry</button>
                      )}
                      {!item.done && !item.uploading && (
                        <button className="text-button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}><Icon name="trash" />Remove</button>
                      )}
                      {item.uploading && (
                        <button className="text-button" onClick={() => cancelItem(item.id)}><Icon name="close" />Cancel</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="bulk-footer">
          <div className="bulk-footer-info">
            {items.length === 0 && <span>Choose files to start.</span>}
            {items.length > 0 && !allDone && <span>{items.length} file{items.length === 1 ? "" : "s"} ready.</span>}
            {allDone && <span>All files uploaded. You can close this window.</span>}
          </div>
          <div className="bulk-footer-actions">
            <button className="secondary-button" onClick={() => !running && onClose()} disabled={running}>Close</button>
            <button
              className="primary-button"
              onClick={startUpload}
              disabled={running || items.length === 0 || stats.queued === 0}
            >
              <Icon name="upload" /> {shared.publishAfterUpload ? "Upload and publish" : "Upload as draft"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
