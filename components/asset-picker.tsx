"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useDialogFocus } from "@/components/dialog-focus";
import { ASSET_CATEGORIES } from "@/lib/asset-categories";
import { formatFileSize } from "@/lib/asset-categories";
import { ASSET_PURPOSE_OPTIONS, type Asset, type AssetPurpose, type AssetType } from "@/types/content";

type AssetPickerProps = {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  onClose: () => void;
  selectedId?: string;
  title?: string;
  filterCategory?: AssetType[];
  allowClear?: boolean;
  onClear?: () => void;
};

type PurposeFilter = "all" | AssetPurpose;

export function AssetPicker({ assets, onSelect, onClose, selectedId, title = "Choose an asset", allowClear, onClear }: AssetPickerProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AssetType>("all");
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>("all");
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lower = query.toLowerCase();
  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      if (categoryFilter !== "all" && asset.type !== categoryFilter) return false;
      if (purposeFilter !== "all" && asset.purpose !== purposeFilter) return false;
      if (lower && !(`${asset.name} ${asset.category} ${asset.brand} ${asset.keywords.join(" ")} ${asset.purpose}`.toLowerCase().includes(lower))) return false;
      return true;
    });
  }, [assets, categoryFilter, purposeFilter, lower]);

  const draftAssets = assets.filter((a) => a.status === "draft").length;
  const publishedAssets = assets.filter((a) => a.status === "published").length;

  return (
    <div className="dialog-backdrop asset-picker-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="asset-picker-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <header className="asset-picker-header">
          <div>
            <span className="eyebrow">Asset Library</span>
            <h2>{title}</h2>
            <small className="muted-note">
              {assets.length} asset{assets.length === 1 ? "" : "s"} · {publishedAssets} published · {draftAssets} draft
            </small>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close asset picker">
            <Icon name="close" />
          </button>
        </header>

        <div className="asset-picker-filters">
          <label className="search-field">
            <Icon name="search" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets..." aria-label="Search assets" autoFocus />
          </label>

          <div className="asset-picker-filter-row">
            <div className="asset-picker-filter-group" role="group" aria-label="Filter by category">
              <span className="filter-group-label">Category</span>
              <div className="filter-chip-row">
                <button className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>All</button>
                {ASSET_CATEGORIES.map((cat) => (
                  <button key={cat.slug} className={categoryFilter === cat.slug ? "active" : ""} onClick={() => setCategoryFilter(cat.slug as AssetType)}>{cat.label}</button>
                ))}
              </div>
            </div>
            <div className="asset-picker-filter-group" role="group" aria-label="Filter by purpose">
              <span className="filter-group-label">Purpose</span>
              <div className="filter-chip-row">
                <button className={purposeFilter === "all" ? "active" : ""} onClick={() => setPurposeFilter("all")}>All</button>
                {ASSET_PURPOSE_OPTIONS.map((o) => (
                  <button key={o.value} className={purposeFilter === o.value ? "active" : ""} onClick={() => setPurposeFilter(o.value)} title={o.description}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="asset-picker-list" role="list">
          {filtered.length === 0 ? (
            <div className="asset-picker-empty">
              <Icon name="search" />
              <strong>No matching assets</strong>
              <p>Try a different search or clear the filters.</p>
            </div>
          ) : (
            filtered.map((asset) => {
              const isImage = asset.mimeType?.startsWith("image/") && Boolean(asset.fileUrl);
              return (
                <button
                  key={asset.id}
                  className={`asset-picker-card ${selectedId === asset.id ? "selected" : ""} status-${asset.status}`}
                  onClick={() => onSelect(asset)}
                  aria-label={`Select ${asset.name}`}
                  role="listitem"
                >
                  <div className="asset-picker-thumb">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.fileUrl!} alt={asset.altText || asset.name} loading="lazy" />
                    ) : (
                      <span className="asset-picker-glyph">{asset.glyph}</span>
                    )}
                  </div>
                  <div className="asset-picker-meta">
                    <strong>{asset.name}</strong>
                    <small>{asset.category} · {asset.type.replace("-", " ")} · {asset.purpose?.replace("-", " ") ?? "general"}</small>
                    <div className="asset-picker-badges">
                      <em className={`status ${asset.status}`}>{asset.status}</em>
                      {!asset.fileUrl && <em className="status draft">no file</em>}
                      <span className="asset-picker-size">{formatFileSize(asset.fileSize)}</span>
                      {asset.version && <span className="asset-picker-version">v{asset.version}</span>}
                    </div>
                    {asset.caption && <span className="asset-picker-caption">{asset.caption}</span>}
                  </div>
                  <Icon name="check" />
                </button>
              );
            })
          )}
        </div>

        <footer className="asset-picker-footer">
          {allowClear && onClear && (
            <button className="secondary-button" onClick={() => { onClear(); onClose(); }}>
              <Icon name="close" /> Remove asset
            </button>
          )}
          <button className="text-button" onClick={onClose}>Cancel</button>
        </footer>
      </div>
    </div>
  );
}

export function AssetPickerButton({
  assetId,
  assets,
  onOpen,
  label = "Select asset",
}: {
  assetId?: string;
  assets: Asset[];
  onOpen: () => void;
  label?: string;
}) {
  const selected = assets.find((a) => a.id === assetId);
  return (
    <button className="asset-picker-button" onClick={onOpen} type="button">
      {selected ? (
        <>
          <span className="asset-picker-button-thumb">
            {selected.fileUrl && selected.mimeType?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.fileUrl} alt={selected.altText || selected.name} />
            ) : (
              <span>{selected.glyph}</span>
            )}
          </span>
          <span className="asset-picker-button-label">
            <strong>{selected.name}</strong>
            <small>{selected.status} · {selected.type.replace("-", " ")}</small>
          </span>
          <Icon name="chevron" />
        </>
      ) : (
        <>
          <span className="asset-picker-button-empty">
            <Icon name="image" />
            {label}
          </span>
        </>
      )}
    </button>
  );
}
