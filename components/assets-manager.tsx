"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { AssetEditor } from "@/components/asset-editor";
import { BulkUploadDialog } from "@/components/bulk-upload-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ASSET_CATEGORIES, categoryLabel } from "@/lib/asset-categories";
import { deleteStoragePath, deleteStoragePaths } from "@/lib/asset-storage";
import { friendlyErrorMessage } from "@/lib/repository";
import { pushToast } from "@/lib/toast";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { AppContext } from "@/components/design-system-app";
import type { Asset, AssetType } from "@/types/content";

type AssetsManagerProps = { app: AppContext };

const CATEGORY_TABS: { slug: "all" | AssetType; label: string }[] = [
  { slug: "all", label: "All" },
  ...ASSET_CATEGORIES.map((c) => ({ slug: c.slug, label: c.label })),
];

export function AssetsManager({ app }: AssetsManagerProps) {
  const [type, setType] = useState<"all" | AssetType>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<AssetType>("icon");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [confirmSingleDelete, setConfirmSingleDelete] = useState<Asset | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const lower = query.toLowerCase();
  const list = useMemo(
    () => app.data.assets.filter((a) => (type === "all" || a.type === type) && `${a.name} ${a.category} ${a.brand} ${a.keywords.join(" ")}`.toLowerCase().includes(lower)),
    [app.data.assets, type, lower],
  );

  const existingSlugs = useMemo(() => app.data.assets.map((a) => a.slug), [app.data.assets]);

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

  const openBulk = (cat: AssetType) => {
    setBulkCategory(cat);
    setBulkOpen(true);
  };

  const createBlank = async (cat: AssetType) => {
    const id = crypto.randomUUID();
    const name = `New ${categoryLabel(cat).slice(0, -1)}`;
    const slug = uniqueSlug(slugify(name), existingSlugs);
    const asset: Asset = {
      id,
      type: cat,
      name,
      slug,
      category: "General",
      brand: "Shared",
      status: "draft",
      description: "",
      keywords: [],
      glyph: name.slice(0, 1).toUpperCase(),
      version: "1.0",
      updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      altText: "",
      filePath: null,
      fileUrl: null,
      mimeType: null,
      fileSize: null,
      originalFileName: null,
      createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    try {
      await app.upsertAsset(asset);
      setSelected(asset);
      pushToast("info", "Draft asset created. Upload a file and add details before publishing.");
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    }
  };

  const deleteAsset = async (asset: Asset) => {
    setBusy(true);
    try {
      if (asset.filePath) await deleteStoragePath(asset.filePath);
      await app.removeAsset(asset.id);
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
    let ok = 0, fail = 0;
    try {
      for (const id of selection) {
        const target = app.data.assets.find((a) => a.id === id);
        if (!target) continue;
        try {
          await app.upsertAsset({ ...target, status: "published", updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
          ok += 1;
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
    let ok = 0, fail = 0;
    try {
      for (const id of selection) {
        const target = app.data.assets.find((a) => a.id === id);
        if (!target) continue;
        try {
          await app.upsertAsset({ ...target, status: "archived", updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
          ok += 1;
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
    const paths = targets.map((t) => t.filePath).filter(Boolean) as string[];
    let ok = 0;
    const failed: string[] = [];
    try {
      const storageResult = await deleteStoragePaths(paths);
      for (const target of targets) {
        const result = await app.removeAsset(target.id);
        void result;
        ok += 1;
      }
      if (storageResult.failed.length) {
        pushToast("warning", `${ok} asset${ok === 1 ? "" : "s"} removed. ${storageResult.failed.length} file${storageResult.failed.length === 1 ? "" : "s"} could not be deleted from storage.`);
      } else {
        pushToast("success", `${ok} asset${ok === 1 ? "" : "s"} deleted.`);
      }
      if (failed.length) pushToast("warning", `${failed.length} asset${failed.length === 1 ? "" : "s"} could not be deleted. Try again.`);
      clearSelection();
      setConfirmBulkDelete(false);
    } catch (error) {
      pushToast("error", friendlyErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-page">
      <StudioHeader
        eyebrow="Assets"
        title="Asset Library"
        action={
          <button className="primary-button" onClick={() => openBulk(type === "all" ? "icon" : type)}>
            <Icon name="upload" />Bulk upload
          </button>
        }
      />

      <div className="asset-manager-tabs" role="tablist" aria-label="Asset categories">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.slug}
            role="tab"
            aria-selected={type === tab.slug}
            className={type === tab.slug ? "active" : ""}
            onClick={() => setType(tab.slug)}
          >
            {tab.label}
            <span className="tab-count">{tab.slug === "all" ? app.data.assets.length : app.data.assets.filter((a) => a.type === tab.slug).length}</span>
          </button>
        ))}
      </div>

      <div className="manager-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets..." aria-label="Search assets" />
        </label>
        <div className="manager-toolbar-actions">
          <button className="secondary-button" onClick={() => createBlank(type === "all" ? "icon" : type)} disabled={busy}>
            <Icon name="plus" />New draft
          </button>
        </div>
      </div>

      {selection.size > 0 && (
        <div className="bulk-toolbar" role="region" aria-label="Bulk actions">
          <strong>{selection.size} selected</strong>
          <div className="bulk-toolbar-actions">
            <button className="secondary-button" onClick={bulkPublish} disabled={busy}>Publish</button>
            <button className="secondary-button" onClick={bulkArchive} disabled={busy}>Archive</button>
            <button className="danger-button" onClick={() => setConfirmBulkDelete(true)} disabled={busy}><Icon name="trash" />Delete</button>
            <button className="text-button" onClick={clearSelection} disabled={busy}>Clear</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-panel">
          <Icon name="image" />
          <h2>No assets yet</h2>
          <p>{type === "all" ? "Upload icons, illustrations, logos, and other resources." : `Upload ${categoryLabel(type).toLowerCase()} to get started.`}</p>
          <button className="primary-button" onClick={() => openBulk(type === "all" ? "icon" : type)}><Icon name="upload" />Bulk upload</button>
        </div>
      ) : (
        <>
          <div className="asset-manager-bulk-head">
            <button className="text-button" onClick={selectAll} disabled={busy}>Select all ({list.length})</button>
            {selection.size > 0 && <button className="text-button" onClick={clearSelection} disabled={busy}>Clear selection</button>}
          </div>
          <div className="asset-manager-grid">
            {list.map((a) => (
              <article key={a.id} className={`asset-manager-card status-${a.status} ${selection.has(a.id) ? "selected" : ""}`}>
                <label className="asset-select">
                  <input type="checkbox" checked={selection.has(a.id)} onChange={() => toggleSelection(a.id)} aria-label={`Select ${a.name}`} />
                </label>
                <button className="asset-manager-card-body" onClick={() => setSelected(a)} aria-label={`Edit ${a.name}`}>
                  <div className="asset-glyph" aria-hidden="true">
                    {a.fileUrl && a.mimeType && a.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.fileUrl} alt={a.altText || a.name} loading="lazy" />
                    ) : <span>{a.glyph}</span>}
                  </div>
                  <strong>{a.name}</strong>
                  <small>{a.category} · {a.brand}</small>
                  <em className={`status ${a.status}`}>{a.status}</em>
                </button>
                <div className="asset-card-actions">
                  <button onClick={() => setSelected(a)} aria-label={`Edit ${a.name}`} title="Edit"><Icon name="edit" /></button>
                  <button onClick={() => setConfirmSingleDelete(a)} aria-label={`Delete ${a.name}`} title="Delete"><Icon name="trash" /></button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {selected && (
        <AssetEditor
          asset={selected}
          app={app}
          close={() => setSelected(null)}
          onDelete={(asset) => setConfirmSingleDelete(asset)}
        />
      )}

      <BulkUploadDialog
        open={bulkOpen}
        initialCategory={bulkCategory}
        existingSlugs={existingSlugs}
        onClose={() => setBulkOpen(false)}
        onComplete={() => void app.reload()}
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

function StudioHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="studio-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
