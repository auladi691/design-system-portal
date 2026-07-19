"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AppContext } from "@/components/design-system-app";
import { Icon } from "@/components/icons";
import { ASSET_CATEGORIES, ASSET_CATEGORY_MAP, categoryLabel, formatFileSize } from "@/lib/asset-categories";
import { collectionRouteForType, routeForPage } from "@/lib/routes";
import { pushToast } from "@/lib/toast";
import { useDialogFocus } from "@/components/dialog-focus";
import type { Asset, ContentPage } from "@/types/content";
import { VisualBlock } from "@/components/visual-block";

const nav = ["Design", "Foundations", "Components", "Patterns", "Resources"];
const BRANDS = ["All", "Shared", "IM3", "Indosat", "Tri", "Partner"] as const;

export function Portal({ app }: { app: AppContext }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const next = stored === "dark" || (!stored && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    const timer = window.setTimeout(() => setTheme(next), 0);
    document.documentElement.dataset.theme = next;
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("theme", next);
    document.documentElement.dataset.theme = next;
  };

  const parts = app.path.split("/").filter(Boolean);
  const root = parts[0];
  const slug = parts[1];
  const page = app.data.pages.find((p) => p.slug === slug && p.status === "published");

  let content: React.ReactNode;
  if (app.loading) content = <LoadingState assetLibrary={root === "resources" && parts[1] === "assets"} />;
  else if (app.error) content = <LoadError app={app} assetLibrary={root === "resources" && parts[1] === "assets"} />;
  else if (!root) content = <Home app={app} />;
  else if (root === "foundations" || root === "components") {
    const type = root === "foundations" ? "foundation" : "component";
    content = slug ? (page?.type === type ? <DocPage page={page} app={app} /> : <NotFound app={app} />) : <Collection type={type} app={app} />;
  } else if (root === "resources" && parts[1] === "assets") {
    content = parts.length > 3 || (parts[2] && !ASSET_CATEGORY_MAP[parts[2] as Asset["type"]])
      ? <NotFound app={app} />
      : <AssetExplorer app={app} type={parts[2]} />;
  } else if (root === "resources") {
    content = slug && parts.length === 2 ? (page?.type === "resource" ? <DocPage page={page} app={app} /> : <NotFound app={app} />) : slug ? <NotFound app={app} /> : <Resources app={app} />;
  } else if (root === "changelog" && parts.length === 1) content = <Changelog app={app} />;
  else if (root === "search" && parts.length === 1) content = <SearchPage app={app} />;
  else if (root === "design" || root === "patterns") {
    const type = root === "design" ? "design" : "pattern";
    content = slug && parts.length === 2 ? (page?.type === type ? <DocPage page={page} app={app} /> : <NotFound app={app} />) : slug ? <NotFound app={app} /> : <EditorialIndex kind={root} app={app} />;
  } else content = <NotFound app={app} />;

  return (
    <div className="site-shell">
      <header className="global-header">
        <button className="brand" onClick={() => app.navigate("/")} aria-label="Open home page">
          <span className="brand-mark" aria-hidden="true">O</span>
          <span>{app.data.settings.name}</span>
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map((item) => (
            <button key={item} className={root === item.toLowerCase() ? "active" : ""} onClick={() => app.navigate(`/${item.toLowerCase()}`)}>
              {item}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-button search-trigger" onClick={() => setSearch(true)} aria-label="Search">
            <Icon name="search" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
            <Icon name={theme === "light" ? "moon" : "sun"} />
          </button>
          <button className="icon-button mobile-only" onClick={() => setMenu(!menu)} aria-label="Open menu">
            <Icon name={menu ? "close" : "menu"} />
          </button>
        </div>
      </header>
      {menu && (
        <div className="mobile-menu">
          {nav.map((item) => (
            <button key={item} onClick={() => { app.navigate(`/${item.toLowerCase()}`); setMenu(false); }}>
              {item}
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      )}
      <main>{content}</main>
      <footer className="footer">
        <div>
          <span className="brand-mark" aria-hidden="true">O</span>
          <strong>{app.data.settings.name}</strong>
        </div>
        <p>One design language for clearer, more consistent experiences.</p>
        <div className="footer-links">
          <button onClick={() => app.navigate("/changelog")}>Changelog</button>
          <button onClick={() => app.navigate("/resources/assets")}>Asset Library</button>
          <button onClick={() => app.navigate("/studio/login")}>Administrator</button>
        </div>
      </footer>
      {search && <SearchDialog app={app} close={() => setSearch(false)} />}
    </div>
  );
}

function LoadingState({ assetLibrary }: { assetLibrary: boolean }) {
  return (
    <div className="loading-state" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      <p>{assetLibrary ? "Loading the latest published assets..." : "Loading the latest published guidance..."}</p>
    </div>
  );
}

function LoadError({ app, assetLibrary }: { app: AppContext; assetLibrary: boolean }) {
  return (
    <div className="empty-state" role="alert">
      <Icon name="warning" />
      <h1>{assetLibrary ? "We couldn’t load the Asset Library" : "We couldn’t load the latest guidance"}</h1>
      <p>{assetLibrary ? "Refresh the page or try again in a moment." : "Refresh the page or try again in a moment."}</p>
      <button className="primary-button" onClick={() => void app.reload()}>Try again</button>
    </div>
  );
}

function Home({ app }: { app: AppContext }) {
  const featured = app.data.pages.filter((p) => p.featured && p.status === "published");
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy reveal">
          <span className="eyebrow">Design System</span>
          <h1>{app.data.settings.tagline}</h1>
          <p>{app.data.settings.description}</p>
          <div className="button-row">
            <button className="primary-button" onClick={() => app.navigate("/foundations")}>Explore foundations <Icon name="arrow" /></button>
            <button className="text-button" onClick={() => app.navigate("/components")}>Browse components</button>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-a"><span>Aa</span></div>
          <div className="orbit orbit-b"><span>24</span></div>
          <div className="orbit orbit-c"><span>→</span></div>
          <div className="hero-core">
            <span className="core-dot" />
            <strong>One system</strong>
            <small>Clear decisions</small>
          </div>
        </div>
      </section>
      <section className="statement-section">
        <p>Built for designers.</p>
        <h2>Find the right decisions.<br />Use them with confidence.</h2>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <span className="eyebrow">Explore the system</span>
          <h2>Start with the basics,<br />keep things consistent.</h2>
        </div>
        <div className="editorial-grid">
           {featured.map((p, i) => (
             <button className={`editorial-card card-${i + 1}`} key={p.id} onClick={() => app.navigate(routeForPage(p))}>
              <span className="card-index">0{i + 1}</span>
              <div className="card-visual"><PreviewGlyph page={p} /></div>
               <div className="card-content"><h3>{p.title}</h3><p>{p.summary}</p><Icon name="arrow" /></div>
            </button>
          ))}
        </div>
      </section>
      <section className="system-story">
        <div className="sticky-story">
          <span className="eyebrow">One source of truth</span>
          <h2>From tokens to experiences.</h2>
          <p>Every decision connects so designers can move faster without losing consistency.</p>
        </div>
        <div className="story-steps">
          {[["01", "Foundations", "Visual decisions that form the baseline."],
            ["02", "Components", "Elements ready to use and combine."],
            ["03", "Patterns", "Ways to solve recurring needs."],
            ["04", "Assets", "Icons, illustrations, and resources in one place."]].map(([n, t, d]) => (
              <article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>
            ))}
        </div>
      </section>
       {app.data.releases[0] && (
         <section className="latest-release">
           <span className="eyebrow">Latest release</span>
           <h2>{app.data.releases[0].title}</h2>
           <p>{app.data.releases[0].summary}</p>
           <button className="text-button" onClick={() => app.navigate("/changelog")}>See what changed <Icon name="arrow" /></button>
         </section>
       )}
    </>
  );
}

function Collection({ type, app }: { type: "foundation" | "component"; app: AppContext }) {
  const pages = app.data.pages.filter((p) => p.type === type && p.status === "published");
  const [query, setQuery] = useState("");
  const groups = [...new Set(pages.map((p) => p.category))];
  const lower = query.toLowerCase();
  return (
    <div className="collection-page">
      <section className="collection-hero">
        <span className="eyebrow">{type === "foundation" ? "Foundations" : "Components"}</span>
        <h1>{type === "foundation" ? "Foundational decisions for consistent experiences." : "Elements that help designers shape experiences."}</h1>
        <p>{type === "foundation"
          ? "Use foundations to make clear, reusable, and easy-to-understand visual choices."
          : "Find anatomy, variants, states, behavior, and usage guidance for each component."}</p>
      </section>
      <div className="collection-tools">
        <label className="search-field">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${type === "foundation" ? "foundations" : "components"}...`} aria-label="Search" />
        </label>
        <span>{pages.length} items</span>
      </div>
      {groups.map((group) => {
        const list = pages.filter((p) => p.category === group && `${p.title} ${p.summary}`.toLowerCase().includes(lower));
        return list.length ? (
          <section className="collection-group" key={group}>
            <h2>{group}</h2>
            <div className="collection-grid">
              {list.map((p) => (
                 <button className="collection-card" key={p.id} onClick={() => app.navigate(routeForPage(p))}>
                  <div className="collection-preview"><PreviewGlyph page={p} /></div>
                  <div><h3>{p.title}</h3><p>{p.summary}</p><span className="card-link">Read guidance <Icon name="arrow" /></span></div>
                </button>
              ))}
            </div>
          </section>
        ) : null;
      })}
       {!pages.length && (
        <div className="empty-state">
           <Icon name="search" />
           <h2>No published guidance yet</h2>
           <p>Published foundations and components will appear here.</p>
         </div>
       )}
       {pages.length > 0 && !groups.some((group) => pages.some((p) => p.category === group && `${p.title} ${p.summary}`.toLowerCase().includes(lower))) && (
         <div className="empty-state">
           <Icon name="search" />
           <h2>No matching guidance</h2>
           <p>Try a different word or clear the search.</p>
         </div>
       )}
    </div>
  );
}

function PreviewGlyph({ page }: { page: ContentPage }) {
  if (page.type === "component")
    return (
      <div className={`component-demo demo-${page.slug}`}>
        {page.slug === "button" ? <span className="demo-button">Continue</span>
          : page.slug === "input" ? <div className="demo-input"><small>Email</small><span>name@example.com</span></div>
          : <span>{page.title}</span>}
      </div>
    );
  const map: Record<string, React.ReactNode> = {
    colour: <div className="swatch-stack"><i /><i /><i /></div>,
    typography: <span className="type-glyph">Ag</span>,
    spacing: <div className="space-bars"><i /><i /><i /></div>,
    grid: <div className="grid-glyph" />,
    motion: <div className="motion-glyph">→</div>,
  };
  return map[page.slug] || <span className="foundation-glyph">{page.title.slice(0, 2)}</span>;
}

function DocPage({ page, app }: { page: ContentPage; app: AppContext }) {
  return (
    <div className="doc-layout">
      <aside className="doc-sidebar" aria-label="Collection navigation">
         <button onClick={() => app.navigate(collectionRouteForType(page.type))}>← All {page.type === "foundation" ? "foundations" : page.type === "component" ? "components" : `${page.type}s`}</button>
        <span>{page.category}</span>
         {app.data.pages.filter((p) => p.type === page.type && p.status === "published").map((p) => (
           <button key={p.id} className={p.id === page.id ? "active" : ""} onClick={() => app.navigate(routeForPage(p))}>{p.title}</button>
        ))}
      </aside>
      <article className="doc-content">
        <header className="doc-header">
          <span className="eyebrow">{page.category}</span>
          <h1>{page.title}</h1>
          <p>{page.summary}</p>
          <div className="meta-row">
            <span className="status-dot" /> {page.maturity}
            <span>v{page.version}</span>
            <span>Updated {page.updatedAt}</span>
          </div>
        </header>
        {page.sections.map((section) => <DocSection key={section.id} section={section} page={page} />)}
      </article>
      <aside className="toc" aria-label="On this page">
        <span>On this page</span>
        {page.sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
      </aside>
    </div>
  );
}

function DocSection({ section, page }: { section: ContentPage["sections"][number]; page: ContentPage }) {
  return (
    <section id={section.id} className={`doc-section section-${section.kind}`}>
      <h2>{section.title}</h2>
      {section.body && <p>{section.body}</p>}
      {section.visualBlocks?.map((block) => <VisualBlock key={block.id} block={block} />)}
      {section.kind === "preview" && (
        <div className="demo-stage">
          <PreviewGlyph page={page} />
          <div className="demo-controls">
            <PreviewControls />
          </div>
        </div>
      )}
      {section.kind === "tokens" && <TokenSample />}
      {section.items && (
        <div className={section.kind === "do-dont" ? "do-dont-grid" : "guidance-grid"}>
          {section.items.map((item) => (
            <article className={item.tone || ""} key={item.title}>
              {item.tone && <span>{item.tone === "do" ? "Do" : "Don’t"}</span>}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      )}
      {section.kind === "figma" && page.figmaUrl && (
        <a className="secondary-button" href={page.figmaUrl} target="_blank" rel="noreferrer">Open in Figma <Icon name="external" /></a>
      )}
      {section.kind === "figma" && !page.figmaUrl && (
        <span className="muted-note">Add a Figma resource link from the page editor.</span>
      )}
    </section>
  );
}

function PreviewControls() {
  const [active, setActive] = useState("Default");
  return <>
    {["Default", "Dark surface"].map((label) => (
      <button key={label} className={active === label ? "selected" : ""} onClick={() => setActive(label)} aria-pressed={active === label}>{label}</button>
    ))}
    <button onClick={() => setActive("Default")}>Reset</button>
  </>;
}

function TokenSample() {
  const rows = [["color.text.primary", "{alias.neutral.900}", "#161616"], ["color.text.secondary", "{alias.neutral.700}", "#585858"], ["color.background.primary", "{core.neutral.0}", "#FFFFFF"]];
  const copyToken = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      pushToast("success", `${name} value copied.`);
    } catch {
      pushToast("error", "We couldn't copy this token. Try again.");
    }
  };
  return (
    <div className="token-table">
      {rows.map((r) => (
        <div key={r[0]}>
          <i style={{ background: r[2] }} />
          <code>{r[0]}</code>
          <span>{r[1]}</span>
          <b>{r[2]}</b>
          <button onClick={() => void copyToken(r[0], r[2])} aria-label={`Copy ${r[0]}`}><Icon name="copy" /></button>
        </div>
      ))}
    </div>
  );
}

function AssetExplorer({ app, type }: { app: AppContext; type?: string }) {
  const slugType = type as Asset["type"] | undefined;
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>("All");
  const [selected, setSelected] = useState<Asset | null>(null);

  const active: Asset["type"] | "all" = slugType && ASSET_CATEGORY_MAP[slugType] ? slugType : "all";
  const config = active === "all" ? null : ASSET_CATEGORY_MAP[active];
  const showBrand = config?.showBrandFilter ?? false;
  const isVisual = config?.visual ?? true;

  const lower = query.toLowerCase();
  const publishedAssets = app.data.assets.filter((a) => a.status === "published");
  const categoryAssets = active === "all" ? publishedAssets : publishedAssets.filter((a) => a.type === active);
  const assets = categoryAssets.filter((a) =>
     a.status === "published" &&
     (brand === "All" || a.brand === brand) &&
    `${a.name} ${a.category} ${a.keywords.join(" ")}`.toLowerCase().includes(lower),
  );

  return (
    <div className="asset-page">
      <section className="asset-hero">
        <span className="eyebrow">Asset Library</span>
        <h1>{config ? config.label : "Find the right asset."}</h1>
        <p>{config ? config.description : "Icons, icon illustrations, illustrations, logos, and resources in one place."}</p>
      </section>
      <div className="asset-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets..." aria-label="Search assets" />
        </label>
        <div className="type-tabs" role="tablist" aria-label="Asset categories">
          <button role="tab" aria-selected={active === "all"} className={active === "all" ? "active" : ""} onClick={() => app.navigate("/resources/assets")}>All</button>
          {ASSET_CATEGORIES.map((c) => (
            <button key={c.slug} role="tab" aria-selected={active === c.slug} className={active === c.slug ? "active" : ""} onClick={() => app.navigate(`/resources/assets/${c.slug}`)}>{c.label}</button>
          ))}
        </div>
        {showBrand && (
          <div className="brand-filter" role="group" aria-label="Brand filter">
            <span>Brand</span>
            {BRANDS.map((b) => (
              <button key={b} className={brand === b ? "active" : ""} onClick={() => setBrand(b)} aria-pressed={brand === b}>{b}</button>
            ))}
          </div>
        )}
      </div>
      <div className="asset-count">{assets.length} assets</div>
      {assets.length === 0 ? (
        <div className="empty-state">
           <Icon name="search" />
           <h2>{categoryAssets.length === 0 ? (config ? "No assets in this category yet" : "No published assets yet") : "No matching assets"}</h2>
           <p>{categoryAssets.length === 0
             ? (config ? "Published assets for this category will appear here." : "Published assets will appear here when they are ready to use.")
             : "Try a different word or clear the filters."}</p>
        </div>
      ) : (
        <div className={`asset-grid ${active !== "icon" && isVisual ? "visual-assets" : ""}`}>
          {assets.map((a) => (
            <button className="asset-card" key={a.id} onClick={() => setSelected(a)} aria-label={`Open ${a.name}`}>
              <div className="asset-glyph">
                {a.fileUrl && a.mimeType && a.mimeType.startsWith("image/") && a.type !== "icon" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.fileUrl} alt={a.altText || a.name} loading="lazy" />
                ) : (
                  <span>{a.glyph}</span>
                )}
              </div>
              <div>
                <strong>{a.name}</strong>
                <small>{a.category}</small>
                {(a.type === "icon-illustration" || a.type === "brand-asset") && <em>{a.brand}</em>}
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && <AssetDrawer asset={selected} close={() => setSelected(null)} />}
    </div>
  );
}

function AssetDrawer({ asset, close }: { asset: Asset; close: () => void }) {
  const [bg, setBg] = useState<"light" | "dark" | "brand">("light");
  const drawerRef = useRef<HTMLElement>(null);
  useDialogFocus(drawerRef, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  const canPreviewImage = asset.fileUrl && asset.mimeType && asset.mimeType.startsWith("image/");
  const canDownload = Boolean(asset.fileUrl);
  return (
    <div className="drawer-backdrop" onClick={close}>
       <aside ref={drawerRef} className="asset-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${asset.name} details`} aria-modal="true">
        <button className="drawer-close" onClick={close} aria-label="Close details"><Icon name="close" /></button>
        <div className={`drawer-preview preview-${bg}`} aria-hidden="true">
          {canPreviewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.fileUrl!} alt={asset.altText || asset.name} />
          ) : <span>{asset.glyph}</span>}
        </div>
        <div className="preview-switch" role="group" aria-label="Preview background">
          <button className={bg === "light" ? "active" : ""} onClick={() => setBg("light")} aria-pressed={bg === "light"}>Light</button>
          <button className={bg === "dark" ? "active" : ""} onClick={() => setBg("dark")} aria-pressed={bg === "dark"}>Dark</button>
          {asset.type !== "icon" && <button className={bg === "brand" ? "active" : ""} onClick={() => setBg("brand")} aria-pressed={bg === "brand"}>Brand</button>}
        </div>
        <span className="eyebrow">{categoryLabel(asset.type)}</span>
        <h2>{asset.name}</h2>
        <p>{asset.description}</p>
        <dl>
          <div><dt>Category</dt><dd>{asset.category}</dd></div>
          {(asset.type === "icon-illustration" || asset.type === "brand-asset") && <div><dt>Brand</dt><dd>{asset.brand}</dd></div>}
          <div><dt>Version</dt><dd>{asset.version}</dd></div>
          <div><dt>File type</dt><dd>{asset.mimeType ?? "—"}</dd></div>
          <div><dt>File size</dt><dd>{formatFileSize(asset.fileSize)}</dd></div>
          {asset.altText && <div><dt>Alternative text</dt><dd>{asset.altText}</dd></div>}
        </dl>
        {canDownload ? (
          <a className="primary-button" href={asset.fileUrl!} download={asset.originalFileName ?? asset.name} target="_blank" rel="noreferrer">Download asset <Icon name="arrow" /></a>
        ) : (
          <p className="muted-note">This file is not available yet.</p>
        )}
      </aside>
    </div>
  );
}

function Resources({ app }: { app: AppContext }) {
  const resourcePages = app.data.pages.filter((p) => p.type === "resource" && p.status === "published");
  return (
    <div className="simple-index">
      <span className="eyebrow">Resources</span>
      <h1>Everything you need to start designing.</h1>
       <div className="resource-grid">
         <ResourceCard title="Asset Library" summary="Icons, illustrations, logos, and files ready to use." icon="image" href="/resources/assets" onNavigate={app.navigate} />
         {resourcePages.map((page) => {
            const isFigma = page.slug === "figma-library";
            const isAssetLink = page.slug === "templates" || page.slug === "downloads";
            const href = isAssetLink ? `/resources/assets/${page.slug === "templates" ? "template" : "download"}` : `/resources/${page.slug}`;
            return <ResourceCard
              key={page.id}
              title={page.title}
              summary={page.summary}
              icon="layers"
              href={isFigma && isValidFigmaUrl(page.figmaUrl) ? page.figmaUrl : isFigma ? undefined : href}
              external={isFigma}
              unavailable={isFigma && !isValidFigmaUrl(page.figmaUrl)}
              onNavigate={app.navigate}
            />;
          })}
         {!resourcePages.length && <div className="empty-state"><Icon name="file" /><h2>No published resources yet</h2><p>Published resources will appear here.</p></div>}
       </div>
    </div>
  );
}

function isValidFigmaUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "figma.com" || url.hostname.endsWith(".figma.com"));
  } catch {
    return false;
  }
}

