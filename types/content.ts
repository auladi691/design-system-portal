export type PageType = "design" | "foundation" | "component" | "pattern" | "resource";
export type PageStatus = "draft" | "published" | "archived";
export type AssetType = "icon" | "icon-illustration" | "illustration" | "logo" | "brand-asset" | "template" | "download";
export type AssetBrand = "Shared" | "IM3" | "Indosat" | "Tri" | "Partner";
export type AssetPurpose =
  | "component-preview"
  | "anatomy"
  | "variant"
  | "state"
  | "pattern-flow"
  | "foundation-visual"
  | "cover-visual"
  | "general-asset";

export type AssetVisibility = "public" | "internal";

export const INTERNAL_PURPOSES: AssetPurpose[] = ["component-preview"];

export function isInternalPurpose(purpose: AssetPurpose): boolean {
  return INTERNAL_PURPOSES.includes(purpose);
}

export function assetVisibilityForPurpose(purpose: AssetPurpose): AssetVisibility {
  return isInternalPurpose(purpose) ? "internal" : "public";
}

export const PUBLIC_PURPOSE_OPTIONS: { value: AssetPurpose; label: string; description: string }[] = [
  { value: "anatomy", label: "Anatomy", description: "Labeled parts diagram of a component" },
  { value: "variant", label: "Variant", description: "A visual example of a component variant" },
  { value: "state", label: "State", description: "A visual example of a component state" },
  { value: "pattern-flow", label: "Pattern flow", description: "Flow diagram for a pattern or user journey" },
  { value: "foundation-visual", label: "Foundation visual", description: "Visual reference for a foundation (colour, spacing, typography, etc.)" },
  { value: "cover-visual", label: "Cover visual", description: "Cover or thumbnail image for a documentation page" },
  { value: "general-asset", label: "General asset", description: "General purpose asset not tied to a specific documentation role" },
];

export const ASSET_PURPOSE_OPTIONS: { value: AssetPurpose; label: string; description: string; internal?: boolean }[] = [
  { value: "component-preview", label: "Component preview", description: "Internal CMS visual used only inside documentation blocks — not listed in public Asset Explorer", internal: true },
  ...PUBLIC_PURPOSE_OPTIONS,
];

export type AssetTheme = "light" | "dark" | "both";

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
  coverAssetId?: string;
  sections: ContentSection[];
};

export type VisualBlockKind =
  // new (preferred) kinds
  | "design-preview"
  | "asset-gallery"
  | "variant-gallery"
  | "state-gallery"
  | "token-reference"
  | "interactive-preview"
  | "anatomy"
  | "do-dont"
  | "flow-diagram"
  | "typography-specimen"
  | "spacing-specimen"
  | "icon-construction"
  // legacy aliases (keep for backward-compat with existing DB content)
  | "component-preview"
  | "token-swatch"
  | "state-comparison"
  | "anatomy-diagram"
  | "do-dont-comparison"
  | "asset-preview";

export type VisualBlockDesignLabel =
  | "Design preview"
  | "Asset gallery"
  | "Variant gallery"
  | "State gallery"
  | "Token reference"
  | "Interactive preview"
  | "Anatomy"
  | "Do and don't"
  | "Flow diagram"
  | "Typography specimen"
  | "Spacing specimen"
  | "Icon construction";

export const VISUAL_BLOCK_KIND_LABELS: Record<VisualBlockKind, VisualBlockDesignLabel> = {
  "design-preview": "Design preview",
  "asset-gallery": "Asset gallery",
  "variant-gallery": "Variant gallery",
  "state-gallery": "State gallery",
  "token-reference": "Token reference",
  "interactive-preview": "Interactive preview",
  "anatomy": "Anatomy",
  "do-dont": "Do and don't",
  "flow-diagram": "Flow diagram",
  "typography-specimen": "Typography specimen",
  "spacing-specimen": "Spacing specimen",
  "icon-construction": "Icon construction",
  // legacy mapping
  "component-preview": "Design preview",
  "token-swatch": "Token reference",
  "state-comparison": "State gallery",
  "anatomy-diagram": "Anatomy",
  "do-dont-comparison": "Do and don't",
  "asset-preview": "Asset gallery",
};

