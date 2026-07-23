"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import { useDialogFocus } from "@/components/dialog-focus";
import { PAGE_TEMPLATES, type PageTemplateDefinition } from "@/lib/page-templates";
import type { PageTemplateId } from "@/types/content";

type TemplatePickerProps = {
  onSelect: (id: PageTemplateId) => void;
  onClose: () => void;
};

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="template-picker-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Choose a template">
        <header>
          <div>
            <span className="eyebrow">Documentation</span>
            <h2>Start from a template</h2>
            <p className="muted-note">Each template creates empty sections with guidance — no finished copy.</p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close template picker">
            <Icon name="close" />
          </button>
        </header>

        <div className="template-picker-grid" role="list">
          {PAGE_TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onSelect={() => onSelect(tpl.id)} />
          ))}
        </div>

        <footer className="template-picker-footer">
          <button className="text-button" onClick={onClose}>Cancel</button>
        </footer>
      </div>
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: PageTemplateDefinition; onSelect: () => void }) {
  return (
    <button className="template-card" onClick={onSelect} role="listitem" aria-label={`Use ${template.label}`}>
      <span className="template-card-type">{template.type}</span>
      <h3>{template.label}</h3>
      <p>{template.description}</p>
      <ul>
        {template.sectionTitles.slice(0, 5).map((s) => <li key={s.title}>{s.title}</li>)}
        {template.sectionTitles.length > 5 && <li className="more">+{template.sectionTitles.length - 5} more</li>}
      </ul>
      <span className="template-card-action">
        Use template <Icon name="arrow" />
      </span>
    </button>
  );
}
