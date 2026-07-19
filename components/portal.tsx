"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppContext } from "@/components/design-system-app";
import { Icon } from "@/components/icons";
import type { Asset, ContentPage } from "@/types/content";

const nav = ["Design", "Foundations", "Components", "Patterns", "Resources"];

export function Portal({ app }: { app: AppContext }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const next = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    const timer = window.setTimeout(() => setTheme(next), 0);
    document.documentElement.dataset.theme = next;
    return () => window.clearTimeout(timer);
  }, []);
  const toggleTheme = () => { const next = theme === "light" ? "dark" : "light"; setTheme(next); localStorage.setItem("theme", next); document.documentElement.dataset.theme = next; };

  const parts = app.path.split("/").filter(Boolean);
  const root = parts[0];
  const slug = parts[1];
  const page = app.data.pages.find((p) => p.slug === slug && p.status === "published");

  let content: React.ReactNode;
  if (!root) content = <Home app={app} />;
  else if (root === "foundations" || root === "components") content = page ? <DocPage page={page} app={app} /> : <Collection type={root === "foundations" ? "foundation" : "component"} app={app} />;
  else if (root === "resources" && parts[1] === "assets") content = <AssetExplorer app={app} type={parts[2]} />;
  else if (root === "resources") content = <Resources app={app} />;
  else if (root === "changelog") content = <Changelog app={app} />;
  else if (root === "search") content = <SearchPage app={app} />;
  else if (root === "design" || root === "patterns") content = <EditorialIndex kind={root} app={app} />;
  else content = <NotFound app={app} />;

  return <div className="site-shell">
    <header className="global-header">
      <button className="brand" onClick={() => app.navigate("/")} aria-label="Buka halaman utama"><span className="brand-mark">N</span><span>{app.data.settings.name}</span></button>
      <nav className="desktop-nav" aria-label="Navigasi utama">{nav.map((item) => <button key={item} className={root === item.toLowerCase() ? "active" : ""} onClick={() => app.navigate(`/${item.toLowerCase()}`)}>{item}</button>)}</nav>
      <div className="header-actions">
        <button className="icon-button search-trigger" onClick={() => setSearch(true)} aria-label="Cari"><Icon name="search"/><span>Cari</span><kbd>⌘ K</kbd></button>
        <button className="icon-button" onClick={toggleTheme} aria-label={`Gunakan mode ${theme === "light" ? "gelap" : "terang"}`}><Icon name={theme === "light" ? "moon" : "sun"}/></button>
        <button className="icon-button mobile-only" onClick={() => setMenu(!menu)} aria-label="Buka menu"><Icon name={menu ? "close" : "menu"}/></button>
      </div>
    </header>
    {menu && <div className="mobile-menu">{nav.map((item) => <button key={item} onClick={() => {app.navigate(`/${item.toLowerCase()}`); setMenu(false)}}>{item}<Icon name="arrow"/></button>)}</div>}
    <main>{content}</main>
    <footer className="footer"><div><span className="brand-mark">N</span><strong>{app.data.settings.name}</strong></div><p>Satu bahasa desain untuk pengalaman yang lebih jelas dan konsisten.</p><div className="footer-links"><button onClick={() => app.navigate("/changelog")}>Changelog</button><button onClick={() => app.navigate("/resources/assets")}>Asset Library</button><button onClick={() => app.navigate("/studio/login")}>Administrator</button></div></footer>
    {search && <SearchDialog app={app} close={() => setSearch(false)} />}
  </div>;
}

