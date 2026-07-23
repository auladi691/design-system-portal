"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { AssetPicker, AssetPickerButton } from "@/components/asset-picker";
import { validatePortalConfig } from "@/lib/portal-config";
import type { Asset, PortalCard, PortalCollection, PortalConfig, PortalLink } from "@/types/content";

type Tab = "navigation" | "homepage" | "collections" | "resources" | "footer" | "copy" | "seo" | "json";

export function PortalConfigEditor({
  config,
  assets,
  onChange,
}: {
  config: PortalConfig;
  assets: Asset[];
  onChange: (next: PortalConfig) => void;
}) {
  const [tab, setTab] = useState<Tab>("navigation");
  const [jsonText, setJsonText] = useState(() => JSON.stringify(config, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [assetPickerFor, setAssetPickerFor] = useState<{ kind: "home-hero" | "collection-hero" | "card"; key?: string; cardId?: string } | null>(null);

  const validation = validatePortalConfig(config);

  const syncJson = (next: PortalConfig) => {
    onChange(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as PortalConfig;
      const v = validatePortalConfig(parsed);
      if (!v.ok) { setJsonError(v.errors[0]); return; }
      setJsonError(null);
      onChange(parsed);
    } catch {
      setJsonError("The JSON is not valid. Check commas, brackets, and quotes.");
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    if (!assetPickerFor) return;
    if (assetPickerFor.kind === "home-hero") {
      syncJson({ ...config, home: { ...config.home, heroAssetId: asset.id } });
    } else if (assetPickerFor.kind === "collection-hero" && assetPickerFor.key) {
      const existing = config.collections[assetPickerFor.key];
      if (!existing) return;
      syncJson({
        ...config,
        collections: {
          ...config.collections,
          [assetPickerFor.key]: { ...existing, heroAssetId: asset.id },
        },
      });
    } else if (assetPickerFor.kind === "card" && assetPickerFor.key) {
      const col = config.collections[assetPickerFor.key];
      if (!col) return;
      const cards = col.cards.map((c) => (c.id === assetPickerFor.cardId ? { ...c, assetId: asset.id } : c));
      syncJson({ ...config, collections: { ...config.collections, [assetPickerFor.key]: { ...col, cards } } });
    }
    setAssetPickerFor(null);
  };

  const clearAsset = () => {
    if (!assetPickerFor) return;
    if (assetPickerFor.kind === "home-hero") syncJson({ ...config, home: { ...config.home, heroAssetId: undefined } });
    if (assetPickerFor.kind === "collection-hero" && assetPickerFor.key) {
      const existing = config.collections[assetPickerFor.key];
      if (!existing) return;
      syncJson({
        ...config,
        collections: { ...config.collections, [assetPickerFor.key]: { ...existing, heroAssetId: undefined } },
      });
    }
    if (assetPickerFor.kind === "card" && assetPickerFor.key) {
      const col = config.collections[assetPickerFor.key];
      if (!col) return;
      const cards = col.cards.map((c) => (c.id === assetPickerFor.cardId ? { ...c, assetId: undefined } : c));
      syncJson({ ...config, collections: { ...config.collections, [assetPickerFor.key]: { ...col, cards } } });
    }
    setAssetPickerFor(null);
  };

  return (
    <div className="portal-config-editor">
      {!validation.ok && (
        <p className="form-error" role="alert">
          {validation.errors[0]}
        </p>
      )}

      <div className="portal-config-tabs" role="tablist" aria-label="Portal config sections">
        {([
          ["navigation", "Navigation"],
          ["homepage", "Homepage"],
          ["collections", "Collections"],
          ["resources", "Resources"],
          ["footer", "Footer"],
          ["copy", "Messages"],
          ["seo", "SEO"],
          ["json", "JSON details"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "navigation" && (
        <NavTab config={config} onChange={syncJson} />
      )}
      {tab === "homepage" && (
        <HomeTab config={config} assets={assets} onChange={syncJson} onPickAsset={(kind, extra) => setAssetPickerFor(typeof extra === "string" ? { kind, key: extra } as never : { kind })} />
      )}
      {tab === "collections" && (
        <CollectionsTab config={config} assets={assets} onChange={syncJson} onPickAsset={(kind, key, cardId) => setAssetPickerFor({ kind, key, cardId } as never)} />
      )}
      {tab === "resources" && (
        <ResourcesTab config={config} onChange={syncJson} />
      )}
      {tab === "footer" && (
        <FooterTab config={config} onChange={syncJson} />
      )}
      {tab === "copy" && (
        <CopyTab config={config} onChange={syncJson} />
      )}
      {tab === "seo" && (
        <SeoTab config={config} onChange={syncJson} />
      )}
      {tab === "json" && (
        <div className="portal-config-json-tab">
          <p className="muted-note">Administrator view — the form above is the primary workflow.</p>
          <textarea rows={22} value={jsonText} onChange={(e) => setJsonText(e.target.value)} aria-label="Portal config JSON" className="portal-config-json-area" />
          {jsonError && <p className="form-error" role="alert">{jsonError}</p>}
          <button className="primary-button" onClick={applyJson}><Icon name="check" /> Apply JSON</button>
        </div>
      )}

      {assetPickerFor && (
        <AssetPicker
          assets={assets}
          onSelect={handleSelectAsset}
          onClose={() => setAssetPickerFor(null)}
          allowClear
          onClear={clearAsset}
          title={assetPickerFor.kind === "home-hero" ? "Choose hero artwork" : assetPickerFor.kind === "collection-hero" ? "Choose collection hero" : "Choose card visual"}
        />
      )}
    </div>
  );
}

function NavTab({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  const update = (idx: number, patch: Partial<PortalLink>) => {
    const nav = config.navigation.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onChange({ ...config, navigation: nav });
  };
  const move = (idx: number, dir: -1 | 1) => {
    const nav = [...config.navigation];
    const dest = idx + dir;
    if (dest < 0 || dest >= nav.length) return;
    const [item] = nav.splice(idx, 1);
    nav.splice(dest, 0, item);
    onChange({ ...config, navigation: nav.map((n, i) => ({ ...n, order: i })) });
  };
  const add = () => {
    const link: PortalLink = { label: "New page", destination: "/", visible: true, order: config.navigation.length };
    onChange({ ...config, navigation: [...config.navigation, link] });
  };
  const remove = (idx: number) => onChange({ ...config, navigation: config.navigation.filter((_, i) => i !== idx) });
  return (
    <div className="portal-config-section">
      <h3>Navigation links</h3>
      {config.navigation.map((link, i) => (
        <div key={i} className="link-row">
          <input value={link.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" />
          <input value={link.destination} onChange={(e) => update(i, { destination: e.target.value })} placeholder="/path" />
          <label className="inline-check"><input type="checkbox" checked={link.visible} onChange={(e) => update(i, { visible: e.target.checked })} /> Visible</label>
          <button className="text-button small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="arrow" /></button>
          <button className="text-button small" onClick={() => move(i, 1)} disabled={i === config.navigation.length - 1} aria-label="Move down"><Icon name="arrow" /></button>
          <button className="danger-button small" onClick={() => remove(i)}><Icon name="trash" /></button>
        </div>
      ))}
      <button className="secondary-button" onClick={add}><Icon name="plus" /> Add link</button>
    </div>
  );
}

function HomeTab({
  config,
  assets,
  onChange,
  onPickAsset,
}: {
  config: PortalConfig;
  assets: Asset[];
  onChange: (c: PortalConfig) => void;
  onPickAsset: (kind: "home-hero", extra?: string) => void;
}) {
  const set = (patch: Partial<PortalConfig["home"]>) => onChange({ ...config, home: { ...config.home, ...patch } });
  return (
    <div className="portal-config-section">
      <h3>Hero</h3>
      <div className="form-grid-2">
        <label>Eyebrow <input value={config.home.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></label>
        <label>Title <input value={config.home.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="span-2">Description <textarea rows={3} value={config.home.description} onChange={(e) => set({ description: e.target.value })} /></label>
      </div>
      <div className="asset-pick-inline">
        <span>Hero artwork</span>
        <AssetPickerButton assetId={config.home.heroAssetId} assets={assets} onOpen={() => onPickAsset("home-hero")} label="Select hero visual" />
      </div>

      <h3>Primary call to action</h3>
      <CtaEditor link={config.home.primaryCta} onChange={(l) => set({ primaryCta: l })} />
      {config.home.secondaryCta && (
        <>
          <h3>Secondary call to action</h3>
          <CtaEditor link={config.home.secondaryCta} onChange={(l) => set({ secondaryCta: l })} />
          <button className="text-button" onClick={() => set({ secondaryCta: undefined })}>Remove secondary call to action</button>
        </>
      )}
      {!config.home.secondaryCta && <button className="secondary-button" onClick={() => set({ secondaryCta: { label: "Browse components", destination: "/components", visible: true, order: 1 } })}><Icon name="plus" />Add secondary call to action</button>}

      <h3>Statement section</h3>
      <div className="form-grid-2">
        <label>Eyebrow <input value={config.home.statementEyebrow} onChange={(e) => set({ statementEyebrow: e.target.value })} /></label>
        <label>Title <textarea rows={2} value={config.home.statementTitle} onChange={(e) => set({ statementTitle: e.target.value })} /></label>
      </div>

      <h3>Story section</h3>
      <div className="form-grid-2">
        <label>Eyebrow <input value={config.home.storyEyebrow} onChange={(e) => set({ storyEyebrow: e.target.value })} /></label>
        <label>Title <input value={config.home.storyTitle} onChange={(e) => set({ storyTitle: e.target.value })} /></label>
        <label className="span-2">Description <textarea rows={3} value={config.home.storyDescription} onChange={(e) => set({ storyDescription: e.target.value })} /></label>
      </div>
      <div className="story-step-list">
        {config.home.storySteps.map((step, i) => (
          <div key={i} className="story-step-row">
            <input value={step.number} onChange={(e) => { const s = [...config.home.storySteps]; s[i] = { ...s[i], number: e.target.value }; set({ storySteps: s }); }} placeholder="01" aria-label="Step number" />
            <input value={step.title} onChange={(e) => { const s = [...config.home.storySteps]; s[i] = { ...s[i], title: e.target.value }; set({ storySteps: s }); }} placeholder="Title" />
            <input value={step.description} onChange={(e) => { const s = [...config.home.storySteps]; s[i] = { ...s[i], description: e.target.value }; set({ storySteps: s }); }} placeholder="Description" />
            <button className="danger-button small" onClick={() => set({ storySteps: config.home.storySteps.filter((_, j) => j !== i) })}><Icon name="trash" /></button>
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={() => set({ storySteps: [...config.home.storySteps, { number: String(config.home.storySteps.length + 1).padStart(2, "0"), title: "New step", description: "Describe this step." }] })}><Icon name="plus" />Add step</button>
    </div>
  );
}

function CtaEditor({ link, onChange }: { link: PortalLink; onChange: (l: PortalLink) => void }) {
  return (
    <div className="link-row">
      <input value={link.label} onChange={(e) => onChange({ ...link, label: e.target.value })} placeholder="Label" />
      <input value={link.destination} onChange={(e) => onChange({ ...link, destination: e.target.value })} placeholder="/path" />
      <label className="inline-check"><input type="checkbox" checked={link.visible} onChange={(e) => onChange({ ...link, visible: e.target.checked })} /> Visible</label>
    </div>
  );
}

function CollectionsTab({
  config,
  assets,
  onChange,
  onPickAsset,
}: {
  config: PortalConfig;
  assets: Asset[];
  onChange: (c: PortalConfig) => void;
  onPickAsset: (kind: "collection-hero" | "card", key: string, cardId?: string) => void;
}) {
  const keys = Object.keys(config.collections);
  if (!keys.length) return <div className="empty-panel"><Icon name="file" /><p>Collections are created automatically when pages are published or by editing the portal config JSON.</p></div>;
  return (
    <div className="portal-config-section">
      {keys.map((key) => {
        const col: PortalCollection = config.collections[key];
        return (
          <details key={key} open className="collection-config">
            <summary><strong>{col.eyebrow}</strong> — {col.title}</summary>
            <div className="form-grid-2">
              <label>Eyebrow <input value={col.eyebrow} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, eyebrow: e.target.value } } })} /></label>
              <label>Title <input value={col.title} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, title: e.target.value } } })} /></label>
              <label className="span-2">Summary <textarea rows={2} value={col.summary} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, summary: e.target.value } } })} /></label>
              <label>Empty title <input value={col.emptyTitle} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, emptyTitle: e.target.value } } })} /></label>
              <label>Empty description <textarea rows={2} value={col.emptyDescription} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, emptyDescription: e.target.value } } })} /></label>
            </div>
            <div className="asset-pick-inline">
              <span>Hero visual</span>
              <AssetPickerButton assetId={col.heroAssetId} assets={assets} onOpen={() => onPickAsset("collection-hero", key)} label="Select hero visual" />
            </div>
            <h4>Cards</h4>
            {col.cards.map((card) => (
              <div key={card.id} className="collection-card-row">
                <input value={card.title} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, cards: col.cards.map((c) => c.id === card.id ? { ...c, title: e.target.value } : c) } } })} placeholder="Title" />
                <input value={card.destination} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, cards: col.cards.map((c) => c.id === card.id ? { ...c, destination: e.target.value } : c) } } })} placeholder="/destination" />
                <AssetPickerButton assetId={card.assetId} assets={assets} onOpen={() => onPickAsset("card", key, card.id)} label="Select visual" />
                <label className="inline-check"><input type="checkbox" checked={card.visible} onChange={(e) => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, cards: col.cards.map((c) => c.id === card.id ? { ...c, visible: e.target.checked } : c) } } })} /> Visible</label>
              </div>
            ))}
            <button className="secondary-button" onClick={() => onChange({ ...config, collections: { ...config.collections, [key]: { ...col, cards: [...col.cards, { id: crypto.randomUUID(), label: "New card", title: "New card", summary: "Describe this card", destination: "/", visible: true, order: col.cards.length }] } } })}><Icon name="plus" />Add card</button>
          </details>
        );
      })}
    </div>
  );
}

