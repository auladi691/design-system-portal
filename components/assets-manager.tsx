"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { AssetEditor } from "@/components/asset-editor";
import { BulkUploadDialog } from "@/components/bulk-upload-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ASSET_CATEGORIES,
  INTERNAL_ASSET_COLLECTIONS,
  categoryLabel,
  uploadLabelForCategory,
  INTERNAL_COLLECTION_MAP,
} from "@/lib/asset-categories";
import { deleteStoragePath } from "@/lib/asset-storage";
import { friendlyErrorMessage } from "@/lib/repository";
import { pushToast } from "@/lib/toast";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { AppContext } from "@/components/design-system-app";
import { ASSET_PURPOSE_OPTIONS, type Asset, type AssetPurpose } from "@/types/content";
import type { BulkUploadDestination } from "@/lib/bulk-upload";

type AssetsManagerProps = { app: AppContext };

type CategoryView = BulkUploadDestination;

export function AssetsManager({ app }: AssetsManagerProps) {
  const [activeView, setActiveView] = useState<CategoryView>(ASSET_CATEGORIES[0].slug);
  const [query, setQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<"all" | AssetPurpose>("all");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDestination, setBulkDestination] = useState<BulkUploadDestination>(ASSET_CATEGORIES[0].slug);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [confirmSingleDelete, setConfirmSingleDelete] = useState<Asset | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);

  const isInternalView = activeView === "component-preview";
  const lower = query.toLowerCase();

  const allAssets = useMemo(() => {
    // Merge server assets with locally uploaded assets for preview mode (Supabase not configured)
    const merged = [...app.data.assets];
    for (const la of localAssets) {
      if (!merged.some((a) => a.id === la.id)) merged.push(la);
    }
    return merged;
  }, [app.data.assets, localAssets]);

  const list = useMemo(() => {
    if (isInternalView) {
      return allAssets.filter((a) => {
        const isInternal = a.purpose === "component-preview" || a.visibility === "internal";
        if (!isInternal) return false;
        if (purposeFilter !== "all" && a.purpose !== purposeFilter) return false;
        return `${a.name} ${a.category} ${a.brand} ${a.purpose} ${a.keywords.join(" ")}`.toLowerCase().includes(lower);
      });
    }
    return allAssets.filter((a) => {
      if (a.type !== activeView) return false;
      if (purposeFilter !== "all" && a.purpose !== purposeFilter) return false;
      return `${a.name} ${a.category} ${a.brand} ${a.purpose} ${a.keywords.join(" ")}`.toLowerCase().includes(lower);
    });
  }, [allAssets, activeView, isInternalView, lower, purposeFilter]);

  const existingSlugs = useMemo(() => allAssets.map((a) => a.slug), [allAssets]);

  const toggleSelection = (id: string) => {
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelection(new Set(list.map((a) => a.id)));
  const clearSelection = () => setSelection(new Set());

  const openUploadForCurrent = () => {
    setBulkDestination(activeView);
    setBulkOpen(true);
  };

  const uploadLabel = uploadLabelForCategory(activeView);
  const destinationConfig = isInternalView
    ? INTERNAL_COLLECTION_MAP[activeView as "component-preview"]
    : (ASSET_CATEGORIES.find((c) => c.slug === activeView) ?? ASSET_CATEGORIES[0]);

  const createBlank = async (dest: BulkUploadDestination) => {
    const isInternal = dest === "component-preview";
    const id = crypto.randomUUID();
    const baseLabel = isInternal
      ? INTERNAL_COLLECTION_MAP[dest as "component-preview"].label.slice(0, -1)
      : categoryLabel(dest as never).slice(0, -1);
    const name = `New ${baseLabel}`;
    const slug = uniqueSlug(slugify(name), existingSlugs);
    const asset: Asset = {
      id,
      type: isInternal ? "icon-illustration" : (dest as Asset["type"]),
      name,
      slug,
      category: isInternal ? "Component preview" : "General",
      brand: "Shared",
      purpose: isInternal ? "component-preview" : "general-asset",
      visibility: isInternal ? "internal" : "public",
      status: "draft",
      description: "",
      keywords: [],
      glyph: name.slice(0, 1).toUpperCase(),
      version: "1.0",
      updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      altText: "",
      caption: "",
      theme: "both",
      figmaUrl: undefined,
      downloadAvailable: true,
      filePath: null,
      fileUrl: null,
      mimeType: null,
      fileSize: null,
      originalFileName: null,
      createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    try {
      const result = await app.upsertAsset(asset);
      if (!result.ok) throw new Error(result.error ?? "We couldn't create this asset.");
      setSelected(asset);
      pushToast("info", "Draft asset created. Upload a file and add details before publishing.");
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    }
  };

  const deleteAsset = async (asset: Asset) => {
    setBusy(true);
    try {
      const result = await app.removeAsset(asset.id);
      if (!result.ok) throw new Error(result.error ?? "We couldn't delete this asset.");
      const storageDeleted = await deleteStoragePath(asset.filePath ?? "");
      if (!storageDeleted) {
        const restored = await app.upsertAsset(asset);
        if (!restored.ok) throw new Error("The asset record was removed, but its file could not be cleaned up.");
        throw new Error("We couldn't remove the asset file. The asset record was restored.");
      }
      pushToast("success", "Asset deleted.");
      if (selected?.id === asset.id) setSelected(null);
      setConfirmSingleDelete(null);
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const bulkPublish = async () => {
    setBusy(true);
    let ok = 0,
      fail = 0;
    try {
      for (const id of selection) {
        const target = app.data.assets.find((a) => a.id === id);
        if (!target) continue;
        try {
          const result = await app.upsertAsset({
            ...target,
            status: "published",
            updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          });
          if (result.ok) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      if (fail === 0) pushToast("success", `${ok} asset${ok === 1 ? "" : "s"} published.`);
      else pushToast("warning", `${ok} published, ${fail} failed. Try the failed ones again.`);
      clearSelection();
    } finally {
      setBusy(false);
    }
  };

  const bulkArchive = async () => {
    setBusy(true);
    let ok = 0,
      fail = 0;
    try {
      for (const id of selection) {
        const target = app.data.assets.find((a) => a.id === id);
        if (!target) continue;
        try {
          const result = await app.upsertAsset({
            ...target,
            status: "archived",
            updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          });
          if (result.ok) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      if (fail === 0) pushToast("success", `${ok} asset${ok === 1 ? "" : "s"} archived.`);
      else pushToast("warning", `${ok} archived, ${fail} failed. Try the failed ones again.`);
      clearSelection();
    } finally {
      setBusy(false);
    }
  };

  const bulkDelete = async () => {
    setBusy(true);
    const targets = app.data.assets.filter((a) => selection.has(a.id));
    let ok = 0;
    let databaseFailures = 0;
    let storageFailures = 0;
    try {
      for (const target of targets) {
        try {
          const result = await app.removeAsset(target.id);
          if (!result.ok) {
            databaseFailures += 1;
            continue;
          }
          const storageDeleted = await deleteStoragePath(target.filePath ?? "");
          if (storageDeleted) {
            ok += 1;
            continue;
          }
          storageFailures += 1;
          const restored = await app.upsertAsset(target);
          if (!restored.ok) pushToast("error", `We couldn't restore ${target.name} after file cleanup failed.`);
        } catch {
          databaseFailures += 1;
        }
      }
      if (!databaseFailures && !storageFailures) {
        pushToast("success", `${ok} asset${ok === 1 ? "" : "s"} deleted.`);
      } else {
        const details = [
          databaseFailures ? `${databaseFailures} asset${databaseFailures === 1 ? "" : "s"}` : "",
          storageFailures ? `${storageFailures} storage file${storageFailures === 1 ? "" : "s"}` : "",
        ]
          .filter(Boolean)
          .join(" and ");
        pushToast("warning", `${ok} asset${ok === 1 ? "" : "s"} removed. ${details} could not be deleted. Try again.`);
      }
      clearSelection();
      setConfirmBulkDelete(false);
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const publicCounts = (slug: string) => allAssets.filter((a) => (a as { type: string }).type === slug).length;
  const internalCount = allAssets.filter((a) => a.purpose === "component-preview" || a.visibility === "internal").length;

  return (
    <div className="studio-page">
      <StudioHeader eyebrow="Assets" title="Asset Library" />

      <div className="asset-manager-tabs-wrap">
        <div className="asset-manager-tabs" role="tablist" aria-label="Asset categories">
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              role="tab"
              aria-selected={activeView === cat.slug}
              className={activeView === cat.slug ? "active" : ""}
              onClick={() => setActiveView(cat.slug)}
            >
              {cat.label}
              <span className="tab-count">{publicCounts(cat.slug)}</span>
            </button>
          ))}
        </div>
        <div className="asset-manager-tabs internal" role="tablist" aria-label="Internal collections">
          <span className="internal-label">Internal</span>
          {INTERNAL_ASSET_COLLECTIONS.map((col) => (
            <button
              key={col.id}
              role="tab"
              aria-selected={activeView === col.id}
              className={activeView === col.id ? "active internal-tab" : "internal-tab"}
              onClick={() => setActiveView(col.id)}
              title={col.description}
            >
              {col.label}
              <span className="tab-count">{internalCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="manager-toolbar manager-toolbar-category">
        <div className="manager-toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${isInternalView ? "component previews" : destinationConfig.label.toLowerCase()}...`}
              aria-label="Search assets"
            />
          </label>
          <label aria-label="Filter by purpose" className="purpose-filter-label">
            <small>Purpose</small>
            <select value={purposeFilter} onChange={(e) => setPurposeFilter(e.target.value as Asset["purpose"] | "all")}>
              <option value="all">All purposes</option>
              {ASSET_PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                  {o.internal ? " (internal)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="manager-toolbar-actions">
          <button className="primary-button" onClick={openUploadForCurrent}>
            <Icon name="upload" />
            {uploadLabel}
          </button>
          <button className="secondary-button" onClick={() => createBlank(activeView)} disabled={busy}>
            <Icon name="plus" />
            New draft
          </button>
        </div>
      </div>

      {selection.size > 0 && (
        <div className="bulk-toolbar" role="region" aria-label="Bulk actions">
          <strong>{selection.size} selected</strong>
          <div className="bulk-toolbar-actions">
            <button className="secondary-button" onClick={bulkPublish} disabled={busy}>
              Publish
            </button>
            <button className="secondary-button" onClick={bulkArchive} disabled={busy}>
              Archive
            </button>
            <button className="danger-button" onClick={() => setConfirmBulkDelete(true)} disabled={busy}>
              <Icon name="trash" />
              Delete
            </button>
            <button className="text-button" onClick={clearSelection} disabled={busy}>
              Clear
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-panel empty-panel-category">
          <Icon name="image" />
          <h2>{isInternalView ? "No component previews yet" : `No ${destinationConfig.label.toLowerCase()} yet`}</h2>
          <p>
            {isInternalView
              ? "Component previews are internal documentation visuals used only inside Design Preview, Variant Gallery, and State Gallery blocks. They never appear in the public Asset Explorer."
              : destinationConfig.emptyMessage}
          </p>
          <div className="empty-panel-actions">
            <button className="primary-button" onClick={openUploadForCurrent}>
              <Icon name="upload" />
              {uploadLabel}
            </button>
          </div>
          <small className="muted-note">
            Allowed formats: {destinationConfig.allowedExtensions.join(", ")} · Max {formatSize(destinationConfig.maxSizeBytes)}
            {isInternalView && " · Automatically set to purpose component-preview and visibility internal"}
          </small>
        </div>
      ) : (
        <>
          <div className="asset-manager-bulk-head">
            <button className="text-button" onClick={selectAll} disabled={busy}>
              Select all ({list.length})
            </button>
            {selection.size > 0 && (
              <button className="text-button" onClick={clearSelection} disabled={busy}>
                Clear selection
              </button>
            )}
          </div>
          <div className="asset-manager-grid">
            {list.map((a) => (
              <article key={a.id} className={`asset-manager-card status-${a.status} ${selection.has(a.id) ? "selected" : ""}`}>
                <label className="asset-select">
                  <input
                    type="checkbox"
                    checked={selection.has(a.id)}
                    onChange={() => toggleSelection(a.id)}
                    aria-label={`Select ${a.name}`}
                  />
                </label>
                <button className="asset-manager-card-body" onClick={() => setSelected(a)} aria-label={`Edit ${a.name}`}>
                  <div className="asset-glyph" aria-hidden="true">
                    {a.fileUrl && a.mimeType && a.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.fileUrl} alt={a.altText || a.name} loading="lazy" />
                    ) : (
                      <span>{a.glyph}</span>
                    )}
                  </div>
                  <strong>{a.name}</strong>
                  <small>
                    {a.category} · {a.purpose.replace("-", " ")}
                    {a.visibility === "internal" ? " · internal" : ""}
                  </small>
                  <em className={`status ${a.status}`}>{a.status}</em>
                </button>
                <div className="asset-card-actions">
                  <button onClick={() => setSelected(a)} aria-label={`Edit ${a.name}`} title="Edit">
                    <Icon name="edit" />
                  </button>
                  <button onClick={() => setConfirmSingleDelete(a)} aria-label={`Delete ${a.name}`} title="Delete">
                    <Icon name="trash" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {selected && (
        <AssetEditor asset={selected} app={app} close={() => setSelected(null)} onDelete={(asset) => setConfirmSingleDelete(asset)} />
      )}

      <BulkUploadDialog
        open={bulkOpen}
        initialDestination={bulkDestination}
        existingSlugs={existingSlugs}
        onClose={() => setBulkOpen(false)}
        onComplete={(uploaded) => {
          if (uploaded && uploaded.length) {
            // Keep local copy for preview mode (Supabase not configured) and instant feedback
            setLocalAssets((prev) => {
              const merged = [...prev];
              for (const up of uploaded) {
                if (!merged.some((a) => a.id === up.id) && !app.data.assets.some((a) => a.id === up.id)) {
                  merged.push(up);
                }
              }
              return merged;
            });
          }
          void app.reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmSingleDelete)}
        title="Delete asset?"
        description="This asset and its file will be removed permanently. This action cannot be undone."
        confirmLabel="Delete asset"
        tone="danger"
        busy={busy}
        onCancel={() => setConfirmSingleDelete(null)}
        onConfirm={() => confirmSingleDelete && deleteAsset(confirmSingleDelete)}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selection.size} asset${selection.size === 1 ? "" : "s"}?`}
        description="These assets and their files will be removed permanently. This action cannot be undone."
        confirmLabel={`Delete ${selection.size} asset${selection.size === 1 ? "" : "s"}`}
        tone="danger"
        busy={busy}
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={() => bulkDelete()}
      />
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function StudioHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="studio-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
    </header>
  );
}
