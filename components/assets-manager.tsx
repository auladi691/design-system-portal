"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { AssetEditor } from "@/components/asset-editor";
import { BulkUploadDialog } from "@/components/bulk-upload-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ASSET_CATEGORIES,
  categoryLabel,
  uploadLabelForCategory,
  INTERNAL_COLLECTION_MAP,
} from "@/lib/asset-categories";
import { deleteStoragePath, uploadAssetFileForDestination } from "@/lib/asset-storage";
import { friendlyErrorMessage } from "@/lib/repository";
import { pushToast } from "@/lib/toast";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { AppContext } from "@/components/design-system-app";
import { ASSET_PURPOSE_OPTIONS, type Asset, type AssetPurpose } from "@/types/content";
import type { BulkUploadDestination } from "@/lib/bulk-upload";

type AssetsManagerProps = { app: AppContext };

type CategoryView = BulkUploadDestination;

type CollectionMeta = {
  id: CategoryView;
  label: string;
  description: string;
  isInternal: boolean;
  emptyMessage: string;
  allowedExtensions: readonly string[];
  maxSizeBytes: number;
};

export function AssetsManager({ app }: AssetsManagerProps) {
  const [activeView, setActiveView] = useState<CategoryView>("component-preview");
  const [query, setQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<"all" | AssetPurpose>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Asset["status"]>("all");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDestination, setBulkDestination] = useState<BulkUploadDestination>("component-preview");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [confirmSingleDelete, setConfirmSingleDelete] = useState<Asset | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);

  // Merge server + local optimistic for immediate feedback in preview mode
  const allAssets = useMemo(() => {
    const merged = [...app.data.assets];
    for (const la of localAssets) {
      if (!merged.some((a) => a.id === la.id)) merged.push(la);
    }
    return merged;
  }, [app.data.assets, localAssets]);

  const isInternalView = activeView === "component-preview";
  const lower = query.toLowerCase();

  const collectionMeta = useMemo<CollectionMeta>(() => {
    if (isInternalView) {
      const col = INTERNAL_COLLECTION_MAP["component-preview"];
      return {
        id: "component-preview",
        label: col.label,
        description: "Internal documentation visuals for Design Preview, Variant Gallery, and State Gallery. Never shown in public Asset Explorer.",
        isInternal: true,
        emptyMessage: col.emptyMessage,
        allowedExtensions: col.allowedExtensions,
        maxSizeBytes: col.maxSizeBytes,
      };
    }
    const cat = ASSET_CATEGORIES.find((c) => c.slug === activeView);
    if (!cat) {
      const fallback = ASSET_CATEGORIES[0];
      return {
        id: fallback.slug,
        label: fallback.label,
        description: fallback.description,
        isInternal: false,
        emptyMessage: fallback.emptyMessage,
        allowedExtensions: fallback.allowedExtensions,
        maxSizeBytes: fallback.maxSizeBytes,
      };
    }
    return {
      id: cat.slug,
      label: cat.label,
      description: cat.description,
      isInternal: false,
      emptyMessage: cat.emptyMessage,
      allowedExtensions: cat.allowedExtensions,
      maxSizeBytes: cat.maxSizeBytes,
    };
  }, [activeView, isInternalView]);

  const list = useMemo(() => {
    if (isInternalView) {
      // Correct filter per spec: purpose === component-preview && visibility === internal
      // Do not require category === component-preview (spec forbids that)
      // Do not combine with selected public category
      return allAssets.filter((a) => {
        const isComponentPreview = a.purpose === "component-preview" && a.visibility === "internal";
        if (!isComponentPreview) return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        // All purposes must not exclude component previews in internal view — so ignore purposeFilter unless explicitly set to component-preview or general
        if (purposeFilter !== "all" && purposeFilter !== "component-preview" && a.purpose !== purposeFilter) {
          // For internal view, only filter if user explicitly picked a purpose; "All purposes" includes everything
          // But spec says All purposes must not exclude component previews — so when purposeFilter is all, include
          // When filter is specific non-component-preview, we can still filter, but typically internal view shows all component previews
          // To keep simple: if purposeFilter is not all and not component-preview, exclude (user explicitly filtered)
          return false;
        }
        if (!lower) return true;
        return `${a.name} ${a.category} ${a.brand} ${a.purpose} ${a.keywords.join(" ")}`.toLowerCase().includes(lower);
      });
    }
    return allAssets.filter((a) => {
      if (a.type !== activeView) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (purposeFilter !== "all" && a.purpose !== purposeFilter) return false;
      if (!lower) return true;
      return `${a.name} ${a.category} ${a.brand} ${a.purpose} ${a.keywords.join(" ")}`.toLowerCase().includes(lower);
    });
  }, [allAssets, activeView, isInternalView, lower, purposeFilter, statusFilter]);

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

  const createBlank = async (dest: BulkUploadDestination) => {
    const isInternal = dest === "component-preview";
    const id = crypto.randomUUID();
    const baseLabel = isInternal
      ? INTERNAL_COLLECTION_MAP[dest as "component-preview"].singularLabel
      : categoryLabel(dest as never);
    const name = `New ${baseLabel}`;
    const slug = uniqueSlug(slugify(name), existingSlugs);
    const asset: Asset = {
      id,
      type: isInternal ? "component-preview" : (dest as Asset["type"]),
      name,
      slug,
      category: "General",
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
      pushToast("info", `Draft ${baseLabel.toLowerCase()} created. Upload a file and add details before publishing.`);
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    }
  };

  const handleReplaceFile = async (asset: Asset, file: File) => {
    const isInternal = asset.purpose === "component-preview" && asset.visibility === "internal";
    const destination: BulkUploadDestination = isInternal ? "component-preview" : asset.type;
    try {
      const stored = await uploadAssetFileForDestination(destination, file);
      const previousPath = asset.filePath;
      const next: Asset = {
        ...asset,
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
        throw new Error(result.error ?? "We couldn't save the replacement.");
      }
      if (previousPath && previousPath !== stored.path) {
        const deleted = await deleteStoragePath(previousPath);
        if (!deleted) pushToast("warning", "Replacement saved, but previous file could not be removed.");
      }
      pushToast("success", `${asset.name} file replaced. All usages now show the new file.`);
    } catch (e) {
      pushToast("error", e instanceof Error ? e.message : "We couldn't replace this file.");
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
        const target = allAssets.find((a) => a.id === id);
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
        const target = allAssets.find((a) => a.id === id);
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
    const targets = allAssets.filter((a) => selection.has(a.id));
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
  const internalCount = allAssets.filter((a) => a.purpose === "component-preview" && a.visibility === "internal").length;

  const allCollections: CollectionMeta[] = [
    {
      id: "component-preview",
      label: INTERNAL_COLLECTION_MAP["component-preview"].label,
      description: INTERNAL_COLLECTION_MAP["component-preview"].description,
      isInternal: true,
      emptyMessage: INTERNAL_COLLECTION_MAP["component-preview"].emptyMessage,
      allowedExtensions: INTERNAL_COLLECTION_MAP["component-preview"].allowedExtensions,
      maxSizeBytes: INTERNAL_COLLECTION_MAP["component-preview"].maxSizeBytes,
    },
    ...ASSET_CATEGORIES.map((cat) => ({
      id: cat.slug as CategoryView,
      label: cat.label,
      description: cat.description,
      isInternal: false,
      emptyMessage: cat.emptyMessage,
      allowedExtensions: cat.allowedExtensions,
      maxSizeBytes: cat.maxSizeBytes,
    })),
  ];

  return (
    <div className="studio-page asset-library-page">
      <StudioHeader
        eyebrow="Assets"
        title="Asset Library"
        description="Manage icons, illustrations, brand assets, and internal documentation visuals."
      />

      <div className="asset-library-collections" role="tablist" aria-label="Asset collections">
        {allCollections.map((col) => {
          const count = col.id === "component-preview" ? internalCount : publicCounts(col.id as string);
          const active = activeView === col.id;
          return (
            <button
              key={col.id}
              role="tab"
              aria-selected={active}
              className={`collection-card ${col.isInternal ? "internal" : ""} ${active ? "active" : ""}`}
              onClick={() => setActiveView(col.id)}
            >
              <div className="collection-card-header">
                <span className="collection-label">{col.label}</span>
                {col.isInternal && <span className="badge internal-badge">Internal</span>}
              </div>
              <span className="collection-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="selected-collection-info">
        <div className="selected-collection-header">
          <h2>{collectionMeta.label}</h2>
          {collectionMeta.isInternal && <span className="badge internal-badge">Internal</span>}
          <span className="collection-count-inline">{list.length} assets</span>
        </div>
        <p className="muted-note">{collectionMeta.description}</p>
      </div>

      <div className="manager-toolbar manager-toolbar-category">
        <div className="manager-toolbar-left">
          <label className="search-field">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${collectionMeta.label.toLowerCase()}...`}
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
          <label aria-label="Filter by status" className="purpose-filter-label">
            <small>Status</small>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Asset["status"] | "all")}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        <div className="manager-toolbar-actions">
          {list.length > 0 && (
            <button className="primary-button" onClick={openUploadForCurrent}>
              <Icon name="upload" />
              {uploadLabel}
            </button>
          )}
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
          <h2>{isInternalView ? "No component previews yet" : `No ${collectionMeta.label.toLowerCase()} yet`}</h2>
          <p>
            {isInternalView
              ? "Upload visual exports from Figma and connect them to documentation blocks. Component previews never appear in the public Asset Explorer."
              : collectionMeta.emptyMessage}
          </p>
          <div className="empty-panel-actions">
            <button className="primary-button" onClick={openUploadForCurrent}>
              <Icon name="upload" />
              {uploadLabel}
            </button>
          </div>
          <small className="muted-note">
            Allowed formats: {collectionMeta.allowedExtensions.join(", ")} · Max {formatSize(collectionMeta.maxSizeBytes)}
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
                    {a.visibility === "internal" ? " · internal" : ""} · {a.filePath?.split("/").pop()?.slice(0, 30) ?? "no file"}
                  </small>
                  <div className="asset-meta-row">
                    <em className={`status ${a.status}`}>{a.status}</em>
                    <span className="muted-note small">{a.mimeType?.split("/").pop() ?? "—"} · {formatSize(a.fileSize ?? 0)}</span>
                  </div>
                </button>
                <div className="asset-card-actions">
                  <button onClick={() => setSelected(a)} aria-label={`Edit ${a.name}`} title="Edit">
                    <Icon name="edit" />
                  </button>
                  <label className="replace-trigger">
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleReplaceFile(a, file);
                        e.currentTarget.value = "";
                      }}
                    />
                    <span title="Replace file">
                      <Icon name="upload" />
                    </span>
                  </label>
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
        <AssetEditor asset={selected} app={app} close={() => setSelected(null)} onDelete={(asset) => setConfirmSingleDelete(asset)} onReplace={handleReplaceFile} />
      )}

      <BulkUploadDialog
        open={bulkOpen}
        initialDestination={bulkDestination}
        existingSlugs={existingSlugs}
        onClose={() => setBulkOpen(false)}
        onComplete={(uploaded) => {
          if (uploaded && uploaded.length) {
            setLocalAssets((prev) => {
              const merged = [...prev];
              for (const up of uploaded) {
                if (!merged.some((x) => x.id === up.id) && !app.data.assets.some((x) => x.id === up.id)) {
                  merged.push(up);
                }
              }
              return merged;
            });
            pushToast("success", `${uploaded.map((u) => u.name).join(", ")} uploaded to ${collectionMeta.label} as ${uploaded[0]?.status ?? "draft"}.`);
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
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StudioHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="studio-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p className="muted-note">{description}</p>}
      </div>
    </header>
  );
}
