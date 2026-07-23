import type { SiteData } from "@/types/content";

export const emptySiteData: SiteData = {
  settings: { name: "", tagline: "", description: "", visibility: "unlisted", seo: { title: "", description: "" } },
  pages: [],
  assets: [],
  releases: [],
  tokenImports: [],
};
