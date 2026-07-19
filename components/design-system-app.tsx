"use client";

import { useEffect, useMemo, useState } from "react";
import { useSiteData } from "@/lib/store";
import { Portal } from "@/components/portal";
import { Studio } from "@/components/studio";
import { ToastRegion } from "@/components/toast-region";

export function DesignSystemApp({ initialPath }: { initialPath: string }) {
  const store = useSiteData({ admin: true });
  const [path, setPath] = useState(initialPath || "/");

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, "", to);
    setPath(to);
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  const value = useMemo(() => ({ ...store, path, navigate }), [store, path]);
  return (
    <>
      {path.startsWith("/studio") ? <Studio app={value} /> : <Portal app={value} />}
      <ToastRegion />
    </>
  );
}

export type AppContext = ReturnType<typeof useSiteData> & { path: string; navigate: (to: string) => void };
