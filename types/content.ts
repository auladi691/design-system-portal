export type PageType = "design" | "foundation" | "component" | "pattern" | "resource";
export type PageStatus = "draft" | "published" | "archived";
export type AssetType = "icon" | "icon-illustration" | "illustration" | "logo" | "brand-asset" | "template" | "download";

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

export type ContentSection = {
  id: string;
  kind: "overview" | "preview" | "anatomy" | "variants" | "sizes" | "states" | "behavior" | "content" | "responsive" | "accessibility" | "do-dont" | "tokens" | "related" | "figma" | "changelog" | "rich-text";
  title: string;
  body?: string;
  items?: { title: string; description: string; tone?: "do" | "dont" | "neutral" }[];
};

export type Asset = {
  id: string;
  type: AssetType;
  name: string;
  slug: string;
  category: string;
  brand: "Shared" | "IM3" | "Indosat" | "Tri" | "Partner";
  status: PageStatus;
  description: string;
  keywords: string[];
  glyph: string;
  version: string;
  updatedAt: string;
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

export type SiteData = {
  settings: {
    name: string;
    tagline: string;
    description: string;
    visibility: "public" | "unlisted";
  };
  pages: ContentPage[];
  assets: Asset[];
  releases: Release[];
};
