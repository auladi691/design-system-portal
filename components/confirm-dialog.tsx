"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  onCancel,
  onConfirm,
  busy = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTarget = tone === "danger" ? cancelRef.current : confirmRef.current;
    focusTarget?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onCancel();
      }
      if (e.key === "Tab") {
        trapFocus(e, [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, busy, onCancel, tone]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={() => !busy && onCancel()} role="presentation">
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="confirm-icon" aria-hidden="true">
          <Icon name={tone === "danger" ? "trash" : "warning"} />
        </span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-desc">{description}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="secondary-button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button ref={confirmRef} className={tone === "danger" ? "danger-button" : "primary-button"} onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function trapFocus(e: KeyboardEvent, elements: HTMLElement[]) {
  if (!elements.length) return;
  const active = document.activeElement as HTMLElement;
  const first = elements[0];
  const last = elements[elements.length - 1];
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}
