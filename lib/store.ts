"use client";

import { useCallback, useEffect, useState } from "react";
import { seedData } from "@/lib/seed-data";
import type { SiteData } from "@/types/content";

const KEY = "nusa-design-system-cms-v1";

export function useSiteData() {
  const [data, setDataState] = useState<SiteData>(seedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) window.setTimeout(() => setDataState(JSON.parse(saved)), 0);
    } catch { /* keep seed data */ }
    window.setTimeout(() => setReady(true), 0);
  }, []);

  const setData = useCallback((next: SiteData | ((current: SiteData) => SiteData)) => {
    setDataState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      window.localStorage.setItem(KEY, JSON.stringify(value));
      return value;
    });
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(KEY);
    setDataState(seedData);
  }, []);

  return { data, setData, reset, ready };
}
