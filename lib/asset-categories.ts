import type { AssetCategoryConfig, AssetType } from "@/types/content";

const MB = 1024 * 1024;

const SVG_EXT = ["svg"] as const;
const SVG_MIME = ["image/svg+xml"] as const;

export const ASSET_CATEGORIES: AssetCategoryConfig[] = [
  {
    slug: "icon",
    label: "Icons",
    singularLabel: "Icon",
    description: "Outline icons for actions and navigation.",
    emptyMessage: "No icons have been added yet.",
    allowedExtensions: SVG_EXT,
    allowedMimeTypes: SVG_MIME,
    maxSizeBytes: 1 * MB,
    showBrandFilter: false,
    visual: false,
  },
  {
    slug: "icon-illustration",
    label: "Icon illustrations",
    singularLabel: "Icon illustration",
    description: "Expressive small visuals with brand metadata.",
    emptyMessage: "No icon illustrations have been added yet.",
    allowedExtensions: ["svg", "png", "webp"] as const,
    allowedMimeTypes: ["image/svg+xml", "image/png", "image/webp"] as const,
    maxSizeBytes: 3 * MB,
    showBrandFilter: true,
    visual: true,
  },
  {
    slug: "illustration",
    label: "Illustrations",
    singularLabel: "Illustration",
    description: "Larger storytelling scenes for empty states and moments.",
    emptyMessage: "No illustrations have been added yet.",
    allowedExtensions: ["svg", "png", "jpg", "jpeg", "webp"] as const,
    allowedMimeTypes: ["image/svg+xml", "image/png", "image/jpeg", "image/webp"] as const,
    maxSizeBytes: 8 * MB,
    showBrandFilter: false,
    visual: true,
  },
  {
    slug: "logo",
    label: "Logos",
    singularLabel: "Logo",
    description: "Approved brand marks for product surfaces.",
    emptyMessage: "No logos have been added yet.",
    allowedExtensions: ["svg", "png"] as const,
    allowedMimeTypes: ["image/svg+xml", "image/png"] as const,
    maxSizeBytes: 3 * MB,
    showBrandFilter: false,
    visual: true,
  },
  {
    slug: "brand-asset",
    label: "Brand assets",
    singularLabel: "Brand asset",
    description: "Backgrounds, textures, and approved brand files.",
    emptyMessage: "No brand assets have been added yet.",
    allowedExtensions: ["svg", "png", "jpg", "jpeg", "webp", "pdf", "zip"] as const,
    allowedMimeTypes: [
      "image/svg+xml",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ] as const,
    maxSizeBytes: 25 * MB,
    showBrandFilter: true,
    visual: true,
  },
  {
    slug: "template",
    label: "Templates",
    singularLabel: "Template",
    description: "Starting points for consistent design work.",
    emptyMessage: "No templates have been added yet.",
    allowedExtensions: ["pdf", "zip", "fig", "sketch"] as const,
    allowedMimeTypes: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ] as const,
    maxSizeBytes: 50 * MB,
    showBrandFilter: false,
    visual: false,
  },
  {
    slug: "download",
    label: "Downloads",
    singularLabel: "Download",
    description: "Approved files ready for designers to download.",
    emptyMessage: "No downloads have been added yet.",
    allowedExtensions: ["pdf", "zip", "svg", "png", "json"] as const,
    allowedMimeTypes: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "image/svg+xml",
      "image/png",
      "application/json",
      "application/octet-stream",
    ] as const,
    maxSizeBytes: 50 * MB,
    showBrandFilter: false,
    visual: false,
  },
];

export const ASSET_CATEGORY_MAP: Record<AssetType, AssetCategoryConfig> = ASSET_CATEGORIES.reduce(
  (acc, config) => {
    acc[config.slug] = config;
    return acc;
  },
  {} as Record<AssetType, AssetCategoryConfig>,
);

export function getCategoryConfig(slug: string): AssetCategoryConfig | undefined {
  return ASSET_CATEGORY_MAP[slug as AssetType];
}

export function categoryLabel(slug: string): string {
  return getCategoryConfig(slug)?.label ?? slug;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
