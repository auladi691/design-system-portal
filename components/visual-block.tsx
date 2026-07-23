"use client";

import { Icon } from "@/components/icons";
import { resolvePublishedDocAsset, isValidFigmaUrl, isDownloadAvailable } from "@/lib/asset-resolver";
import { normalizeVisualBlockKind } from "@/types/content";
import type { Asset, GalleryItem, VisualBlock as VisualBlockType, TokenImport } from "@/types/content";
import type { ResolvedToken } from "@/lib/token-resolver";

type VisualBlockProps = {
  block: VisualBlockType;
  assets?: Asset[];
  resolvedTokens?: ResolvedToken[];
  activeTokenImport?: TokenImport | null;
};

export function VisualBlock({ block, assets = [], resolvedTokens = [], activeTokenImport }: VisualBlockProps) {
  const normalized = normalizeVisualBlockKind(block.kind);
  return (
    <div className="visual-block" data-visual-kind={normalized} role="figure" aria-label={block.label || normalized}>
      <VisualBlockContent block={block} normalized={normalized} assets={assets} resolvedTokens={resolvedTokens} activeTokenImport={activeTokenImport} />
      {block.label && <figcaption className="visual-block-label">{block.label}</figcaption>}
      {block.caption && <p className="visual-block-caption">{block.caption}</p>}
    </div>
  );
}

function VisualBlockContent({
  block,
  normalized,
  assets,
  resolvedTokens,
}: {
  block: VisualBlockType;
  normalized: string;
  assets: Asset[];
  resolvedTokens: ResolvedToken[];
  activeTokenImport?: TokenImport | null;
}) {
  switch (normalized) {
    case "design-preview":
      return <DesignPreview block={block} assets={assets} />;
    case "asset-gallery":
      return <AssetGallery block={block} assets={assets} />;
    case "variant-gallery":
      return <VariantGallery block={block} assets={assets} />;
    case "state-gallery":
      return <StateGallery block={block} assets={assets} />;
    case "token-reference":
      return <TokenReference block={block} resolvedTokens={resolvedTokens} />;
    case "interactive-preview":
      return <InteractivePreview block={block} />;
    case "anatomy":
      return <Anatomy block={block} assets={assets} />;
    case "do-dont":
      return <DoDont block={block} assets={assets} />;
    case "flow-diagram":
      return <FlowDiagram block={block} assets={assets} />;
    case "typography-specimen":
      return <TypographySpecimen block={block} assets={assets} />;
    case "spacing-specimen":
      return <SpacingSpecimen block={block} />;
    case "icon-construction":
      return <IconConstruction block={block} assets={assets} />;
    default:
      return <div className="visual-block-placeholder">Visual: {block.label || block.kind}</div>;
  }
}

function AssetVisual({ assetId, assets, alt }: { assetId?: string; assets: Asset[]; alt?: string }) {
  // Portal visual blocks must only render published assets.
  // Draft / archived previews stay hidden in public Portal. Studio uses same resolver
  // for realistic preview of what Portal will show; admin list already includes drafts.
  const asset = resolvePublishedDocAsset(assetId, assets);
  if (asset?.fileUrl && asset.mimeType?.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.fileUrl} alt={alt ?? asset.altText ?? asset.name} loading="lazy" className="visual-asset-image" />
    );
  }
  if (asset) {
    return (
      <div className="asset-unavailable small inline-visual-fallback" role="img" aria-label={asset.name}>
        <Icon name="file" />
        <span>{asset.name}</span>
        {!asset.fileUrl && <small>No file yet</small>}
      </div>
    );
  }
  return null;
}

