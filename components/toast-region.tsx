"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import { dismissToast, useToasts } from "@/lib/toast";

export function ToastRegion() {
  const { toasts, dismiss } = useToasts();
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toasts.length) return;
    const first = regionRef.current?.querySelector<HTMLElement>("[data-toast]");
    first?.focus();
  }, [toasts]);

  if (!toasts.length) return null;
  return (
    <div className="toast-region" ref={regionRef} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} data-toast tabIndex={-1} className={`toast toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          <Icon name={toast.tone === "success" ? "check" : toast.tone === "error" ? "warning" : "info"} />
          <span>{toast.message}</span>
          <button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><Icon name="close" /></button>
        </div>
      ))}
    </div>
  );
}

export { dismissToast };
