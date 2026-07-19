"use client";

import { useCallback, useEffect, useState } from "react";
import type { Toast } from "@/types/content";

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function pushToast(tone: Toast["tone"], message: string, durationMs = 4500) {
  const toast: Toast = { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, tone, message };
  toasts = [...toasts, toast];
  emit();
  if (durationMs > 0) {
    window.setTimeout(() => dismissToast(toast.id), durationMs);
  }
  return toast.id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function useToasts() {
  const [list, setList] = useState<Toast[]>(toasts);
  useEffect(() => {
    const listener: Listener = (next) => setList(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const dismiss = useCallback((id: string) => dismissToast(id), []);
  return { toasts: list, dismiss };
}
