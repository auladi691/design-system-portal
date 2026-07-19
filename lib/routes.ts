import type { ContentPage, PageType } from "@/types/content";

const collectionRoots: Record<PageType, string> = {
  design: "design",
  foundation: "foundations",
  component: "components",
  pattern: "patterns",
  resource: "resources",
};

export function routeForPage(page: Pick<ContentPage, "type" | "slug">): string {
  return `/${collectionRoots[page.type]}/${page.slug}`;
}

export function collectionRouteForType(type: PageType): string {
  return `/${collectionRoots[type]}`;
}

export function pageTypeForRoot(root: string): PageType | null {
  const entry = Object.entries(collectionRoots).find(([, value]) => value === root);
  return entry ? (entry[0] as PageType) : null;
}
