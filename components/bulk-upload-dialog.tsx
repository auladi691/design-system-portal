"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useDialogFocus } from "@/components/dialog-focus";
import {
  ASSET_CATEGORIES,
  INTERNAL_ASSET_COLLECTIONS,
  INTERNAL_COLLECTION_MAP,
  ASSET_CATEGORY_MAP,
  formatFileSize,
  uploadTitleForCategory,
} from "@/lib/asset-categories";
import { validateAssetFile } from "@/lib/asset-validation";
import {
  makeItemFromFile,
  runBulkUpload,
  isInternalDestination,
  type BulkUploadItem,
  type BulkUploadDestination,
} from "@/lib/bulk-upload";
import { pushToast } from "@/lib/toast";
import type { AssetBrand } from "@/types/content";
import { ASSET_PURPOSE_OPTIONS, type AssetPurpose, type AssetTheme } from "@/types/content";

type BulkUploadDialogProps = {
  open: boolean;
  initialDestination: BulkUploadDestination;
  existingSlugs: string[];
  onClose: () => void;
  onComplete: () => void;
};

const BRANDS: AssetBrand[] = ["Shared", "IM3", "Indosat", "Tri", "Partner"];

const THEMES: { value: AssetTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "both", label: "Both" },
];

type SharedMeta = {
  name: string;
  description: string;
  caption: string;
  brand: AssetBrand;
  version: string;
  altText: string;
  theme: AssetTheme;
  purpose: AssetPurpose;
  downloadAvailable: boolean;
  figmaUrl: string;
  publishAfterUpload: boolean;
};

const PUBLIC_PURPOSES_FOR_UPLOAD: AssetPurpose[] = [
  "anatomy",
  "variant",
  "state",
  "foundation-visual",
  "cover-visual",
  "pattern-flow",
  "general-asset",
];

function defaultSharedForDestination(dest: BulkUploadDestination): SharedMeta {
  if (isInternalDestination(dest)) {
    return {
      name: "",
      description: "",
      caption: "",
      brand: "Shared",
      version: "1.0",
      altText: "",
      theme: "both",
      purpose: "component-preview",
      downloadAvailable: true,
      figmaUrl: "",
      publishAfterUpload: false,
    };
  }
  return {
    name: "",
    description: "",
    caption: "",
    brand: "Shared",
    version: "1.0",
    altText: "",
    theme: "both",
    purpose: "general-asset",
    downloadAvailable: true,
    figmaUrl: "",
    publishAfterUpload: false,
  };
}