function ResourceCard({
  title,
  summary,
  icon,
  href,
  external = false,
  unavailable = false,
  onNavigate,
}: {
  title: string;
  summary: string;
  icon: string;
  href?: string;
  external?: boolean;
  unavailable?: boolean;
  onNavigate: (to: string) => void;
}) {
  const content = <>
    <span className="resource-card-visual" aria-hidden="true"><Icon name={icon} /></span>
     <div className="resource-card-content">
       <h2>{title}</h2>
       <p>{summary}</p>
       <span className="resource-card-action">{unavailable ? "Coming soon" : external ? "Open in Figma" : "Explore"} {!unavailable && <Icon name={external ? "external" : "arrow"} />}</span>
     </div>
  </>;
  if (unavailable) return <div className="resource-card unavailable" aria-disabled="true">{content}</div>;
  if (external && href) return <a className="resource-card" href={href} target="_blank" rel="noreferrer">{content}</a>;
  return <button className="resource-card" onClick={() => href && onNavigate(href)}>{content}</button>;
}

function Changelog({ app }: { app: AppContext }) {
  const releases = app.data.releases.filter((r) => r.status === "published");
  return (
    <div className="simple-index">
      <span className="eyebrow">Changelog</span>
      <h1>Changes designers should know about.</h1>
      <div className="release-list">
        {releases.map((r) => (
          <article key={r.id}>
            <time>{r.date}</time>
            <div>
              <span>v{r.version}</span>
              <h2>{r.title}</h2>
              <p>{r.summary}</p>
              <ul>{r.changes.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          </article>
        ))}
        {!releases.length && (
          <div className="empty-state">
            <Icon name="file" />
            <h2>No releases yet</h2>
             <p>Published releases will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditorialIndex({ kind, app }: { kind: string; app: AppContext }) {
  const isDesign = kind === "design";
  const type = isDesign ? "design" : "pattern";
  const pages = app.data.pages.filter((p) => p.type === type && p.status === "published");
  return (
    <div className="simple-index">
      <span className="eyebrow">{isDesign ? "Design" : "Patterns"}</span>
      <h1>{isDesign ? "How we make design decisions." : "Ways to solve recurring needs."}</h1>
      <p className="lead">{isDesign
        ? "Principles, getting started, and guidance for contributing to the design system."
        : "Build familiar experiences with patterns that are learned and approved."}</p>
       <div className="resource-grid">
          {pages.map((page, i) => (
            <button className="guidance-card" key={page.id} onClick={() => app.navigate(routeForPage(page))}>
              <span className="card-index">{String(i + 1).padStart(2, "0")}</span>
              <h2>{page.title}</h2>
              <p>{page.summary}</p>
              <span className="guidance-card-action">Read guidance <Icon name="arrow" /></span>
            </button>
         ))}
         {!pages.length && <div className="empty-state"><Icon name="file" /><h2>No published guidance yet</h2><p>Published {isDesign ? "design" : "pattern"} guidance will appear here.</p></div>}
       </div>
    </div>
  );
}

function SearchPage({ app }: { app: AppContext }) {
  return (
    <div className="simple-index">
      <span className="eyebrow">Search</span>
      <h1>Find guidance quickly.</h1>
      <SearchResults app={app} />
    </div>
  );
}

function SearchResults({ app, onChoose }: { app: AppContext; onChoose?: () => void }) {
  const [q, setQ] = useState("");
  const lower = q.toLowerCase();
  const results = useMemo(
    () => app.data.pages.filter((p) => p.status === "published" && `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(lower)),
    [lower, app.data.pages],
  );
  return (
    <div className="search-results">
      <label className="search-field large">
        <Icon name="search" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foundations, components, patterns, or tokens..." aria-label="Search guidance" />
      </label>
      {q && (
        <div>
           {results.map((p) => (
             <button key={p.id} onClick={() => { app.navigate(routeForPage(p)); onChoose?.(); }}>
              <span>{p.type}</span>
              <strong>{p.title}</strong>
              <p>{p.summary}</p>
              <Icon name="arrow" />
            </button>
          ))}
          {!results.length && <p className="no-results">We couldn&apos;t find matching guidance. Try a different word.</p>}
        </div>
      )}
    </div>
  );
}

function SearchDialog({ app, close }: { app: AppContext; close: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  return (
    <div className="search-overlay" onClick={close}>
       <div ref={dialogRef} className="search-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search">
        <button className="drawer-close" onClick={close} aria-label="Close search"><Icon name="close" /></button>
        <SearchResults app={app} onChoose={close} />
        <small>Press Esc to close</small>
      </div>
    </div>
  );
}

function NotFound({ app }: { app: AppContext }) {
  return (
    <div className="not-found">
      <span>404</span>
      <h1>Page not found.</h1>
      <p>The address may have changed or the page hasn&apos;t been published yet.</p>
      <button className="primary-button" onClick={() => app.navigate("/")}>Back to home</button>
    </div>
  );
}
