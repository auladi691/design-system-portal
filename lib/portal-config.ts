import type { PortalConfig } from "@/types/content";

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