function ResourcesTab({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  const resources = config.collections.resources;
  if (!resources) return <div className="empty-panel"><p>No resources collection yet. It will appear after first publish or JSON setup.</p></div>;
  const update = (idx: number, patch: Partial<PortalCard>) => {
    const cards = resources.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ ...config, collections: { ...config.collections, resources: { ...resources, cards } } });
  };
  const add = () => {
    const card: PortalCard = { id: crypto.randomUUID(), label: "New resource", title: "New resource", summary: "Describe this resource", destination: "/resources", visible: true, order: resources.cards.length };
    onChange({ ...config, collections: { ...config.collections, resources: { ...resources, cards: [...resources.cards, card] } } });
  };
  const remove = (idx: number) => onChange({ ...config, collections: { ...config.collections, resources: { ...resources, cards: resources.cards.filter((_, i) => i !== idx) } } });
  return (
    <div className="portal-config-section">
      <h3>Resource cards</h3>
      {resources.cards.map((card, i) => (
        <div key={card.id} className="collection-card-row">
          <input value={card.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title" />
          <input value={card.destination} onChange={(e) => update(i, { destination: e.target.value })} placeholder="/destination" />
          <input value={card.summary} onChange={(e) => update(i, { summary: e.target.value })} placeholder="Summary" />
          <label className="inline-check"><input type="checkbox" checked={card.visible} onChange={(e) => update(i, { visible: e.target.checked })} /> Visible</label>
          <button className="danger-button small" onClick={() => remove(i)}><Icon name="trash" /></button>
        </div>
      ))}
      <button className="secondary-button" onClick={add}><Icon name="plus" />Add resource card</button>
    </div>
  );
}

