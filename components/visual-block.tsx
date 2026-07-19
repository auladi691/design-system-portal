"use client";

import type { VisualBlock as VisualBlockType } from "@/types/content";
import { Icon } from "@/components/icons";

export function VisualBlock({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-block" data-visual-kind={block.kind} role="figure" aria-label={block.label}>
      <VisualBlockContent block={block} />
      {block.label && <figcaption className="visual-block-label">{block.label}</figcaption>}
    </div>
  );
}

function VisualBlockContent({ block }: { block: VisualBlockType }) {
  switch (block.kind) {
    case "component-preview":
      return <ComponentPreview block={block} />;
    case "token-swatch":
      return <TokenSwatch block={block} />;
    case "typography-specimen":
      return <TypographySpecimen />;
    case "spacing-specimen":
      return <SpacingSpecimen />;
    case "icon-construction":
      return <IconConstruction />;
    case "state-comparison":
      return <StateComparison block={block} />;
    case "anatomy-diagram":
      return <AnatomyDiagram block={block} />;
    case "do-dont-comparison":
      return <DoDontComparison block={block} />;
    case "flow-diagram":
      return <FlowDiagram block={block} />;
    case "asset-preview":
      return <AssetPreview block={block} />;
    default:
      return <div className="visual-block-placeholder">Visual reference: {block.label}</div>;
  }
}

function ComponentPreview({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-component-preview" role="img" aria-label={block.label}>
      {block.componentSlug === "button" ? <span className="demo-button">Continue</span>
        : block.componentSlug === "input" ? <div className="demo-input"><small>Email</small><span>name@example.com</span></div>
        : block.componentSlug === "card" ? <div className="demo-card"><strong>Card title</strong><p>Supporting content for the card preview.</p></div>
        : <span className="visual-preview-label">{block.componentSlug ?? block.label}</span>}
    </div>
  );
}