function DesignPreview({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const asset = resolvePublishedDocAsset(block.assetId, assets);
  const hasRealVisual = Boolean(asset?.fileUrl && asset.mimeType?.startsWith("image/"));
  const hasFigma = isValidFigmaUrl(block.figmaUrl ?? asset?.figmaUrl);
  const hasDownload = block.downloadEnabled !== false && asset ? isDownloadAvailable(asset) : false;

  if (!block.assetId && !asset) {
    return (
      <div className="visual-unavailable" role="img" aria-label="No design preview selected">
        <Icon name="image" />
        <span>Design preview — select a visual from Asset Library</span>
      </div>
    );
  }

  return (
    <div className="visual-design-preview">
      <div className={`visual-preview-stage theme-${block.theme ?? asset?.theme ?? "both"}`} data-state={block.state} data-size={block.size} data-variant={block.variant}>
        {hasRealVisual ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset!.fileUrl!} alt={block.altText ?? asset!.altText ?? asset!.name} loading="lazy" className="visual-preview-img" />
        ) : asset ? (
          <div className="asset-unavailable inline-visual-fallback">
            <Icon name="file" />
            <span>{asset.name} — no preview file yet</span>
          </div>
        ) : (
          <AssetVisual assetId={block.assetId} assets={assets} alt={block.altText} />
        )}
      </div>
      <div className="visual-preview-meta">
        {block.variant && <span className="preview-meta-chip">{block.variant}</span>}
        {block.size && <span className="preview-meta-chip">{block.size}</span>}
        {block.state && <span className="preview-meta-chip">{block.state}</span>}
        {block.theme && block.theme !== "both" && <span className="preview-meta-chip">{block.theme}</span>}
      </div>
      {(block.caption || asset?.caption) && <p className="visual-preview-caption">{block.caption ?? asset?.caption}</p>}
      <div className="visual-preview-actions">
        {hasFigma && (
          <a href={(block.figmaUrl ?? asset?.figmaUrl)!} target="_blank" rel="noreferrer" className="secondary-button small">
            Open in Figma <Icon name="external" />
          </a>
        )}
        {hasDownload && asset?.fileUrl && (
          <a href={asset.fileUrl} download={asset.originalFileName ?? asset.name} target="_blank" rel="noreferrer" className="secondary-button small">
            Download <Icon name="arrow" />
          </a>
        )}
      </div>
    </div>
  );
}

function galleryItemsSorted(block: VisualBlockType): GalleryItem[] {
  const items = block.items ?? [];
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? ""));
}

