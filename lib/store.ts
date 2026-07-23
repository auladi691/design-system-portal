"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminSite, fetchPublishedSite, subscribeToAssets } from "@/lib/repository";
import { emptySiteData } from "@/lib/empty-site-data";
import type { Asset, ContentPage, Release, SiteData, SiteSettings, TokenImport } from "@/types/content";

export type StoreState = {
  data: SiteData;
  ready: boolean;
  loading: boolean;
  error: string | null;
  isPreview: boolean;
  reload: () => Promise<void>;
  setSettings: (settings: SiteSettings) => Promise<{ ok: boolean; error: string | null }>;
  upsertPage: (page: ContentPage) => Promise<{ ok: boolean; error: string | null }>;
  upsertAsset: (asset: Asset) => Promise<{ ok: boolean; error: string | null }>;
  upsertRelease: (release: Release) => Promise<{ ok: boolean; error: string | null }>;
  upsertTokenImport: (tokenImport: TokenImport) => Promise<{ ok: boolean; error: string | null }>;
  removeAsset: (assetId: string) => Promise<{ ok: boolean; error: string | null }>;
  removeTokenImport: (importId: string) => Promise<{ ok: boolean; error: string | null }>;
};

export type InitialSiteData = Pick<StoreState, "data" | "error" | "isPreview">;

export function useSiteData(options: { admin?: boolean; enabled?: boolean; initialData?: InitialSiteData } = {}): StoreState {
  const admin = options.admin ?? false;
  const enabled = options.enabled ?? true;
  const initialData = options.initialData;
  const readyRef = useRef(Boolean(initialData));
  const [data, setData] = useState<SiteData>(() => initialData?.data ?? emptySiteData);
  const [readyState, setReady] = useState(Boolean(initialData));
  const [loadingState, setLoading] = useState(enabled && !initialData);
  const [error, setError] = useState<string | null>(initialData?.error ?? null);
  const [isPreview, setIsPreview] = useState(initialData?.isPreview ?? false);
  const skipNext = useRef(false);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const currentRequest = ++requestId.current;
    setLoading(!readyRef.current);
    setError(null);
    const result = admin ? await fetchAdminSite() : await fetchPublishedSite();
    if (currentRequest !== requestId.current) return;
    setData(result.data);
    setIsPreview(result.isPreview);
    setError(result.error);
    setReady(true);
    readyRef.current = true;
    setLoading(false);
  }, [admin, enabled]);

  useEffect(() => {
    if (!enabled) {
      requestId.current += 1;
      return;
    }
    let cancelled = false;
    void (async () => {
      await reload();
      if (cancelled) return;
    })();
    const unsubscribe = subscribeToAssets(() => {
      if (skipNext.current) {
        skipNext.current = false;
        return;
      }
      void reload();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, reload]);

  const setSettings = useCallback(async (settings: SiteSettings) => {
    skipNext.current = true;
    setData((current) => ({ ...current, settings }));
    const { saveSettings } = await import("@/lib/repository");
    const result = await saveSettings(settings);
    await reload();
    return result;
  }, [reload]);

  const upsertPage = useCallback(async (page: ContentPage) => {
    skipNext.current = true;
    setData((current) => ({
      ...current,
      pages: current.pages.some((p) => p.id === page.id)
        ? current.pages.map((p) => (p.id === page.id ? page : p))
        : [...current.pages, page],
    }));
    const { savePage } = await import("@/lib/repository");
    const result = await savePage(page);
    await reload();
    return result;
  }, [reload]);

  const upsertAsset = useCallback(async (asset: Asset) => {
    skipNext.current = true;
    setData((current) => ({
      ...current,
      assets: current.assets.some((a) => a.id === asset.id)
        ? current.assets.map((a) => (a.id === asset.id ? asset : a))
        : [...current.assets, asset],
    }));
    const { saveAsset } = await import("@/lib/repository");
    const result = await saveAsset(asset);
    await reload();
    return result;
  }, [reload]);

  const upsertRelease = useCallback(async (release: Release) => {
    skipNext.current = true;
    setData((current) => ({
      ...current,
      releases: current.releases.some((r) => r.id === release.id)
        ? current.releases.map((r) => (r.id === release.id ? release : r))
        : [...current.releases, release],
    }));
    const { saveRelease } = await import("@/lib/repository");
    const result = await saveRelease(release);
    await reload();
    return result;
  }, [reload]);

  const upsertTokenImport = useCallback(async (tokenImport: TokenImport) => {
    skipNext.current = true;
    setData((current) => ({
      ...current,
      tokenImports: current.tokenImports.some((t) => t.id === tokenImport.id)
        ? current.tokenImports.map((t) => (t.id === tokenImport.id ? tokenImport : t))
        : [...current.tokenImports, tokenImport],
    }));
    const { saveTokenImport } = await import("@/lib/repository");
    const result = await saveTokenImport(tokenImport);
    await reload();
    return result;
  }, [reload]);

  const removeAsset = useCallback(async (assetId: string) => {
    skipNext.current = true;
    setData((current) => ({
      ...current,
      assets: current.assets.filter((a) => a.id !== assetId),
    }));
    const { deleteAssetRecord } = await import("@/lib/repository");
    const result = await deleteAssetRecord(assetId);
    await reload();
    return result;
  }, [reload]);

  const removeTokenImport = useCallback(async (importId: string) => {
    skipNext.current = true;
    setData((current) => ({
      ...current,
      tokenImports: current.tokenImports.filter((t) => t.id !== importId),
    }));
    const { deleteTokenImportRecord } = await import("@/lib/repository");
    const result = await deleteTokenImportRecord(importId);
    await reload();
    return result;
  }, [reload]);

  return {
    data,
    ready: enabled && readyState,
    loading: enabled && (loadingState || !readyState),
    error,
    isPreview,
    reload,
    setSettings,
    upsertPage,
    upsertAsset,
    upsertRelease,
    upsertTokenImport,
    removeAsset,
    removeTokenImport,
  };
}