function TokenSwatch({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-token-swatch" role="img" aria-label={block.label}>
      <div className="swatch-grid">
        {block.tokenNames?.map((name) => (
          <div key={name} className="swatch-item">
            <div className="swatch-chip" data-token={name} />
            <span className="swatch-name">{name}</span>
          </div>
        ))}
        {(!block.tokenNames || block.tokenNames.length === 0) && (
          <>
            <div className="swatch-item">
              <div className="swatch-chip" style={{ background: "var(--color-page)" }} />
              <span className="swatch-name">Page surface</span>
            </div>
            <div className="swatch-item">
              <div className="swatch-chip" style={{ background: "var(--color-primary)" }} />
              <span className="swatch-name">Primary accent</span>
            </div>
            <div className="swatch-item">
              <div className="swatch-chip" style={{ background: "var(--color-elevated)" }} />
              <span className="swatch-name">Elevated surface</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TypographySpecimen() {
  return (
    <div className="visual-typography-specimen" role="img" aria-label="Typography scale specimen">
      <div className="type-specimen-row"><span className="type-label">Heading 1</span><span className="type-sample type-h1">Aa</span></div>
      <div className="type-specimen-row"><span className="type-label">Heading 2</span><span className="type-sample type-h2">Aa</span></div>
      <div className="type-specimen-row"><span className="type-label">Heading 3</span><span className="type-sample type-h3">Aa</span></div>
      <div className="type-specimen-row"><span className="type-label">Body</span><span className="type-sample type-body">The quick brown fox jumps over the lazy dog.</span></div>
      <div className="type-specimen-row"><span className="type-label">Small</span><span className="type-sample type-small">The quick brown fox jumps over the lazy dog.</span></div>
    </div>
  );
}

function SpacingSpecimen() {
  return (
    <div className="visual-spacing-specimen" role="img" aria-label="Spacing scale specimen">
      <div className="space-row"><span className="space-label">4xs</span><div className="space-bar" style={{ width: 4 }} /></div>
      <div className="space-row"><span className="space-label">xs</span><div className="space-bar" style={{ width: 8 }} /></div>
      <div className="space-row"><span className="space-label">sm</span><div className="space-bar" style={{ width: 12 }} /></div>
      <div className="space-row"><span className="space-label">md</span><div className="space-bar" style={{ width: 20 }} /></div>
      <div className="space-row"><span className="space-label">lg</span><div className="space-bar" style={{ width: 32 }} /></div>
      <div className="space-row"><span className="space-label">xl</span><div className="space-bar" style={{ width: 48 }} /></div>
    </div>
  );
}

function IconConstruction() {
  return (
    <div className="visual-icon-construction" role="img" aria-label="Icon construction grid">
      <div className="icon-grid">
        {["search", "arrow", "close", "menu", "plus", "chevron"].map((name) => (
          <div key={name} className="icon-cell">
            <Icon name={name} />
            <span className="icon-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateComparison({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-state-comparison" role="img" aria-label={block.label}>
      <div className="state-grid">
        {block.items?.map((item) => (
          <div key={item.label} className="state-cell">
            <div className="state-preview">
              <span className="demo-button" data-state={item.tone ?? "neutral"}>{item.label}</span>
            </div>
            <span className="state-name">{item.description}</span>
          </div>
        ))}
        {(!block.items || block.items.length === 0) && (
          <>
            <div className="state-cell"><div className="state-preview"><span className="demo-button">Default</span></div><span className="state-name">Default state</span></div>
            <div className="state-cell"><div className="state-preview"><span className="demo-button" data-state="focus">Focus</span></div><span className="state-name">Focused state</span></div>
            <div className="state-cell"><div className="state-preview"><span className="demo-button" data-state="disabled" aria-disabled="true">Disabled</span></div><span className="state-name">Disabled state</span></div>
          </>
        )}
      </div>
    </div>
  );
}

function AnatomyDiagram({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-anatomy-diagram" role="img" aria-label={block.label}>
      <div className="anatomy-content">
        {block.items?.map((item) => (
          <div key={item.label} className="anatomy-part">
            <span className="anatomy-marker" />
            <span className="anatomy-label">{item.label}</span>
            <span className="anatomy-desc">{item.description}</span>
          </div>
        ))}
        {(!block.items || block.items.length === 0) && (
          <p className="muted-note">Anatomy reference — add labeled parts in the editor.</p>
        )}
      </div>
    </div>
  );
}

function DoDontComparison({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-do-dont" role="img" aria-label={block.label}>
      <div className="do-dont-grid">
        {block.items?.map((item) => (
          <div key={item.label} className={`do-dont-card ${item.tone === "dont" ? "dont" : "do"}`}>
            <span className="do-dont-icon">{item.tone === "dont" ? "✗" : "✓"}</span>
            <strong>{item.label}</strong>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowDiagram({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-flow-diagram" role="img" aria-label={block.label}>
      <div className="flow-steps">
        {block.items?.map((item, i) => (
          <div key={item.label} className="flow-step">
            <span className="flow-number">{i + 1}</span>
            <strong>{item.label}</strong>
            <p>{item.description}</p>
            {i < (block.items?.length ?? 0) - 1 && <span className="flow-arrow">→</span>}
          </div>
        ))}
        {(!block.items || block.items.length === 0) && (
          <p className="muted-note">Flow diagram — add steps in the editor.</p>
        )}
      </div>
    </div>
  );
}

function AssetPreview({ block }: { block: VisualBlockType }) {
  return (
    <div className="visual-asset-preview" role="img" aria-label={block.label}>
      <div className="asset-preview-visual">
        <Icon name="image" />
      </div>
      <div className="asset-preview-info">
        {block.tokenNames?.map((name) => <span key={name} className="asset-tag">{name}</span>)}
        {(!block.tokenNames || block.tokenNames.length === 0) && (
          <span className="muted-note">Asset preview area — add labels in the editor.</span>
        )}
      </div>
    </div>
  );
}