export const VISUAL_BLOCK_KINDS_NEW: VisualBlockKind[] = [
  "design-preview",
  "asset-gallery",
  "variant-gallery",
  "state-gallery",
  "token-reference",
  "interactive-preview",
  "anatomy",
  "do-dont",
  "flow-diagram",
  "typography-specimen",
  "spacing-specimen",
  "icon-construction",
];

export function normalizeVisualBlockKind(kind: string): VisualBlockKind {
  const alias: Record<string, VisualBlockKind> = {
    "component-preview": "design-preview",
    "token-swatch": "token-reference",
    "state-comparison": "state-gallery",
    "anatomy-diagram": "anatomy",
    "do-dont-comparison": "do-dont",
    "asset-preview": "asset-gallery",
  };
  return (alias[kind] as VisualBlockKind) || (kind as VisualBlockKind) || "design-preview";
}

export type GalleryItem = {
  id: string;
  assetId?: string;
  name?: string;
  title?: string;
  description?: string;
  order?: number;
  caption?: string;
  figmaUrl?: string;
  altText?: string;
  variant?: string;
  state?: string;
};

export type VisualBlock = {
  id: string;
  kind: VisualBlockKind;
  label: string;
  caption?: string;
  altText?: string;

  // single asset reference (design-preview, cover, anatomy etc)
  assetId?: string;

  // free-form descriptive fields used by various kinds
  variant?: string;
  size?: string;
  state?: string;
  theme?: AssetTheme;
  figmaUrl?: string;
  downloadEnabled?: boolean;

  // multi-item blocks (gallery kinds, anatomy parts, do/dont etc)
  items?: GalleryItem[];

  // token-reference
  tokenNames?: string[];
  tokenPreview?: string;

  // interactive-preview
  componentSlug?: string;
  disabled?: boolean;
  loading?: boolean;
  iconName?: string;
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
  purpose: AssetPurpose;
  visibility: AssetVisibility;
  status: PageStatus;
  description: string;
  keywords: string[];
  glyph: string;
  version: string;
  updatedAt: string;
  altText: string;
  caption: string;
  theme: AssetTheme;
  figmaUrl?: string;
  downloadAvailable: boolean;
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

export type TokenGroupSummary = {
  name: string;
  count: number;
};

export type TokenLibrarySummary = {
  fileName: string;
  total: number;
  references: number;
  uniqueReferences: number;
  withDescription: number;
  groups: TokenGroupSummary[];
};

export type TokenImport = {
  id: string;
  fileName: string;
  sourceJson: unknown;
  summary: TokenLibrarySummary;
  status: PageStatus;
  createdAt: string;
  publishedAt: string | null;
  validationErrors: string[];
  validationBrokenAliases: string[];
};

export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  visibility: "public" | "unlisted";
  seo?: {
    title: string;
    description: string;
  };
  portal?: PortalConfig;
};

export type PortalLink = {
  label: string;
  destination: string;
  visible: boolean;
  order: number;
};

export type PortalCard = {
  id: string;
  label: string;
  title: string;
  summary: string;
  destination: string;
  visible: boolean;
  order: number;
  icon?: string;
  availability?: "available" | "coming-soon";
  assetId?: string;
};

export type PortalCollection = {
  eyebrow: string;
  title: string;
  summary: string;
  emptyTitle: string;
  emptyDescription: string;
  heroAssetId?: string;
  cards: PortalCard[];
};

export type PortalConfig = {
  navigation: PortalLink[];
  footer: {
    description: string;
    links: PortalLink[];
  };
  seo: {
    title: string;
    description: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    heroAssetId?: string;
    primaryCta: PortalLink;
    secondaryCta?: PortalLink;
    statementEyebrow: string;
    statementTitle: string;
    storyEyebrow: string;
    storyTitle: string;
    storyDescription: string;
    storySteps: { number: string; title: string; description: string }[];
  };
  collections: Record<string, PortalCollection>;
  copy: {
    unavailable: string;
    noResults: string;
    loading: string;
    loadError: string;
  };
};

export type SiteData = {
  settings: SiteSettings;
  pages: ContentPage[];
  assets: Asset[];
  releases: Release[];
  tokenImports: TokenImport[];
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

export type PageTemplateId = "foundation" | "component" | "pattern" | "resource";
