"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminSite, fetchPublishedSite, subscribeToAssets } from "@/lib/repository";
import { seedData } from "@/lib/seed-data";
import { getSupabase } from "@/lib/supabase-client";
import type { Asset, ContentPage, Release, SiteData, SiteSettings } from "@/types/content";

export type StoreState = {
  data: SiteData;
  ready: boolean;
  isPreview: boolean;
  reload: () => Promise<void>;
  setSettings: (settings: SiteSettings) => Promise<{ ok: boolean; error: string | null }>;
  upsertPage: (page: ContentPage) => Promise<{ ok: boolean; error: string | null }>;
  upsertAsset: (asset: Asset) => Promise<{ ok: boolean; error: string | null }>;
  upsertRelease: (release: Release) => Promise<{ ok: boolean; error: string | null }>;
  removeAsset: (assetId: string) => Promise<{ ok: boolean; error: string | null }>;
};

export function useSiteData(options: { admin?: boolean } = {}): StoreState {
  const admin = options.admin ?? false;
  const [data, setData] = useState<SiteData>(seedData);
  const [ready, setReady] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const skipNext = useRef(false);

  const reload = useCallback(async () => {
    const result = admin ? await fetchAdminSite() : await fetchPublishedSite();
    if (result) {
      setData(result);
      setIsPreview(!getSupabase());
    }
    setReady(true);
  }, [admin]);

  useEffect(() => {
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
  }, [reload]);

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

  return {
    data,
    ready,
    isPreview,
    reload,
    setSettings,
    upsertPage,
    upsertAsset,
    upsertRelease,
    removeAsset,
  };
}
