import type { PortalCollection, PortalConfig, PortalLink } from "@/types/content";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

function isValidLink(link: unknown): link is PortalLink {
  if (!isObject(link)) return false;
  return (
    typeof link.label === "string" &&
    typeof link.destination === "string" &&
    typeof link.visible === "boolean" &&
    typeof link.order === "number"
  );
}

export function parsePortalConfig(value: string): PortalConfig | undefined {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return undefined;
    const config = parsed as Partial<PortalConfig>;
    if (!Array.isArray(config.navigation) || !config.footer || !config.home || !config.collections || !config.copy) return undefined;
    return parsed as PortalConfig;
  } catch {
    return undefined;
  }
}

export function formatPortalConfig(config?: PortalConfig): string {
  return config ? JSON.stringify(config, null, 2) : "";
}

export function validatePortalConfig(config: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isObject(config)) {
    return { ok: false, errors: ["Portal config must be an object"] };
  }
  const cfg = config as Record<string, unknown>;
  if (!Array.isArray(cfg.navigation)) errors.push("navigation must be an array");
  else {
    const nav = cfg.navigation;
    for (const link of nav) if (!isValidLink(link)) errors.push("Each navigation item must have label, destination, visible, order");
  }
  if (!isObject(cfg.footer)) errors.push("footer must be an object");
  if (!isObject(cfg.home)) errors.push("home must be an object");
  else {
    const home = cfg.home as Record<string, unknown>;
    if (!home.eyebrow || !home.title || !home.description) errors.push("home needs eyebrow, title, description");
    if (home.primaryCta && !isValidLink(home.primaryCta)) errors.push("home.primaryCta must be a valid link");
  }
  if (!isObject(cfg.collections)) errors.push("collections must be an object");
  if (!isObject(cfg.copy)) errors.push("copy must be an object (unavailable, noResults, loading, loadError)");
  if (!isObject(cfg.seo)) errors.push("seo must be an object (title, description)");
  return { ok: errors.length === 0, errors };
}

export function getDefaultPortalConfig(): PortalConfig {
  return {
    navigation: [
      { label: "Design", destination: "/design", visible: true, order: 0 },
      { label: "Foundations", destination: "/foundations", visible: true, order: 1 },
      { label: "Components", destination: "/components", visible: true, order: 2 },
      { label: "Patterns", destination: "/patterns", visible: true, order: 3 },
      { label: "Resources", destination: "/resources", visible: true, order: 4 },
    ],
    footer: {
      description: "One design language for clearer, more consistent experiences.",
      links: [
        { label: "Changelog", destination: "/changelog", visible: true, order: 0 },
        { label: "Asset Library", destination: "/resources/assets", visible: true, order: 1 },
        { label: "Administrator", destination: "/studio/login", visible: true, order: 2 },
      ],
    },
    seo: { title: "One Design", description: "One place to find foundations, components, patterns, and assets that help designers create consistent experiences." },
    home: {
      eyebrow: "Design System",
      title: "Design with clarity.",
      description: "One place to find foundations, components, patterns, and assets that help designers create consistent experiences.",
      heroAssetId: undefined,
      primaryCta: { label: "Explore foundations", destination: "/foundations", visible: true, order: 0 },
      secondaryCta: { label: "Browse components", destination: "/components", visible: true, order: 1 },
      statementEyebrow: "Built for designers.",
      statementTitle: "Find the right decisions.\nUse them with confidence.",
      storyEyebrow: "One source of truth",
      storyTitle: "From tokens to experiences.",
      storyDescription: "Every decision connects so designers can move faster without losing consistency.",
      storySteps: [
        { number: "01", title: "Foundations", description: "Visual decisions that form the baseline." },
        { number: "02", title: "Components", description: "Elements ready to use and combine." },
        { number: "03", title: "Patterns", description: "Ways to solve recurring needs." },
        { number: "04", title: "Assets", description: "Icons, illustrations, and resources in one place." },
      ],
    },
    collections: {},
    copy: {
      unavailable: "Coming soon",
      noResults: "No matching guidance",
      loading: "Loading the latest published guidance...",
      loadError: "We couldn't load the latest guidance",
    },
  };
}

export function mergePortalConfig(base: PortalConfig, patch: Partial<PortalConfig>): PortalConfig {
  return {
    navigation: patch.navigation ?? base.navigation,
    footer: patch.footer ?? base.footer,
    seo: patch.seo ?? base.seo,
    home: patch.home ?? base.home,
    collections: { ...base.collections, ...(patch.collections ?? {}) },
    copy: patch.copy ?? base.copy,
  };
}

export function getCollectionConfig(portal: PortalConfig | undefined, key: string): PortalCollection | undefined {
  return portal?.collections[key];
}
