"use client";

import { resolveAsset, isDownloadAvailable, isValidFigmaUrl } from "@/lib/asset-resolver";
import { Icon } from "@/components/icons";
import type { Asset } from "@/types/content";

type AssetImageProps = {
  assetId?: string;
  assets: Asset[];
  alt?: string;
  className?: string;
  imgClassName?: string;
  requirePublished?: boolean;
  fallbackMessage?: string;
  showCaption?: boolean;
  showActions?: boolean;
};

export function AssetImage({
  assetId,
  assets,
  alt,
  className,
  imgClassName,
  requirePublished,
  fallbackMessage = "Visual not available yet",
  showCaption,
  showActions,
}: AssetImageProps) {
  const asset = resolveAsset(assetId, assets, { requirePublished });
  if (!asset?.fileUrl || !asset.mimeType?.startsWith("image/")) {
    if (!asset) {
      return (
        <div className={`asset-unavailable ${className ?? ""}`} role="img" aria-label={fallbackMessage}>
          <Icon name="image" />
          <span>{fallbackMessage}</span>
        </div>
      );
    }
    // Asset exists but fileUrl missing or not image — neutral fallback, not fake art
    return (
      <div className={`asset-unavailable ${className ?? ""}`} role="img" aria-label={`${asset.name}: ${fallbackMessage}`}>
        <Icon name="image" />
        <span>{asset.name}: {fallbackMessage}</span>
      </div>
    );
  }

  return (
    <figure className={`asset-image ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={imgClassName}
        src={asset.fileUrl!}
        alt={alt ?? asset.altText ?? asset.name}
        loading="lazy"
      />
      {showCaption && asset.caption && (
        <figcaption className="asset-image-caption">{asset.caption}</figcaption>
      )}
      {showActions && (
        <div className="asset-image-actions">
          {isValidFigmaUrl(asset.figmaUrl) && (
            <a href={asset.figmaUrl!} target="_blank" rel="noreferrer" className="secondary-button small">
              Open in Figma<Icon name="external" />
            </a>
          )}
          {isDownloadAvailable(asset) && asset.fileUrl && (
            <a href={asset.fileUrl} download={asset.originalFileName ?? asset.name} target="_blank" rel="noreferrer" className="secondary-button small">
              Download<Icon name="arrow" />
            </a>
          )}
        </div>
      )}
    </figure>
  );
}

export function PortalAssetImage(props: AssetImageProps) {
  return <AssetImage {...props} requirePublished fallbackMessage="Visual not available yet" />;
}

export type GalleryImageProps = {
  assetId?: string;
  assets: Asset[];
  alt?: string;
  caption?: string;
  figmaUrl?: string;
  index?: number;
};

export function GalleryImage({ assetId, assets, alt, caption, figmaUrl, index }: GalleryImageProps) {
  const asset = resolveAsset(assetId, assets, { requirePublished: true });
  const itemHasFigma = isValidFigmaUrl(figmaUrl ?? asset?.figmaUrl);
  return (
    <div className="gallery-image-card">
      {asset?.fileUrl && asset.mimeType?.startsWith("image/") ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.fileUrl!} alt={alt ?? asset.altText ?? asset.name} loading="lazy" />
          {(caption || asset.caption) && <figcaption>{caption ?? asset.caption}</figcaption>}
          <div className="gallery-image-links">
            {itemHasFigma && (
              <a href={(figmaUrl ?? asset.figmaUrl)!} target="_blank" rel="noreferrer" className="text-button">
                <Icon name="external" /> Open in Figma
              </a>
            )}
            {isDownloadAvailable(asset) && asset.fileUrl && (
              <a href={asset.fileUrl} download={asset.originalFileName ?? asset.name} target="_blank" rel="noreferrer" className="text-button">
                <Icon name="arrow" /> Download
              </a>
            )}
          </div>
        </figure>
      ) : (
        <div className="asset-unavailable small" role="img" aria-label={`Item ${index ?? ""}: Visual not available yet`}>
          <Icon name="image" />
          <span>Item {index ?? ""}: no file</span>
        </div>
      )}
    </div>
  );
}
