"use client";

import { useEffect, useMemo, useState } from "react";
import { useSiteData } from "@/lib/store";
import { Portal } from "@/components/portal";
import { Studio } from "@/components/studio";

export function DesignSystemApp({ initialPath }: { initialPath: string }) {
  const store = useSiteData();
  const [path, setPath] = useState(initialPath || "/");

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const value = useMemo(() => ({ ...store, path, navigate }), [store, path]);
  return path.startsWith("/studio") ? <Studio app={value} /> : <Portal app={value} />;
}

export type AppContext = ReturnType<typeof useSiteData> & { path: string; navigate: (to: string) => void };