function AssetGallery({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const items = galleryItemsSorted(block);
  if (!items.length) {
    return <div className="visual-unavailable" role="img" aria-label="Asset gallery empty"><Icon name="image" /><span>Asset gallery — add items in the editor</span></div>;
  }
  return (
    <div className="visual-asset-gallery">
      <div className="gallery-grid">
        {items.map((item) => {
          const asset = resolvePublishedDocAsset(item.assetId, assets);
          return (
            <div key={item.id} className="gallery-card">
              <div className="gallery-thumb">
                {asset?.fileUrl && asset.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.fileUrl} alt={item.altText ?? asset.altText ?? asset.name} loading="lazy" />
                ) : (
                  <div className="asset-unavailable small"><Icon name="image" /><span>No file</span></div>
                )}
              </div>
              <div className="gallery-info">
                <strong>{item.title ?? item.name ?? asset?.name ?? "Item"}</strong>
                {(item.description || item.caption) && <p>{item.description ?? item.caption}</p>}
                <div className="gallery-links">
                  {isValidFigmaUrl(item.figmaUrl ?? asset?.figmaUrl) && (
                    <a href={(item.figmaUrl ?? asset?.figmaUrl)!} target="_blank" rel="noreferrer">Open in Figma <Icon name="external" /></a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VariantGallery({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const items = galleryItemsSorted(block);
  if (!items.length) return <div className="visual-unavailable"><Icon name="image" /><span>Variant gallery — add variants in the editor</span></div>;
  return (
    <div className="visual-variant-gallery">
      <div className="variant-grid">
        {items.map((item) => {
          const asset = resolvePublishedDocAsset(item.assetId, assets);
          return (
            <div key={item.id} className="variant-card">
              <span className="variant-name">{item.name ?? item.title ?? "Variant"}</span>
              <div className="variant-thumb">
                {asset?.fileUrl && asset.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.fileUrl} alt={item.altText ?? asset.altText ?? asset.name} loading="lazy" />
                ) : <AssetVisual assetId={item.assetId} assets={assets} alt={item.altText} />}
              </div>
              {item.description && <p className="variant-desc">{item.description}</p>}
              {isValidFigmaUrl(item.figmaUrl ?? asset?.figmaUrl) && (
                <a href={(item.figmaUrl ?? asset?.figmaUrl)!} target="_blank" rel="noreferrer" className="text-button small"><Icon name="external" /> Open in Figma</a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StateGallery({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const items = galleryItemsSorted(block);
  if (!items.length) return <div className="visual-unavailable"><Icon name="image" /><span>State gallery — add states in the editor</span></div>;
  return (
    <div className="visual-state-gallery">
      <div className="state-gallery-grid">
        {items.map((item) => {
          const asset = resolvePublishedDocAsset(item.assetId, assets);
          return (
            <div key={item.id} className="state-gallery-card">
              <span className="state-gallery-name">{item.state ?? item.name ?? item.title ?? "State"}</span>
              <div className="state-gallery-thumb">
                {asset?.fileUrl && asset.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.fileUrl} alt={item.altText ?? asset.altText ?? asset.name} loading="lazy" />
                ) : <AssetVisual assetId={item.assetId} assets={assets} alt={item.altText} />}
              </div>
              {item.description && <p className="state-gallery-desc">{item.description}</p>}
              {isValidFigmaUrl(item.figmaUrl ?? asset?.figmaUrl) && (
                <a href={(item.figmaUrl ?? asset?.figmaUrl)!} target="_blank" rel="noreferrer" className="text-button small"><Icon name="external" /> Open in Figma</a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TokenReference({ block, resolvedTokens }: { block: VisualBlockType; resolvedTokens: ResolvedToken[] }) {
  const names = block.tokenNames ?? [];
  if (!names.length) {
    return <div className="visual-unavailable"><Icon name="layers" /><span>Token reference — select tokens from the library</span></div>;
  }
  const tokens = names.length ? resolvedTokens.filter((t) => names.includes(t.path)) : resolvedTokens;
  if (!tokens.length) {
    return (
      <div className="visual-token-reference">
        <p className="muted-note">Selected tokens are not available in the published token library yet. Publish a token version.</p>
        <ul className="token-name-list">
          {names.map((n) => <li key={n}><code>{n}</code></li>)}
        </ul>
      </div>
    );
  }
  return (
    <div className="visual-token-reference">
      <div className="token-table">
        {tokens.map((token) => (
          <div key={token.path} className="token-row">
            <i className="token-swatch-chip" style={chipStyle(token)} />
            <code className="token-path">{token.path}</code>
            {token.ref && <span className="token-ref">{token.ref}</span>}
            <b className="token-value">{formatTokenValue(token.resolvedValue)}</b>
            {token.description && <small className="token-desc">{token.description}</small>}
          </div>
        ))}
      </div>
    </div>
  );
}

function chipStyle(token: ResolvedToken): React.CSSProperties {
  const v = token.resolvedValue ?? token.value;
  if (typeof v === "string" && (/^#[0-9a-fA-F]{3,8}$/.test(v) || v.startsWith("rgb") || v.startsWith("hsl"))) {
    return { background: v as string };
  }
  return {};
}

function formatTokenValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function InteractivePreview({ block }: { block: VisualBlockType }) {
  const slug = block.componentSlug?.toLowerCase();
  const variant = block.variant;
  const size = block.size;
  const state = block.state;
  const disabled = Boolean(block.disabled);
  const loading = Boolean(block.loading);

  if (slug === "button") {
    return (
      <div className="visual-interactive-preview">
        <button
          className={`interactive-btn variant-${variant ?? "primary"} size-${size ?? "medium"} state-${state ?? "default"}`}
          disabled={disabled}
          aria-disabled={disabled}
          aria-busy={loading}
        >
          {loading && <span className="btn-spinner" aria-hidden="true" />}
          {block.iconName && <Icon name={block.iconName} />}
          <span>{block.label || "Button"}</span>
        </button>
        {(variant || size || state) && (
          <div className="interactive-meta">
            {variant && <span>{variant}</span>}
            {size && <span>{size}</span>}
            {state && <span>{state}</span>}
            {disabled && <span>disabled</span>}
            {loading && <span>loading</span>}
          </div>
        )}
      </div>
    );
  }
  if (slug === "input") {
    return (
      <div className="visual-interactive-preview">
        <div className="interactive-field">
          <small>{block.label || "Label"}</small>
          <span className="interactive-input" data-state={state}>{variant ?? "Value"}</span>
        </div>
      </div>
    );
  }
  if (slug === "card") {
    return (
      <div className="visual-interactive-preview">
        <div className="interactive-card">
          <strong>{block.label || "Card title"}</strong>
          <p>Card content preview</p>
        </div>
      </div>
    );
  }
  return (
    <div className="visual-interactive-preview">
      <div className="visual-unavailable">
        <Icon name="layers" />
        <span>{block.label || block.componentSlug || "Component"} — interactive preview</span>
        <small>
          {variant && `${variant} · `}{size && `${size} · `}{state && state}
          {disabled && " · disabled"}{loading && " · loading"}
        </small>
      </div>
    </div>
  );
}

function Anatomy({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  return (
    <div className="visual-anatomy">
      {block.assetId && <div className="anatomy-asset"><AssetVisual assetId={block.assetId} assets={assets} alt={block.altText} /></div>}
      <div className="anatomy-content">
        {block.items?.length ? block.items.map((item) => (
          <div key={item.id} className="anatomy-part">
            <span className="anatomy-marker" />
            <span className="anatomy-label">{item.name ?? item.title ?? "Part"}</span>
            <span className="anatomy-desc">{item.description}</span>
            {item.assetId && <span className="anatomy-asset-ref"><AssetVisual assetId={item.assetId} assets={assets} /></span>}
          </div>
        )) : <p className="muted-note">Add anatomy parts in the editor.</p>}
      </div>
    </div>
  );
}

function DoDont({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  return (
    <div className="visual-do-dont">
      <div className="do-dont-grid">
        {(block.items ?? []).map((item) => {
          const itemWithTone = item as GalleryItem & { tone?: "do" | "dont" | "neutral"; label?: string; description?: string };
          const rawTone = itemWithTone.tone;
          const tone = rawTone ?? (itemWithTone.title ? undefined : itemWithTone.description ? undefined : "neutral");
          const raw = itemWithTone;
          const isDo = raw.tone !== "dont" && !(raw.title?.toLowerCase().includes("don't") || raw.name?.toLowerCase().includes("don't"));
          const resolvedTone = raw.tone ?? (isDo ? "do" : "dont");
          const label = raw.title ?? raw.name ?? "";
          const desc = raw.description ?? "";
          return (
            <div key={item.id} className={`do-dont-card ${resolvedTone === "dont" ? "dont" : "do"}`}>
              {label && <span className="do-dont-icon">{resolvedTone === "dont" ? "✗" : "✓"}</span>}
              {label && <strong>{label}</strong>}
              {desc && <p>{desc}</p>}
              {item.assetId && <div className="do-dont-asset"><AssetVisual assetId={item.assetId} assets={assets} /></div>}
              {tone && <small className={`tone ${tone}`}>{tone}</small>}
            </div>
          );
        })}
        {(!block.items || !block.items.length) && (
          <p className="muted-note">Do and don&apos;t examples — add items in the editor.</p>
        )}
      </div>
    </div>
  );
}

function FlowDiagram({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const items = block.items ?? [];
  if (!items.length) return <div className="visual-unavailable"><Icon name="layers" /><span>Flow diagram — add steps in the editor</span></div>;
  return (
    <div className="visual-flow-diagram">
      <div className="flow-steps">
        {items.map((item, i) => (
          <div key={item.id} className="flow-step">
            <span className="flow-number">{i + 1}</span>
            <div className="flow-step-body">
              <strong>{item.title ?? item.name ?? `Step ${i + 1}`}</strong>
              {item.description && <p>{item.description}</p>}
              {item.assetId && <div className="flow-step-asset"><AssetVisual assetId={item.assetId} assets={assets} /></div>}
              {item.caption && <small>{item.caption}</small>}
            </div>
            {i < items.length - 1 && <span className="flow-arrow">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographySpecimen({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const hasGallery = block.items?.some((i) => i.assetId);
  if (hasGallery) {
    return (
      <div className="visual-typography-specimen">
        <div className="type-gallery">
          {(block.items ?? []).map((item) => (
            <div key={item.id} className="type-gallery-item">
              <span className="type-gallery-label">{item.title ?? item.name ?? "Specimen"}</span>
              {item.assetId ? <AssetVisual assetId={item.assetId} assets={assets} alt={item.altText} /> : item.description && <p>{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="visual-typography-specimen">
      <div className="type-specimen-row"><span className="type-label">Heading 1</span><span className="type-sample type-h1">Aa</span></div>
      <div className="type-specimen-row"><span className="type-label">Heading 2</span><span className="type-sample type-h2">Aa</span></div>
      <div className="type-specimen-row"><span className="type-label">Heading 3</span><span className="type-sample type-h3">Aa</span></div>
      <div className="type-specimen-row"><span className="type-label">Body</span><span className="type-sample type-body">The quick brown fox jumps over the lazy dog.</span></div>
      <div className="type-specimen-row"><span className="type-label">Small</span><span className="type-sample type-small">The quick brown fox jumps over the lazy dog.</span></div>
    </div>
  );
}

function SpacingSpecimen({ block }: { block: VisualBlockType }) {
  if (block.items?.length) {
    return (
      <div className="visual-spacing-specimen">
        {block.items.map((item) => (
          <div key={item.id} className="space-row">
            <span className="space-label">{item.title ?? item.name}</span>
            <div className="space-desc">{item.description ?? ""}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="visual-spacing-specimen">
      <div className="space-row"><span className="space-label">4xs</span><div className="space-bar" style={{ width: 4 }} /></div>
      <div className="space-row"><span className="space-label">xs</span><div className="space-bar" style={{ width: 8 }} /></div>
      <div className="space-row"><span className="space-label">sm</span><div className="space-bar" style={{ width: 12 }} /></div>
      <div className="space-row"><span className="space-label">md</span><div className="space-bar" style={{ width: 20 }} /></div>
      <div className="space-row"><span className="space-label">lg</span><div className="space-bar" style={{ width: 32 }} /></div>
      <div className="space-row"><span className="space-label">xl</span><div className="space-bar" style={{ width: 48 }} /></div>
    </div>
  );
}

function IconConstruction({ block, assets }: { block: VisualBlockType; assets: Asset[] }) {
  const items = block.items ?? [];
  if (!items.length) {
    return (
      <div className="visual-icon-construction">
        <div className="icon-grid-simple">
          {["search", "arrow", "close", "menu", "plus", "chevron"].map((name) => (
            <div key={name} className="icon-cell">
              <Icon name={name} />
              <span className="icon-label">{name}</span>
            </div>
          ))}
        </div>
        {block.assetId && <div className="icon-construction-main"><AssetVisual assetId={block.assetId} assets={assets} alt={block.altText} /></div>}
      </div>
    );
  }
  return (
    <div className="visual-icon-construction">
      <div className="icon-grid-with-assets">
        {items.map((item) => (
          <div key={item.id} className="icon-cell">
            {item.assetId ? <AssetVisual assetId={item.assetId} assets={assets} alt={item.altText} /> : <Icon name={item.name ?? "image"} />}
            <span className="icon-label">{item.title ?? item.name ?? "Icon"}</span>
            {item.description && <small>{item.description}</small>}
          </div>
        ))}
      </div>
      {block.assetId && <div className="icon-construction-main"><AssetVisual assetId={block.assetId} assets={assets} alt={block.altText} /></div>}
    </div>
  );
}
