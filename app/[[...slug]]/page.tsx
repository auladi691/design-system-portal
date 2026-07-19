import { DesignSystemApp } from "@/components/design-system-app";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  return <DesignSystemApp initialPath={`/${slug.join("/")}`} />;
}