export function BulkUploadDialog({
  open,
  initialDestination,
  existingSlugs,
  onClose,
  onComplete,
}: BulkUploadDialogProps) {
  const [destination, setDestination] = useState<BulkUploadDestination>(initialDestination);
  const [items, setItems] = useState<BulkUploadItem[]>([]);
  const [shared, setShared] = useState<SharedMeta>(defaultSharedForDestination(initialDestination));
  const [running, setRunning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const [showChangeDestination, setShowChangeDestination] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, open);

  const isInternal = isInternalDestination(destination);
  const destConfig = isInternal
    ? INTERNAL_COLLECTION_MAP[destination as "component-preview"]
    : ASSET_CATEGORY_MAP[destination as keyof typeof ASSET_CATEGORY_MAP];
  const uploadTitle = uploadTitleForCategory(destination);

  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setDestination(initialDestination);
      setItems([]);
      setShared(defaultSharedForDestination(initialDestination));
      setRunning(false);
      setDragActive(false);
      setShowChangeDestination(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !running) {
        e.preventDefault();
        if (showChangeDestination) setShowChangeDestination(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, running, onClose, showChangeDestination]);

  const updateItem = useCallback((id: string, patch: Partial<BulkUploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);



  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;
      setItems((current) => {
        const next = [...current];
        const slugs = [...existingSlugs, ...next.map((i) => i.slug)];
        for (const file of files) {
          const validation = validateAssetFile(file, destination, next.map((i) => ({ name: i.file.name })));
          const item = makeItemFromFile(file, destination, slugs);
          item.validationErrors = validation.errors;
          if (shared.name) item.name = `${shared.name} ${next.length + 1}`;
          if (shared.description) item.description = shared.description;
          if (shared.caption) item.caption = shared.caption;
          if (shared.altText) item.altText = shared.altText;
          item.brand = shared.brand;
          item.version = shared.version;
          item.theme = shared.theme;
          item.downloadAvailable = shared.downloadAvailable;
          item.figmaUrl = shared.figmaUrl || undefined;
          if (!isInternalDestination(destination)) {
            item.purpose = shared.purpose;
          }
          slugs.push(item.slug);
          next.push(item);
        }
        return next;
      });
    },
    [destination, existingSlugs, shared],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (running) return;
      addFiles(e.dataTransfer.files);
    },
    [addFiles, running],
  );

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const retryItem = useCallback(
    (id: string) => {
      updateItem(id, { error: null, done: false, uploading: false, progress: 0, validationErrors: [] });
      const target = items.find((i) => i.id === id);
      if (!target) return;
      const validation = validateAssetFile(
        target.file,
        destination,
        items.filter((i) => i.id !== id).map((i) => ({ name: i.file.name })),
      );
      updateItem(id, { validationErrors: validation.errors });
    },
    [items, destination, updateItem],
  );

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

  const cancelItem = useCallback(
    (id: string) => {
      updateItem(id, { uploading: false, done: false, progress: 0, error: null, validationErrors: ["Cancelled by administrator."] });
    },
    [updateItem],
  );

  const handleChangeDestination = (newDest: BulkUploadDestination) => {
    if (newDest === destination) {
      setShowChangeDestination(false);
      return;
    }
    if (items.length > 0) {
      const confirmed = window.confirm(
        `Change destination from ${uploadTitleForCategory(destination)} to ${uploadTitleForCategory(newDest)}? Existing files in the queue will be re-validated for the new destination and internal files will be set to component-preview purpose.`,
      );
      if (!confirmed) return;
    }
    setDestination(newDest);
    setShared(defaultSharedForDestination(newDest));
    setItems((current) =>
      current.map((item) => {
        const revalidated = validateAssetFile(item.file, newDest, []);
        const isNewInternal = isInternalDestination(newDest);
        return {
          ...item,
          destination: newDest,
          type: isNewInternal ? ("icon-illustration" as const) : (newDest as never),
          purpose: isNewInternal ? "component-preview" : item.purpose,
          visibility: isNewInternal ? "internal" : "public",
          category: isNewInternal ? "Component preview" : item.category,
          validationErrors: revalidated.errors,
        };
      }),
    );
    setShowChangeDestination(false);
  };

  const stats = useMemo(() => {
    let queued = 0,
      uploading = 0,
      succeeded = 0,
      failed = 0;
    for (const item of items) {
      if (item.done) succeeded += 1;
      else if (item.uploading) uploading += 1;
      else if (item.error) failed += 1;
      else queued += 1;
    }
    return { queued, uploading, succeeded, failed };
  }, [items]);

  if (!open) return null;
  const allDone = items.length > 0 && items.every((item) => item.done);
  const configForHint = destConfig;
  const allowedExtText = configForHint ? configForHint.allowedExtensions.join(", ") : "—";
  const maxSizeText = configForHint ? formatFileSize(configForHint.maxSizeBytes) : "—";

  return (
    <div className="dialog-backdrop" onClick={() => !running && !showChangeDestination && onClose()} role="presentation">
      <div
        ref={dialogRef}
        className="bulk-upload-dialog bulk-upload-dialog-category-first"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-upload-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bulk-header">
          <div className="bulk-header-main">
            <span className="eyebrow">Bulk upload</span>
            <h2 id="bulk-upload-title">{uploadTitle}</h2>
            <div className="bulk-destination-locked">
              <span className="bulk-destination-badge">
                <Icon name="layers" />
                {isInternal ? "Internal — Component previews" : ASSET_CATEGORY_MAP[destination as keyof typeof ASSET_CATEGORY_MAP]?.label ?? destination}
                {isInternal && <em>internal only</em>}
              </span>
              <button
                className="text-button small bulk-change-dest"
                onClick={() => setShowChangeDestination((v) => !v)}
                disabled={running}
                aria-expanded={showChangeDestination}
                aria-controls="change-destination-panel"
              >
                Change destination
              </button>
            </div>
            {isInternal ? (
              <p className="muted-note">
                Component previews are internal documentation visuals. Automatically set to purpose <code>component-preview</code> and visibility{" "}
                <code>internal</code>. They never appear in the public Asset Explorer and render publicly only when referenced by a published documentation
                block (Design Preview, Variant Gallery, State Gallery).
              </p>
            ) : (
              <p className="muted-note">
                Files will be stored in <strong>{configForHint?.label ?? destination}</strong>. Allowed formats: {allowedExtText}. Max size:{" "}
                {maxSizeText}.
              </p>
            )}
          </div>
          <button className="drawer-close" onClick={() => !running && onClose()} aria-label="Close bulk upload" disabled={running}>
            <Icon name="close" />
          </button>
        </header>

        {showChangeDestination && (
          <div id="change-destination-panel" className="bulk-change-destination-panel" role="region" aria-label="Change destination">
            <p className="muted-note">Changing destination is explicit to avoid accidental upload to the wrong collection.</p>
            <div className="bulk-category-grid small">
              {ASSET_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  role="radio"
                  aria-checked={destination === c.slug}
                  className={`bulk-category-card ${destination === c.slug ? "active" : ""}`}
                  onClick={() => handleChangeDestination(c.slug)}
                  disabled={running}
                >
                  <strong>{c.label}</strong>
                  <small>{c.allowedExtensions.join(", ")}</small>
                </button>
              ))}
              {INTERNAL_ASSET_COLLECTIONS.map((col) => (
                <button
                  key={col.id}
                  role="radio"
                  aria-checked={destination === col.id}
                  className={`bulk-category-card internal ${destination === col.id ? "active" : ""}`}
                  onClick={() => handleChangeDestination(col.id)}
                  disabled={running}
                >
                  <strong>{col.label}</strong>
                  <small>
                    {col.allowedExtensions.join(", ")} · internal
                  </small>
                </button>
              ))}
            </div>
            <div className="bulk-change-actions">
              <button className="secondary-button small" onClick={() => setShowChangeDestination(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bulk-body">
          <section className="bulk-section">
            <label className="bulk-label">Drop zone — {isInternal ? "Component previews" : configForHint?.label ?? destination}</label>
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={onDrop}
            >
              <Icon name="upload" />
              <strong>Choose files or drag them here</strong>
              <small>Allowed: {allowedExtText} · Max {maxSizeText} · Saved as draft by default</small>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={configForHint?.allowedExtensions.map((ext) => `.${ext}`).join(",")}
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
                hidden
                aria-label="Choose files to upload"
              />
            </div>
          </section>

          <section className="bulk-section bulk-metadata-section">
            <label className="bulk-label">Shared metadata — applied to all files in this upload</label>
            <p className="bulk-hint">Edit per-file name, description, caption, alt text, theme, version, purpose, Figma URL, and download setting below. Internal destinations lock purpose to component-preview.</p>
            <div className="bulk-shared-grid">
              <label>
                Default name prefix
                <input
                  value={shared.name}
                  onChange={(e) => setShared({ ...shared, name: e.target.value })}
                  placeholder="Optional — prepended to file names"
                  disabled={running}
                />
              </label>
              <label>
                Brand
                <select value={shared.brand} onChange={(e) => setShared({ ...shared, brand: e.target.value as AssetBrand })} disabled={running}>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Version
                <input value={shared.version} onChange={(e) => setShared({ ...shared, version: e.target.value })} disabled={running} />
              </label>
              <label>
                Theme
                <select value={shared.theme} onChange={(e) => setShared({ ...shared, theme: e.target.value as AssetTheme })} disabled={running}>
                  {THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Default description
                <input
                  value={shared.description}
                  onChange={(e) => setShared({ ...shared, description: e.target.value })}
                  placeholder="Optional — helps search"
                  disabled={running}
                />
              </label>
              <label>
                Default caption
                <input
                  value={shared.caption}
                  onChange={(e) => setShared({ ...shared, caption: e.target.value })}
                  placeholder="Shown with visual"
                  disabled={running}
                />
              </label>
              <label>
                Default alternative text
                <input
                  value={shared.altText}
                  onChange={(e) => setShared({ ...shared, altText: e.target.value })}
                  placeholder="Required for publishing"
                  disabled={running}
                />
              </label>
              <label>
                Purpose
                <select
                  value={shared.purpose}
                  onChange={(e) => setShared({ ...shared, purpose: e.target.value as AssetPurpose })}
                  disabled={running || isInternal}
                >
                  {isInternal ? (
                    <option value="component-preview">Component preview (internal)</option>
                  ) : (
                    PUBLIC_PURPOSES_FOR_UPLOAD.map((p) => {
                      const label = ASSET_PURPOSE_OPTIONS.find((o) => o.value === p)?.label ?? p;
                      return (
                        <option key={p} value={p}>
                          {label}
                        </option>
                      );
                    })
                  )}
                </select>
                {isInternal && <small>Locked for internal collection</small>}
              </label>
              <label>
                Figma URL
                <input
                  value={shared.figmaUrl}
                  onChange={(e) => setShared({ ...shared, figmaUrl: e.target.value })}
                  placeholder="https://www.figma.com/file/..."
                  disabled={running}
                />
              </label>
              <label className="bulk-checkbox">
                <input
                  type="checkbox"
                  checked={shared.downloadAvailable}
                  onChange={(e) => setShared({ ...shared, downloadAvailable: e.target.checked })}
                  disabled={running}
                />
                <span>Allow download</span>
              </label>
              <label className="bulk-checkbox">
                <input
                  type="checkbox"
                  checked={shared.publishAfterUpload}
                  onChange={(e) => setShared({ ...shared, publishAfterUpload: e.target.checked })}
                  disabled={running}
                />
                <span>Publish after upload</span>
              </label>
            </div>
          </section>

          {items.length > 0 && (
            <section className="bulk-section">
              <div className="bulk-queue-head">
                <label className="bulk-label">File queue ({items.length}) — {uploadTitle}</label>
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
                      <small title={`${item.file.name} — ${item.file.size} bytes`}>
                        {formatFileSize(item.file.size)} · {item.file.type || "empty/type"} → {item.destination} · {item.purpose}
                        {item.visibility === "internal" ? " · internal" : ""} · ext: {item.file.name.split(".").pop()?.toLowerCase() ?? "—"}
                      </small>
                      {item.validationErrors.length > 0 && (
                        <ul className="bulk-errors" role="alert">
                          {item.validationErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      )}
                      {item.error && (
                        <div className="bulk-item-error" role="alert">
                          <strong>Upload failed</strong>
                          <p>{item.error}</p>
                          <small>Check browser console for details, session, and RLS policies. If storage blocked, sign in again as administrator.</small>
                        </div>
                      )}
                      {item.done && <p className="bulk-item-success">Saved as {item.result?.status ?? "draft"} to {item.destination}.</p>}
                      {item.uploading && (
                        <div
                          className="bulk-progress"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={item.progress}
                          aria-label={`Uploading ${item.file.name}`}
                        >
                          <span style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="bulk-queue-fields">
                      <label>
                        Name
                        <input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })}
                          disabled={item.uploading || item.done}
                        />
                      </label>
                      <div className="bulk-queue-row">
                        <label>
                          Description
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            disabled={item.uploading || item.done}
                            placeholder="Optional"
                          />
                        </label>
                        <label>
                          Caption
                          <input
                            value={item.caption}
                            onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                            disabled={item.uploading || item.done}
                            placeholder="Shown with visual"
                          />
                        </label>
                      </div>
                      <div className="bulk-queue-row">
                        <label>
                          Alt text
                          <input
                            value={item.altText}
                            onChange={(e) => updateItem(item.id, { altText: e.target.value })}
                            disabled={item.uploading || item.done}
                            placeholder="Describe for screen readers"
                          />
                        </label>
                        <label>
                          Theme
                          <select
                            value={item.theme}
                            onChange={(e) => updateItem(item.id, { theme: e.target.value as AssetTheme })}
                            disabled={item.uploading || item.done}
                          >
                            {THEMES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="bulk-queue-row">
                        <label>
                          Version
                          <input
                            value={item.version}
                            onChange={(e) => updateItem(item.id, { version: e.target.value })}
                            disabled={item.uploading || item.done}
                          />
                        </label>
                        <label>
                          Brand
                          <select
                            value={item.brand}
                            onChange={(e) => updateItem(item.id, { brand: e.target.value as AssetBrand })}
                            disabled={item.uploading || item.done}
                          >
                            {BRANDS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="bulk-queue-row">
                        <label>
                          Purpose
                          <select
                            value={item.purpose}
                            onChange={(e) => updateItem(item.id, { purpose: e.target.value as AssetPurpose })}
                            disabled={item.uploading || item.done || isInternalDestination(item.destination)}
                          >
                            {isInternalDestination(item.destination) ? (
                              <option value="component-preview">Component preview (internal)</option>
                            ) : (
                              PUBLIC_PURPOSES_FOR_UPLOAD.map((p) => {
                                const label = ASSET_PURPOSE_OPTIONS.find((o) => o.value === p)?.label ?? p;
                                return (
                                  <option key={p} value={p}>
                                    {label}
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </label>
                        <label>
                          Figma URL
                          <input
                            value={item.figmaUrl ?? ""}
                            onChange={(e) => updateItem(item.id, { figmaUrl: e.target.value || undefined })}
                            disabled={item.uploading || item.done}
                            placeholder="https://..."
                          />
                        </label>
                      </div>
                      <label className="bulk-checkbox">
                        <input
                          type="checkbox"
                          checked={item.downloadAvailable}
                          onChange={(e) => updateItem(item.id, { downloadAvailable: e.target.checked })}
                          disabled={item.uploading || item.done}
                        />
                        <span>Allow download</span>
                      </label>
                      <div className="bulk-queue-item-actions">
                        {item.error && !item.uploading && (
                          <button className="text-button" onClick={() => retryItem(item.id)}>
                            <Icon name="upload" />
                            Retry
                          </button>
                        )}
                        {!item.done && !item.uploading && (
                          <button className="text-button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}>
                            <Icon name="trash" />
                            Remove
                          </button>
                        )}
                        {item.uploading && (
                          <button className="text-button" onClick={() => cancelItem(item.id)}>
                            <Icon name="close" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="bulk-footer">
          <div className="bulk-footer-info">
            {items.length === 0 && <span>Destination locked to {uploadTitle}. Choose files to start. Allowed: {allowedExtText}.</span>}
            {items.length > 0 && !allDone && <span>{items.length} file{items.length === 1 ? "" : "s"} queued for {uploadTitle}.</span>}
            {allDone && <span>All files uploaded to {uploadTitle}. You can close this window.</span>}
          </div>
          <div className="bulk-footer-actions">
            <button className="secondary-button" onClick={() => !running && onClose()} disabled={running}>
              Close
            </button>
            <button className="primary-button" onClick={startUpload} disabled={running || items.length === 0 || stats.queued === 0}>
              <Icon name="upload" /> {shared.publishAfterUpload ? "Upload and publish" : "Upload as draft"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