function FooterTab({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  return (
    <div className="portal-config-section">
      <h3>Footer</h3>
      <label>Description <textarea rows={3} value={config.footer.description} onChange={(e) => onChange({ ...config, footer: { ...config.footer, description: e.target.value } })} /></label>
      <h4>Links</h4>
      {config.footer.links.map((link, i) => (
        <div key={i} className="link-row">
          <input value={link.label} onChange={(e) => { const links = config.footer.links.map((l, j) => j === i ? { ...l, label: e.target.value } : l); onChange({ ...config, footer: { ...config.footer, links } }); }} placeholder="Label" />
          <input value={link.destination} onChange={(e) => { const links = config.footer.links.map((l, j) => j === i ? { ...l, destination: e.target.value } : l); onChange({ ...config, footer: { ...config.footer, links } }); }} placeholder="/path" />
          <label className="inline-check"><input type="checkbox" checked={link.visible} onChange={(e) => { const links = config.footer.links.map((l, j) => j === i ? { ...l, visible: e.target.checked } : l); onChange({ ...config, footer: { ...config.footer, links } }); }} /> Visible</label>
          <button className="danger-button small" onClick={() => onChange({ ...config, footer: { ...config.footer, links: config.footer.links.filter((_, j) => j !== i) } })}><Icon name="trash" /></button>
        </div>
      ))}
      <button className="secondary-button" onClick={() => onChange({ ...config, footer: { ...config.footer, links: [...config.footer.links, { label: "New link", destination: "/", visible: true, order: config.footer.links.length }] } })}><Icon name="plus" />Add footer link</button>
    </div>
  );
}

function CopyTab({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  const set = (patch: Partial<PortalConfig["copy"]>) => onChange({ ...config, copy: { ...config.copy, ...patch } });
  return (
    <div className="portal-config-section">
      <h3>Public messages</h3>
      <div className="form-grid-2">
        <label>Unavailable label <input value={config.copy.unavailable} onChange={(e) => set({ unavailable: e.target.value })} /></label>
        <label>No results <input value={config.copy.noResults} onChange={(e) => set({ noResults: e.target.value })} /></label>
        <label>Loading message <input value={config.copy.loading} onChange={(e) => set({ loading: e.target.value })} /></label>
        <label>Load error <input value={config.copy.loadError} onChange={(e) => set({ loadError: e.target.value })} /></label>
      </div>
    </div>
  );
}

function SeoTab({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  return (
    <div className="portal-config-section">
      <h3>SEO</h3>
      <div className="form-grid-2">
        <label>Title <input value={config.seo.title} onChange={(e) => onChange({ ...config, seo: { ...config.seo, title: e.target.value } })} /></label>
        <label className="span-2">Description <textarea rows={3} value={config.seo.description} onChange={(e) => onChange({ ...config, seo: { ...config.seo, description: e.target.value } })} /></label>
      </div>
    </div>
  );
}
