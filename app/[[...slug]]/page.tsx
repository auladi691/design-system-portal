import { DesignSystemApp } from "@/components/design-system-app";
import { ASSET_CATEGORY_MAP } from "@/lib/asset-categories";
import { fetchPublishedSite } from "@/lib/repository";
import type { SiteFetchResult } from "@/lib/repository";
import { pageTypeForRoot } from "@/lib/routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  let publishedSite: SiteFetchResult | undefined;
  if (slug[0] && slug[0] !== "studio") {
    const root = slug[0];
    const isAssetRoute = root === "resources" && slug[1] === "assets";
    const pageType = pageTypeForRoot(root);
    const isKnownCollection = Boolean(pageType) || root === "changelog" || root === "search" || root === "resources";
    const isKnownAssetCategory = !slug[2] || Boolean(ASSET_CATEGORY_MAP[slug[2] as keyof typeof ASSET_CATEGORY_MAP]);

    if (isAssetRoute) {
      if (slug.length > 3 || !isKnownAssetCategory) notFound();
    } else if ((root === "changelog" || root === "search") && slug.length !== 1) {
      notFound();
    } else if (!isKnownCollection || slug.length > 2) {
      notFound();
    } else if (slug.length === 2 && pageType) {
      publishedSite = await fetchPublishedSite();
      if (!publishedSite.error && !publishedSite.data.pages.some((page) => page.type === pageType && page.slug === slug[1])) notFound();
    }
  }
  if (slug[0] !== "studio" && !publishedSite) publishedSite = await fetchPublishedSite();
  return <DesignSystemApp initialPath={`/${slug.join("/")}`} initialData={publishedSite} />;
}
