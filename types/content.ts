export type PageType = "design" | "foundation" | "component" | "pattern" | "resource";
export type PageStatus = "draft" | "published" | "archived";
export type AssetType = "icon" | "icon-illustration" | "illustration" | "logo" | "brand-asset" | "template" | "download";
export type AssetBrand = "Shared" | "IM3" | "Indosat" | "Tri" | "Partner";

export type ContentPage = {
  id: string;
  type: PageType;
  title: string;
  slug: string;
  summary: string;
  category: string;
  status: PageStatus;
  maturity: "experimental" | "beta" | "stable" | "deprecated";
  version: string;
  owner: string;
  updatedAt: string;
  figmaUrl?: string;
  featured?: boolean;
  sections: ContentSection[];
};

export type VisualBlockKind = "component-preview" | "token-swatch" | "typography-specimen" | "spacing-specimen" | "icon-construction" | "state-comparison" | "anatomy-diagram" | "do-dont-comparison" | "flow-diagram" | "asset-preview";

export type VisualBlock = {
  id: string;
  kind: VisualBlockKind;
  label: string;
  componentSlug?: string;
  tokenNames?: string[];
  tokenPreview?: string;
  items?: { label: string; description: string; tone?: "do" | "dont" | "neutral" }[];
};

export type ContentSection = {
  id: string;
  kind: "overview" | "preview" | "anatomy" | "variants" | "sizes" | "states" | "behavior" | "content" | "responsive" | "accessibility" | "do-dont" | "tokens" | "related" | "figma" | "changelog" | "rich-text";
  title: string;
  body?: string;
  items?: { title: string; description: string; tone?: "do" | "dont" | "neutral" }[];
  visualBlocks?: VisualBlock[];
};

export type Asset = {
  id: string;
  type: AssetType;
  name: string;
  slug: string;
  category: string;
  brand: AssetBrand;
  status: PageStatus;
  description: string;
  keywords: string[];
  glyph: string;
  version: string;
  updatedAt: string;
  altText: string;
  filePath: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  originalFileName: string | null;
  createdAt: string;
};

export type Release = {
  id: string;
  version: string;
  title: string;
  summary: string;
  date: string;
  status: PageStatus;
  changes: string[];
};

export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  visibility: "public" | "unlisted";
};

export type SiteData = {
  settings: SiteSettings;
  pages: ContentPage[];
  assets: Asset[];
  releases: Release[];
};

export type AssetCategoryConfig = {
  slug: AssetType;
  label: string;
  singularLabel: string;
  description: string;
  emptyMessage: string;
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
  showBrandFilter: boolean;
  visual: boolean;
};

export type BulkUploadFileStatus =
  | "queued"
  | "validating"
  | "ready"
  | "uploading"
  | "success"
  | "failed"
  | "cancelled";

export type BulkUploadFile = {
  id: string;
  file: File;
  name: string;
  slug: string;
  category: string;
  brand: AssetBrand;
  description: string;
  keywords: string[];
  version: string;
  altText: string;
  status: BulkUploadFileStatus;
  progress: number;
  error: string | null;
  validationErrors: string[];
  result?: { asset: Asset };
};

export type Toast = {
  id: string;
  tone: "success" | "error" | "warning" | "info";
  message: string;
};
