"use client";

import { useEffect, useState } from "react";
import type { AppContext } from "@/components/design-system-app";
import { Icon } from "@/components/icons";
import { AssetsManager } from "@/components/assets-manager";
import { useAuth } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase-client";
import { routeForPage } from "@/lib/routes";
import { pushToast } from "@/lib/toast";
import type { ContentPage, ContentSection, PageType, Release, VisualBlock, VisualBlockKind } from "@/types/content";

const studioNav = [
  ["dashboard", "grid", "Dashboard"],
  ["content", "file", "Content"],
  ["tokens", "layers", "Tokens"],
  ["assets", "image", "Assets"],
  ["releases", "file", "Releases"],
  ["feedback", "edit", "Feedback"],
  ["settings", "settings", "Settings"],
] as const;

export function Studio({ app }: { app: AppContext }) {
  const auth = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const { navigate, reload } = app;

  useEffect(() => {
    if (auth.ready && auth.isAdmin && app.path === "/studio/login") {
      navigate("/studio/dashboard");
    }
  }, [auth.ready, auth.isAdmin, app.path, navigate]);

  useEffect(() => {
    if (auth.ready && auth.isAdmin) void reload();
  }, [auth.ready, auth.isAdmin, reload]);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimeoutReached(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!auth.ready && !timeoutReached) {
    return <div className="studio-loading" aria-live="polite">Loading One Design Studio...</div>;
  }

  if (!auth.session || !auth.isAdmin) {
    return <Login auth={auth} app={app} />;
  }

  if (app.error) {
    return <div className="studio-loading" role="alert">We couldn&apos;t load Studio data. <button onClick={() => void reload()}>Try again</button></div>;
  }

  if (app.path === "/studio/login") {
    return null;
  }

  const parts = app.path.split("/").filter(Boolean);
  const section = parts[1] || "dashboard";
  return (
    <div className="studio-shell">
      {app.isPreview && <div className="studio-preview-banner" role="status">Preview data only. Connect Supabase to manage production content.</div>}
      <aside className="studio-sidebar">
        <button className="brand studio-brand" onClick={() => app.navigate("/studio/dashboard")}>
          <span className="brand-mark" aria-hidden="true">O</span>
          <span>One Design Studio</span>
        </button>
        <nav aria-label="Studio navigation">
          {studioNav.map(([slug, icon, label]) => (
            <button key={slug} className={section === slug ? "active" : ""} onClick={() => app.navigate(`/studio/${slug}`)} aria-current={section === slug ? "page" : undefined}>
              <Icon name={icon} />
              {label}
            </button>
          ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <button onClick={() => app.navigate("/")}><Icon name="external" />View portal</button>
          <div className="admin-chip">
            <span aria-hidden="true">{auth.user?.email?.slice(0, 2).toUpperCase() ?? "AD"}</span>
            <div>
              <strong>{auth.user?.email ?? "Administrator"}</strong>
              <small>Full access</small>
            </div>
          </div>
          <button className="sign-out-button" onClick={() => void auth.signOut()}><Icon name="external" />Sign out</button>
        </div>
      </aside>
      <div className="studio-main">
        {section === "dashboard" ? <Dashboard app={app} />
          : section === "content" ? <ContentManager app={app} parts={parts} />
          : section === "tokens" ? <Tokens />
          : section === "assets" ? <AssetsManager app={app} />
          : section === "releases" ? <ReleasesManager app={app} />
          : section === "feedback" ? <Feedback />
          : <Settings app={app} />}
      </div>
    </div>
  );
}

function Login({ auth, app }: { auth: ReturnType<typeof useAuth>; app: AppContext }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { configured } = getSupabaseConfig();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await auth.signIn(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    pushToast("success", "Welcome back.");
    app.navigate("/studio/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="brand-mark" aria-hidden="true">O</span>
        <span>One Design</span>
      </div>
      <form onSubmit={submit}>
        <span className="eyebrow">Administrator</span>
        <h1>Welcome back.</h1>
        <p>Manage documentation, tokens, and assets in one place.</p>
        {!configured && (
          <p className="form-error" role="alert">Sign in is not configured. Connect Supabase to manage administrators.</p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <label>Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@company.com" required autoComplete="email" />
        </label>
        <label>Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required autoComplete="current-password" />
        </label>
        <button className="primary-button" type="submit" disabled={submitting || !configured}>
          {submitting ? "Signing in..." : "Sign in"} <Icon name="arrow" />
        </button>
        <small>Only administrator accounts can sign in. Ask your design system owner for access.</small>
      </form>
      <div className="login-art">
        <div>
          <span>Documentation</span>
          <strong>Clear guidance.<br />One source.</strong>
        </div>
      </div>
    </div>
  );
}

function StudioHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="studio-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

function Dashboard({ app }: { app: AppContext }) {
  const drafts = app.data.pages.filter((p) => p.status === "draft");
  return (
    <div className="studio-page">
      <StudioHeader
        eyebrow="Sunday, 19 July"
        title="Good morning."
        action={<button className="primary-button" onClick={() => app.navigate("/studio/content/new")}><Icon name="plus" />New documentation</button>}
      />
      <section className="dashboard-grid">
        <article className="content-card continue-card">
          <span className="eyebrow">Continue working</span>
          <div className="big-number">{drafts.length || 3}</div>
          <h2>Drafts need your attention</h2>
          <p>Continue editing and publish when the guidance is ready.</p>
          <button onClick={() => app.navigate("/studio/content")}>View drafts <Icon name="arrow" /></button>
        </article>
        <article className="content-card">
          <span className="eyebrow">Documentation health</span>
          <div className="health-ring"><strong>86%</strong></div>
          <p>Most published pages include the recommended guidance.</p>
        </article>
        <article className="content-card">
          <span className="eyebrow">Token library</span>
          <div className="big-number">2,711</div>
          <h2>Tokens available</h2>
          <p>21 descriptions complete · 840 references found</p>
          <button onClick={() => app.navigate("/studio/tokens")}>Open tokens <Icon name="arrow" /></button>
        </article>
      </section>
      <section className="attention-list">
        <div className="section-heading-small">
          <div>
            <span className="eyebrow">Needs attention</span>
            <h2>Keep the system healthy.</h2>
          </div>
        </div>
        {[["3 pages", "Missing accessibility guidance", "/studio/content"], ["12 assets", "Need alternative text", "/studio/assets"], ["1 token import", "Ready to review", "/studio/tokens"]].map(([n, t, href]) => (
          <button key={t} onClick={() => app.navigate(href)}><strong>{n}</strong><span>{t}</span><Icon name="chevron" /></button>
        ))}
      </section>
      <section className="recent-table">
        <div className="section-heading-small">
          <h2>Recently updated</h2>
          <button onClick={() => app.navigate("/studio/content")}>View all</button>
        </div>
        {app.data.pages.slice(0, 5).map((p) => (
          <div key={p.id}>
            <span className="item-icon">{p.title.slice(0, 1)}</span>
            <strong>{p.title}</strong>
            <span>{p.type}</span>
            <em className={`status ${p.status}`}>{p.status}</em>
            <small>{p.updatedAt}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

function ContentManager({ app, parts }: { app: AppContext; parts: string[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const pageId = parts[2];
  if (pageId === "new") return <PageEditor app={app} />;
  if (pageId && parts[3] === "edit") {
    const page = app.data.pages.find((p) => p.id === pageId);
    return page ? <PageEditor app={app} initial={page} /> : null;
  }
  const list = app.data.pages.filter((p) => (type === "all" || p.type === type) && `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="studio-page">
      <StudioHeader eyebrow="Content" title="Documentation" action={<button className="primary-button" onClick={() => app.navigate("/studio/content/new")}><Icon name="plus" />New page</button>} />
      <div className="manager-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentation..." aria-label="Search documentation" />
        </label>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="foundation">Foundations</option>
          <option value="component">Components</option>
          <option value="pattern">Patterns</option>
          <option value="resource">Resources</option>
        </select>
      </div>
      <div className="content-table table-head">
        <span>Page</span><span>Type</span><span>Status</span><span>Updated</span><span />
      </div>
      {list.map((p) => (
        <div className="content-table" key={p.id}>
          <button className="page-cell" onClick={() => app.navigate(`/studio/content/${p.id}/edit`)}>
            <span className="item-icon">{p.title[0]}</span>
            <div><strong>{p.title}</strong><small>{p.category}</small></div>
          </button>
          <span>{p.type}</span>
          <em className={`status ${p.status}`}>{p.status}</em>
          <span>{p.updatedAt}</span>
          <div className="row-actions">
            <button onClick={() => duplicatePage(app, p)} title="Duplicate" aria-label={`Duplicate ${p.title}`}><Icon name="copy" /></button>
            <button onClick={() => archivePage(app, p)} title="Archive" aria-label={`Archive ${p.title}`}><Icon name="trash" /></button>
          </div>
        </div>
      ))}
      {!list.length && (
        <div className="empty-panel">
          <Icon name="file" />
          <h2>No pages yet</h2>
          <p>Create your first page to start documenting the design system.</p>
        </div>
      )}
    </div>
  );
}

function PageEditor({ app, initial }: { app: AppContext; initial?: ContentPage }) {
  const isNew = !initial;
  const [page, setPage] = useState<ContentPage>(() => structuredClone(initial ?? makeNewPageTemplate()));
  const [selected, setSelected] = useState<string | null>(page.sections[0]?.id || null);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<ContentPage>) => { setPage((p) => ({ ...p, ...patch })); setSaved(false); };
  const save = async (publish = false) => {
    if (saving) return;
    setSaving(true);
    const next: ContentPage = {
      ...page,
      status: publish ? "published" as const : page.status,
      updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    try {
      const result = await app.upsertPage(next);
      if (!result.ok) throw new Error(result.error ?? "We couldn't save this page.");
      setPage(next);
      setSaved(true);
      pushToast("success", publish ? "Page published." : "Page saved.");
      if (isNew) app.navigate(`/studio/content/${next.id}/edit`);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't save this page.");
    } finally {
      setSaving(false);
    }
  };
  const section = page.sections.find((s) => s.id === selected);

  return (
    <div className="editor-shell">
      <header className="editor-top">
        <div>
          <button onClick={() => app.navigate("/studio/content")}>Content</button>
          <span>/</span>
          <strong>{page.title}</strong>
        </div>
        <div className="save-state">
          <span className={saved ? "saved" : "unsaved"} />
          {saved ? "Saved" : "Unsaved changes"}
        </div>
        <div>
           <button className="secondary-button" onClick={() => { const preview = window.open(routeForPage(page), "_blank"); if (preview) preview.opener = null; }} disabled={saving || page.status !== "published"} title={page.status !== "published" ? "Publish this page before previewing it" : undefined}>Preview</button>
           <button className="primary-button" onClick={() => void save(true)} disabled={saving}>{saving ? "Publishing..." : "Publish"}</button>
        </div>
      </header>
      <aside className="editor-outline">
        <div>
          <span>Page outline</span>
          <button onClick={() => addSection(page, setPage, setSelected)} aria-label="Add section"><Icon name="plus" /></button>
        </div>
        {page.sections.map((s, i) => (
          <button key={s.id} className={selected === s.id ? "active" : ""} onClick={() => setSelected(s.id)}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s.title}
            <i />
          </button>
        ))}
        {!page.sections.length && (
          <div className="outline-empty">
            <p>No sections yet.</p>
            <button onClick={() => addRecommended(page, setPage, setSelected)}>Add recommended sections</button>
          </div>
        )}
      </aside>
      <main className="editor-canvas">
        <div className="editable-header">
          <span className="eyebrow">{page.category}</span>
          <input className="title-input" value={page.title} onChange={(e) => update({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} />
          <textarea value={page.summary} onChange={(e) => update({ summary: e.target.value })} />
          <div className="meta-row"><span className="status-dot" />{page.maturity}<span>v{page.version}</span></div>
        </div>
        {page.sections.map((s) => (
          <button className={`editable-block ${selected === s.id ? "selected" : ""}`} key={s.id} onClick={() => setSelected(s.id)}>
            <span className="drag-handle">⋮⋮</span>
            <span className="block-type">{s.kind}</span>
            <h2>{s.title}</h2>
            {s.body && <p>{s.body}</p>}
            {s.items && <div className="mini-item-grid">{s.items.map((i) => <span key={i.title}>{i.title}</span>)}</div>}
          </button>
        ))}
        <button className="add-block" onClick={() => addSection(page, setPage, setSelected)}><Icon name="plus" />Add a section</button>
      </main>
      <aside className="editor-properties">
        {section ? (
          <SectionProperties section={section} page={page} setPage={setPage} onDelete={() => {
            const next = { ...page, sections: page.sections.filter((s) => s.id !== section.id) };
            setPage(next);
            setSelected(next.sections[0]?.id ?? null);
          }} />
        ) : (
          <PageProperties page={page} update={update} />
        )}
      </aside>
      <div className="editor-save-bar">
         <button className="secondary-button" onClick={() => void save(false)} disabled={saved || saving}>{saving ? "Saving..." : saved ? "Saved" : "Save draft"}</button>
         <button className="primary-button" onClick={() => void save(true)} disabled={saving}>{saving ? "Publishing..." : "Publish page"}</button>
      </div>
    </div>
  );
}

function SectionProperties({ section, page, setPage, onDelete }: { section: ContentSection; page: ContentPage; setPage: (p: ContentPage) => void; onDelete: () => void }) {
  const update = (patch: Partial<ContentSection>) => setPage({ ...page, sections: page.sections.map((s) => (s.id === section.id ? { ...s, ...patch } : s)) });
  const addVisualBlock = (kind: VisualBlockKind) => {
    const block: VisualBlock = { id: crypto.randomUUID(), kind, label: "" };
    update({ visualBlocks: [...(section.visualBlocks ?? []), block] });
  };
  const updateVisualBlock = (id: string, patch: Partial<VisualBlock>) => {
    update({ visualBlocks: section.visualBlocks?.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  };
  const removeVisualBlock = (id: string) => {
    update({ visualBlocks: section.visualBlocks?.filter((b) => b.id !== id) });
  };
  return (
    <div className="properties-form">
      <span className="eyebrow">Section</span>
      <h2>{section.title}</h2>
      <label>Section title<input value={section.title} onChange={(e) => update({ title: e.target.value })} /></label>
      <label>Guidance<textarea rows={8} value={section.body || ""} onChange={(e) => update({ body: e.target.value })} placeholder="Write clear guidance for designers..." /></label>
      <div className="property-group">
        <span>Visual blocks</span>
        {section.visualBlocks?.map((block) => (
          <div key={block.id} className="visual-block-editor">
            <select value={block.kind} onChange={(e) => updateVisualBlock(block.id, { kind: e.target.value as VisualBlockKind })}>
              <option value="component-preview">Component preview</option>
              <option value="token-swatch">Token swatch</option>
              <option value="typography-specimen">Typography specimen</option>
              <option value="spacing-specimen">Spacing specimen</option>
              <option value="icon-construction">Icon construction</option>
              <option value="state-comparison">State comparison</option>
              <option value="anatomy-diagram">Anatomy diagram</option>
              <option value="do-dont-comparison">Do/don’t comparison</option>
              <option value="flow-diagram">Flow diagram</option>
              <option value="asset-preview">Asset preview</option>
            </select>
            <input value={block.label} onChange={(e) => updateVisualBlock(block.id, { label: e.target.value })} placeholder="Label for this visual block" aria-label="Visual block label" />
            <button className="danger-button small" onClick={() => removeVisualBlock(block.id)}><Icon name="trash" />Remove</button>
          </div>
        ))}
        <div className="add-visual-block-group">
          <span>Add visual block</span>
          <div className="visual-block-type-grid">
            {(["component-preview","token-swatch","typography-specimen","spacing-specimen","icon-construction","state-comparison","anatomy-diagram","do-dont-comparison","flow-diagram","asset-preview"] as VisualBlockKind[]).map((kind) => (
              <button key={kind} className="visual-block-type-btn" onClick={() => addVisualBlock(kind)}>
                {kind === "component-preview" ? "Preview" : kind === "token-swatch" ? "Swatch" : kind === "typography-specimen" ? "Type" : kind === "spacing-specimen" ? "Space" : kind === "icon-construction" ? "Icons" : kind === "state-comparison" ? "States" : kind === "anatomy-diagram" ? "Anatomy" : kind === "do-dont-comparison" ? "Do/Don't" : kind === "flow-diagram" ? "Flow" : "Asset"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="property-group">
        <span>Visibility</span>
        <button className="option-row"><span>Visible on portal</span><i className="toggle on" /></button>
      </div>
      <div className="writing-tip">
        <strong>Writing tip</strong>
        <p>Use short sentences. Explain what to do and why.</p>
      </div>
      <button className="danger-button" onClick={onDelete}><Icon name="trash" />Remove block</button>
    </div>
  );
}

function PageProperties({ page, update }: { page: ContentPage; update: (p: Partial<ContentPage>) => void }) {
  return (
    <div className="properties-form">
      <span className="eyebrow">Page</span>
      <h2>Page settings</h2>
      <label>Page type
        <select value={page.type} onChange={(e) => update({ type: e.target.value as PageType })}>
          <option value="component">Component</option>
          <option value="foundation">Foundation</option>
          <option value="pattern">Pattern</option>
          <option value="resource">Resource</option>
        </select>
      </label>
      <label>Category<input value={page.category} onChange={(e) => update({ category: e.target.value })} /></label>
      <label>Owner<input value={page.owner} onChange={(e) => update({ owner: e.target.value })} /></label>
    </div>
  );
}

function addSection(page: ContentPage, setPage: (p: ContentPage) => void, setSelected: (id: string) => void) {
  const id = `section-${crypto.randomUUID()}`;
  setPage({ ...page, sections: [...page.sections, { id, kind: "rich-text", title: "New section", body: "Add guidance that is easy for designers to understand." }] });
  setSelected(id);
}

function makeNewPageTemplate(): ContentPage {
  const id = crypto.randomUUID();
  return {
    id,
    type: "component" as PageType,
    title: "Untitled component",
    slug: `untitled-component-${id}`,
    summary: "Describe the purpose and when to use this component.",
    category: "General",
    status: "draft" as const,
    maturity: "experimental" as const,
    version: "1.0",
    owner: "Design System Team",
    updatedAt: "19 Jul 2026",
    sections: [],
  };
}

function addRecommended(page: ContentPage, setPage: (p: ContentPage) => void, setSelected: (id: string) => void) {
  const names = page.type === "component"
    ? ["Overview", "Visual preview", "Anatomy", "Variants", "Sizes", "States", "Behavior", "Content guidelines", "Responsive behavior", "Accessibility", "Do & don’t", "Related components", "Figma resource", "Changelog"]
    : ["Overview", "Principles", "Token collection", "Hierarchy", "Usage", "Examples", "Accessibility", "Do & don’t", "Related foundations", "Figma resource", "Changelog"];
  const sections = names.map((n, i) => ({ id: `section-${i}`, kind: (i === 0 ? "overview" : "rich-text") as ContentSection["kind"], title: n, body: "Add clear guidance for designers." }));
  setPage({ ...page, sections });
  setSelected(sections[0].id);
}

async function duplicatePage(app: AppContext, p: ContentPage) {
  const copy: ContentPage = { ...structuredClone(p), id: crypto.randomUUID(), title: `${p.title} copy`, slug: `${p.slug}-copy-${crypto.randomUUID().slice(0, 8)}`, status: "draft" as const };
  try {
    const result = await app.upsertPage(copy);
    if (!result.ok) throw new Error(result.error ?? "We couldn't duplicate this page.");
    pushToast("success", "Page duplicated as draft.");
  } catch (error) {
    pushToast("error", error instanceof Error ? error.message : "We couldn't duplicate this page.");
  }
}

async function archivePage(app: AppContext, p: ContentPage) {
  if (!confirm(`Archive ${p.title}?`)) return;
  try {
    const result = await app.upsertPage({ ...p, status: "archived" });
    if (!result.ok) throw new Error(result.error ?? "We couldn't archive this page.");
    pushToast("success", "Page archived.");
  } catch (error) {
    pushToast("error", error instanceof Error ? error.message : "We couldn't archive this page.");
  }
}

function Tokens() {
  const [fileName, setFileName] = useState("token-dari-figma.json");
  const [selectedGroup, setSelectedGroup] = useState("All tokens");
  const [query, setQuery] = useState("");
  const groups = [["Color", "1,664"], ["Dimension", "492"], ["String", "363"], ["Font style", "69"], ["Number", "69"], ["Gradient", "43"], ["Grid", "6"], ["Effect", "5"]];
  const visibleGroups = groups
    .filter(([name]) => selectedGroup === "All tokens" || name === selectedGroup)
    .filter(([name]) => name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="studio-page">
      <StudioHeader
        eyebrow="Tokens"
        title="Token library"
        action={
          <label className="primary-button upload-button">
            <Icon name="upload" />Import JSON
            <input type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) setFileName(e.target.files[0].name) }} hidden />
          </label>
        }
      />
      <section className="token-summary">
        <article><span>Active source</span><h2>{fileName}</h2><p>Figma Design Tokens format</p><em className="status published">Published</em></article>
        <article><span>Total tokens</span><strong>2,711</strong><p>Across 9 collections</p></article>
        <article><span>References</span><strong>840</strong><p>345 unique references</p></article>
        <article><span>Descriptions</span><strong>21</strong><p>2,690 still need guidance</p></article>
      </section>
      <div className="token-workspace">
        <aside>
           <button className={selectedGroup === "All tokens" ? "active" : ""} onClick={() => setSelectedGroup("All tokens")}>All tokens <span>2,711</span></button>
           {["Core", "Alias", "Element", "Color", "Typography", "Gradient", "Grid", "Effect"].map((g) => (
             <button key={g} className={selectedGroup === g ? "active" : ""} onClick={() => setSelectedGroup(g)}>{g}<Icon name="chevron" /></button>
           ))}
        </aside>
        <section>
          <div className="manager-toolbar">
            <label className="search-field">
              <Icon name="search" />
               <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search token group..." aria-label="Search tokens" />
             </label>
             <span className="muted-note">{selectedGroup}</span>
           </div>
           <div className="token-group-grid">
             {visibleGroups.map(([n, c]) => (
              <article key={n}>
                <div className={`token-preview token-${n.toLowerCase().replace(" ", "-")}`}>{n.slice(0, 2)}</div>
                <h3>{n}</h3>
                <strong>{c}</strong>
                <p>tokens available</p>
                 <button onClick={() => setSelectedGroup(n)}>Explore <Icon name="arrow" /></button>
               </article>
             ))}
             {!visibleGroups.length && <div className="empty-panel"><Icon name="search" /><h2>No token groups found</h2><p>Try a different token group or clear the search.</p></div>}
           </div>
        </section>
      </div>
    </div>
  );
}

function ReleasesManager({ app }: { app: AppContext }) {
  const [editing, setEditing] = useState<Release | null>(null);
  const create = async () => {
    const r: Release = {
       id: crypto.randomUUID(),
      version: "1.1",
      title: "Untitled release",
      summary: "Describe what designers should know about this release.",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: "draft",
      changes: [],
    };
    try {
      const result = await app.upsertRelease(r);
      if (!result.ok) throw new Error(result.error ?? "We couldn't create this release.");
      setEditing(r);
      pushToast("success", "Draft release created.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't create this release.");
    }
  };
  const save = async (release: Release, status: Release["status"]) => {
    try {
      const next = { ...release, status };
      const result = await app.upsertRelease(next);
      if (!result.ok) throw new Error(result.error ?? "We couldn't save this release.");
      setEditing(next);
      pushToast("success", status === "published" ? "Release published." : status === "draft" ? "Release saved." : "Release unpublished.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't save this release.");
    }
  };
  return (
    <div className="studio-page">
      <StudioHeader eyebrow="Releases" title="Changelog" action={<button className="primary-button" onClick={create}><Icon name="plus" />New release</button>} />
      {editing && (
        <section className="release-editor" aria-label="Edit release">
          <header>
            <div><span className="eyebrow">Release editor</span><h2>Edit release</h2></div>
            <button className="drawer-close" onClick={() => setEditing(null)} aria-label="Close release editor"><Icon name="close" /></button>
          </header>
          <div className="properties-form">
            <label>Version<input value={editing.version} onChange={(e) => setEditing({ ...editing, version: e.target.value })} /></label>
            <label>Title<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
            <label>Summary<textarea rows={3} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></label>
            <label>Release date<input value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></label>
            <label>Changes<textarea rows={6} value={editing.changes.join("\n")} onChange={(e) => setEditing({ ...editing, changes: e.target.value.split("\n").map((change) => change.trim()).filter(Boolean) })} placeholder="One change per line" /></label>
            <div className="release-editor-actions">
              <button className="secondary-button" onClick={() => void save(editing, "draft")}>Save draft</button>
              {editing.status === "published" ? <button className="secondary-button" onClick={() => void save(editing, "draft")}>Unpublish</button> : <button className="primary-button" onClick={() => void save(editing, "published")}>Publish release</button>}
            </div>
          </div>
        </section>
      )}
      <div className="release-manager">
        {app.data.releases.map((r) => (
          <article key={r.id}>
            <div>
              <span>v{r.version}</span>
              <em className={`status ${r.status}`}>{r.status}</em>
            </div>
            <h2>{r.title}</h2>
            <p>{r.summary}</p>
            <time>{r.date}</time>
            <button className="secondary-button" onClick={() => setEditing({ ...r })}>Edit release</button>
          </article>
        ))}
        {!app.data.releases.length && (
          <div className="empty-panel">
            <Icon name="file" />
            <h2>No releases yet</h2>
            <p>Create the first changelog entry to share what changed.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Feedback() {
  return (
    <div className="studio-page">
      <StudioHeader eyebrow="Feedback" title="What designers are saying" />
      <div className="empty-panel">
        <Icon name="edit" />
        <h2>No open feedback</h2>
        <p>Feedback from portal pages will appear here.</p>
      </div>
    </div>
  );
}

function Settings({ app }: { app: AppContext }) {
  const [settings, setSettings] = useState(app.data.settings);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const result = await app.setSettings(settings);
      if (!result.ok) throw new Error(result.error ?? "We couldn't save settings.");
      pushToast("success", "Settings saved.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't save settings.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="studio-page settings-page">
      <StudioHeader eyebrow="Settings" title="Portal settings" />
      <div className="settings-layout">
        <aside aria-label="Settings sections">
          {["General", "Branding", "Navigation", "Templates", "Administrator", "Visibility", "Backup & export", "Audit log"].map((x, i) => (
            <button className={i === 0 ? "active" : ""} key={x}>{x}</button>
          ))}
        </aside>
        <section>
          <h2>General</h2>
          <p>Set the identity that appears across the portal.</p>
          <div className="properties-form">
            <label>Design system name<input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></label>
            <label>Hero statement<input value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} /></label>
            <label>Description<textarea rows={5} value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></label>
            <label>Portal visibility
              <select value={settings.visibility} onChange={(e) => setSettings({ ...settings, visibility: e.target.value as "public" | "unlisted" })}>
                <option value="unlisted">Unlisted — no login, no search indexing</option>
                <option value="public">Public</option>
              </select>
            </label>
            <button className="primary-button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
          </div>
        </section>
      </div>
    </div>
  );
}