function Home({ app }: { app: AppContext }) {
  const featured = app.data.pages.filter((p) => p.featured && p.status === "published");
  return <>
    <section className="home-hero">
      <div className="hero-copy reveal"><span className="eyebrow">Design System</span><h1>{app.data.settings.tagline}</h1><p>{app.data.settings.description}</p><div className="button-row"><button className="primary-button" onClick={() => app.navigate("/foundations")}>Explore foundations <Icon name="arrow"/></button><button className="text-button" onClick={() => app.navigate("/components")}>Browse components</button></div></div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-a"><span>Aa</span></div><div className="orbit orbit-b"><span>24</span></div><div className="orbit orbit-c"><span>→</span></div><div className="hero-core"><span className="core-dot"/><strong>One system</strong><small>Clear decisions</small></div></div>
    </section>
    <section className="statement-section"><p>Built for designers.</p><h2>Temukan keputusan yang tepat.<br/>Gunakan dengan percaya diri.</h2></section>
    <section className="home-section"><div className="section-heading"><span className="eyebrow">Explore the system</span><h2>Mulai dari dasar,<br/>lanjutkan dengan konsisten.</h2></div><div className="editorial-grid">{featured.map((p, i) => <button className={`editorial-card card-${i + 1}`} key={p.id} onClick={() => app.navigate(`/${p.type}s/${p.slug}`)}><span className="card-index">0{i + 1}</span><div className="card-visual"><PreviewGlyph page={p}/></div><div><h3>{p.title}</h3><p>{p.summary}</p><Icon name="arrow"/></div></button>)}</div></section>
    <section className="system-story"><div className="sticky-story"><span className="eyebrow">One source of truth</span><h2>Dari token sampai pengalaman.</h2><p>Setiap pilihan terhubung agar designer dapat bergerak lebih cepat tanpa kehilangan konsistensi.</p></div><div className="story-steps">{[["01","Foundations","Keputusan visual yang menjadi dasar."],["02","Components","Elemen yang siap digunakan dan dipadukan."],["03","Patterns","Cara menyelesaikan kebutuhan yang berulang."],["04","Assets","Icon, illustration, dan resource dalam satu tempat."]].map(([n,t,d]) => <article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section className="latest-release"><span className="eyebrow">Latest release</span><h2>{app.data.releases[0]?.title}</h2><p>{app.data.releases[0]?.summary}</p><button className="text-button" onClick={() => app.navigate("/changelog")}>See what changed <Icon name="arrow"/></button></section>
  </>;
}

function Collection({ type, app }: { type: "foundation" | "component"; app: AppContext }) {
  const pages = app.data.pages.filter((p) => p.type === type && p.status === "published");
  const [query, setQuery] = useState("");
  const groups = [...new Set(pages.map((p) => p.category))];
  return <div className="collection-page"><section className="collection-hero"><span className="eyebrow">{type === "foundation" ? "Foundations" : "Components"}</span><h1>{type === "foundation" ? "Keputusan dasar untuk pengalaman yang konsisten." : "Elemen yang membantu designer menyusun pengalaman."}</h1><p>{type === "foundation" ? "Gunakan foundation untuk membuat pilihan visual yang jelas, dapat digunakan kembali, dan mudah dipahami." : "Temukan anatomy, variants, states, behavior, dan panduan penggunaan setiap component."}</p></section><div className="collection-tools"><label className="search-field"><Icon name="search"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Cari ${type === "foundation" ? "foundation" : "component"}...`}/></label><span>{pages.length} items</span></div>{groups.map((group) => { const list = pages.filter((p) => p.category === group && `${p.title} ${p.summary}`.toLowerCase().includes(query.toLowerCase())); return list.length ? <section className="collection-group" key={group}><h2>{group}</h2><div className="collection-grid">{list.map((p) => <button className="collection-card" key={p.id} onClick={() => app.navigate(`/${type}s/${p.slug}`)}><div className="collection-preview"><PreviewGlyph page={p}/></div><div><h3>{p.title}</h3><p>{p.summary}</p><span className="card-link">Read guidance <Icon name="arrow"/></span></div></button>)}</div></section> : null;})}</div>;
}

function PreviewGlyph({ page }: { page: ContentPage }) {
  if (page.type === "component") return <div className={`component-demo demo-${page.slug}`}>{page.slug === "button" ? <span className="demo-button">Continue</span> : page.slug === "input" ? <div className="demo-input"><small>Email</small><span>name@example.com</span></div> : <span>{page.title}</span>}</div>;
  const map: Record<string, React.ReactNode> = { colour: <div className="swatch-stack"><i/><i/><i/></div>, typography: <span className="type-glyph">Ag</span>, spacing: <div className="space-bars"><i/><i/><i/></div>, grid: <div className="grid-glyph"/>, motion: <div className="motion-glyph">→</div> };
  return map[page.slug] || <span className="foundation-glyph">{page.title.slice(0,2)}</span>;
}

function DocPage({ page, app }: { page: ContentPage; app: AppContext }) {
  return <div className="doc-layout"><aside className="doc-sidebar"><button onClick={() => app.navigate(`/${page.type}s`)}>← All {page.type}s</button><span>{page.category}</span>{app.data.pages.filter((p) => p.type === page.type && p.status === "published").map((p) => <button key={p.id} className={p.id === page.id ? "active" : ""} onClick={() => app.navigate(`/${p.type}s/${p.slug}`)}>{p.title}</button>)}</aside><article className="doc-content"><header className="doc-header"><span className="eyebrow">{page.category}</span><h1>{page.title}</h1><p>{page.summary}</p><div className="meta-row"><span className="status-dot"/> {page.maturity}<span>v{page.version}</span><span>Updated {page.updatedAt}</span></div></header>{page.sections.map((section) => <DocSection key={section.id} section={section} page={page}/>)}</article><aside className="toc"><span>On this page</span>{page.sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}</aside></div>;
}

function DocSection({ section, page }: { section: ContentPage["sections"][number]; page: ContentPage }) {
  return <section id={section.id} className={`doc-section section-${section.kind}`}><h2>{section.title}</h2>{section.body && <p>{section.body}</p>}{section.kind === "preview" && <div className="demo-stage"><PreviewGlyph page={page}/><div className="demo-controls"><button className="selected">Default</button><button>Dark surface</button><button>Reset</button></div></div>}{section.kind === "tokens" && <TokenSample/>}{section.items && <div className={section.kind === "do-dont" ? "do-dont-grid" : "guidance-grid"}>{section.items.map((item) => <article className={item.tone || ""} key={item.title}>{item.tone && <span>{item.tone === "do" ? "Do" : "Don’t"}</span>}<h3>{item.title}</h3><p>{item.description}</p></article>)}</div>}{section.kind === "figma" && <button className="secondary-button">Open in Figma <Icon name="external"/></button>}</section>;
}

function TokenSample() { const rows = [["color.text.primary","{alias.neutral.900}","#161616"],["color.text.secondary","{alias.neutral.700}","#585858"],["color.background.primary","{core.neutral.0}","#FFFFFF"]]; return <div className="token-table">{rows.map((r,i) => <div key={r[0]}><i style={{background:r[2]}}/><code>{r[0]}</code><span>{r[1]}</span><b>{r[2]}</b><button aria-label={`Salin ${r[0]}`}><Icon name="copy"/></button></div>)}</div> }

function AssetExplorer({ app, type }: { app: AppContext; type?: string }) {
  const slugType = type as Asset["type"] | undefined;
  const [query, setQuery] = useState(""); const [brand, setBrand] = useState("All"); const [selected, setSelected] = useState<Asset | null>(null);
  const types: {slug: Asset["type"] | "all"; label: string}[] = [{slug:"all",label:"All"},{slug:"icon",label:"Icons"},{slug:"icon-illustration",label:"Icon Illustrations"},{slug:"illustration",label:"Illustrations"},{slug:"logo",label:"Logos"},{slug:"brand-asset",label:"Brand Assets"},{slug:"template",label:"Templates"},{slug:"download",label:"Downloads"}];
  const active = slugType || "all"; const showBrand = active === "icon-illustration";
  const assets = app.data.assets.filter((a) => a.status === "published" && (active === "all" || a.type === active) && (brand === "All" || a.brand === brand) && `${a.name} ${a.category} ${a.keywords.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="asset-page"><section className="asset-hero"><span className="eyebrow">Asset Library</span><h1>Temukan aset yang tepat.</h1><p>Icon outline, icon illustration, illustration, logo, dan resource lain dalam satu tempat.</p></section><div className="asset-toolbar"><label className="search-field"><Icon name="search"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari aset..."/></label><div className="type-tabs">{types.map((t) => <button key={t.slug} className={active === t.slug ? "active" : ""} onClick={() => app.navigate(t.slug === "all" ? "/resources/assets" : `/resources/assets/${t.slug}`)}>{t.label}</button>)}</div>{showBrand && <div className="brand-filter"><span>Brand</span>{["All","IM3","Indosat","Tri","Partner","Shared"].map((b) => <button key={b} className={brand === b ? "active" : ""} onClick={()=>setBrand(b)}>{b}</button>)}</div>}</div><div className="asset-count">{assets.length} assets</div><div className={`asset-grid ${active !== "icon" ? "visual-assets" : ""}`}>{assets.map((a) => <button className="asset-card" key={a.id} onClick={()=>setSelected(a)}><div className="asset-glyph"><span>{a.glyph}</span></div><div><strong>{a.name}</strong><small>{a.category}</small>{a.type === "icon-illustration" && <em>{a.brand}</em>}</div></button>)}</div>{!assets.length && <div className="empty-state"><Icon name="search"/><h2>Aset belum ditemukan</h2><p>Coba gunakan kata lain atau hapus beberapa filter.</p></div>}{selected && <AssetDrawer asset={selected} close={()=>setSelected(null)}/>}</div>;
}

function AssetDrawer({ asset, close }: { asset: Asset; close:()=>void }) { const [bg,setBg]=useState("light"); return <div className="drawer-backdrop" onClick={close}><aside className="asset-drawer" onClick={(e)=>e.stopPropagation()}><button className="drawer-close" onClick={close}><Icon name="close"/></button><div className={`drawer-preview preview-${bg}`}><span>{asset.glyph}</span></div><div className="preview-switch"><button className={bg==="light"?"active":""} onClick={()=>setBg("light")}>Light</button><button className={bg==="dark"?"active":""} onClick={()=>setBg("dark")}>Dark</button><button className={bg==="brand"?"active":""} onClick={()=>setBg("brand")}>Brand</button></div><span className="eyebrow">{asset.type.replace("-"," ")}</span><h2>{asset.name}</h2><p>{asset.description}</p><dl><div><dt>Category</dt><dd>{asset.category}</dd></div><div><dt>Brand</dt><dd>{asset.brand}</dd></div><div><dt>Version</dt><dd>{asset.version}</dd></div></dl><button className="primary-button">Download asset <Icon name="arrow"/></button><button className="secondary-button">Open in Figma <Icon name="external"/></button></aside></div> }

function Resources({ app }: { app: AppContext }) { const cards = [["Asset Library","Icon, illustration, logo, dan file yang siap digunakan.","/resources/assets"],["Figma Library","Buka component dan foundation yang sudah disetujui.","#"],["Templates","Mulai desain baru dari struktur yang konsisten.","/resources/assets/template"]]; return <div className="simple-index"><span className="eyebrow">Resources</span><h1>Semua yang dibutuhkan untuk mulai mendesain.</h1><div className="resource-grid">{cards.map(([t,d,u])=><button key={t} onClick={()=>u!=="#"&&app.navigate(u)}><Icon name="layers"/><h2>{t}</h2><p>{d}</p><span>Explore <Icon name="arrow"/></span></button>)}</div></div> }
function Changelog({ app }: { app: AppContext }) { return <div className="simple-index"><span className="eyebrow">Changelog</span><h1>Perubahan yang perlu diketahui designer.</h1><div className="release-list">{app.data.releases.filter(r=>r.status==="published").map(r=><article key={r.id}><time>{r.date}</time><div><span>v{r.version}</span><h2>{r.title}</h2><p>{r.summary}</p><ul>{r.changes.map(c=><li key={c}>{c}</li>)}</ul></div></article>)}</div></div> }
function EditorialIndex({ kind, app }: {kind:string;app:AppContext}) { const isDesign=kind==="design"; return <div className="simple-index"><span className="eyebrow">{isDesign?"Design":"Patterns"}</span><h1>{isDesign?"Cara kita membuat keputusan desain.":"Cara menyelesaikan kebutuhan yang berulang."}</h1><p className="lead">{isDesign?"Prinsip, cara memulai, dan panduan untuk berkontribusi pada design system.":"Susun pengalaman yang familiar dengan pola yang sudah dipelajari dan disetujui."}</p><div className="resource-grid">{(isDesign?["Introduction","Principles","Getting started","Contribution","Governance"]:["Forms","Navigation","Search","Feedback","Empty states","Responsive layout"]).map((x,i)=><button key={x}><span className="card-index">0{i+1}</span><h2>{x}</h2><p>Pelajari tujuan, prinsip, dan cara menggunakan panduan ini.</p><span>Read guidance <Icon name="arrow"/></span></button>)}</div></div> }
function SearchPage({ app }: { app: AppContext }) { return <div className="simple-index"><span className="eyebrow">Search</span><h1>Temukan panduan dengan cepat.</h1><SearchResults app={app}/></div> }
function SearchResults({ app, onChoose }: {app:AppContext;onChoose?:()=>void}) { const [q,setQ]=useState(""); const results=useMemo(()=>app.data.pages.filter(p=>p.status==="published"&&`${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(q.toLowerCase())),[q,app.data.pages]); return <div className="search-results"><label className="search-field large"><Icon name="search"/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari foundation, component, pattern, atau token..."/></label>{q&&<div>{results.map(p=><button key={p.id} onClick={()=>{app.navigate(`/${p.type}s/${p.slug}`);onChoose?.()}}><span>{p.type}</span><strong>{p.title}</strong><p>{p.summary}</p><Icon name="arrow"/></button>)}{!results.length&&<p className="no-results">Kami tidak menemukan panduan yang sesuai. Coba gunakan kata lain.</p>}</div>}</div> }
function SearchDialog({app,close}:{app:AppContext;close:()=>void}) { return <div className="search-overlay" onClick={close}><div className="search-dialog" onClick={e=>e.stopPropagation()}><button className="drawer-close" onClick={close}><Icon name="close"/></button><SearchResults app={app} onChoose={close}/><small>Tekan Esc untuk menutup</small></div></div> }
function NotFound({app}:{app:AppContext}) { return <div className="not-found"><span>404</span><h1>Halaman belum ditemukan.</h1><p>Alamat mungkin berubah atau halaman belum dipublikasikan.</p><button className="primary-button" onClick={()=>app.navigate("/")}>Back to home</button></div> }
