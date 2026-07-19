"use client";

import { useEffect, useState } from "react";
import type { AppContext } from "@/components/design-system-app";
import { Icon } from "@/components/icons";
import { AssetsManager } from "@/components/assets-manager";
import { useAuth } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase-client";
import { pushToast } from "@/lib/toast";
import type { ContentPage, ContentSection, PageType, Release } from "@/types/content";

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

  useEffect(() => {
    if (auth.ready && auth.isAdmin && app.path === "/studio/login") {
      app.navigate("/studio/dashboard");
    }
  }, [auth.ready, auth.isAdmin, app, app.path]);

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

  if (app.path === "/studio/login") {
    return null;
  }

  const parts = app.path.split("/").filter(Boolean);
  const section = parts[1] || "dashboard";
  return (
    <div className="studio-shell">
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
        <article className="continue-card">
          <span className="eyebrow">Continue working</span>
          <div className="big-number">{drafts.length || 3}</div>
          <h2>Drafts need your attention</h2>
          <p>Continue editing and publish when the guidance is ready.</p>
          <button onClick={() => app.navigate("/studio/content")}>View drafts <Icon name="arrow" /></button>
        </article>
        <article>
          <span className="eyebrow">Documentation health</span>
          <div className="health-ring"><strong>86%</strong></div>
          <p>Most published pages include the recommended guidance.</p>
        </article>
        <article>
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
        {[["3 pages", "Missing accessibility guidance"], ["12 assets", "Need alternative text"], ["1 token import", "Ready to review"]].map(([n, t]) => (
          <button key={t}><strong>{n}</strong><span>{t}</span><Icon name="chevron" /></button>
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

  const update = (patch: Partial<ContentPage>) => { setPage((p) => ({ ...p, ...patch })); setSaved(false); };
  const save = async (publish = false) => {
    const next: ContentPage = {
      ...page,
      status: publish ? "published" as const : page.status,
      updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    try {
      await app.upsertPage(next);
      setPage(next);
      setSaved(true);
      pushToast("success", publish ? "Page published." : "Page saved.");
      if (isNew) app.navigate(`/studio/content/${next.id}/edit`);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't save this page.");
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
          <button className="secondary-button" onClick={() => window.open(`/${page.type}s/${page.slug}`, "_blank")}>Preview</button>
          <button className="primary-button" onClick={() => save(true)}>Publish</button>
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
        <button className="secondary-button" onClick={() => save(false)} disabled={saved}>{saved ? "Saved" : "Save draft"}</button>
        <button className="primary-button" onClick={() => save(true)}>Publish page</button>
      </div>
    </div>
  );
}

function SectionProperties({ section, page, setPage, onDelete }: { section: ContentSection; page: ContentPage; setPage: (p: ContentPage) => void; onDelete: () => void }) {
  const update = (patch: Partial<ContentSection>) => setPage({ ...page, sections: page.sections.map((s) => (s.id === section.id ? { ...s, ...patch } : s)) });
  return (
    <div className="properties-form">
      <span className="eyebrow">Section</span>
      <h2>{section.title}</h2>
      <label>Section title<input value={section.title} onChange={(e) => update({ title: e.target.value })} /></label>
      <label>Guidance<textarea rows={8} value={section.body || ""} onChange={(e) => update({ body: e.target.value })} placeholder="Write clear guidance for designers..." /></label>
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
  const id = `section-${Date.now()}`;
  setPage({ ...page, sections: [...page.sections, { id, kind: "rich-text", title: "New section", body: "Add guidance that is easy for designers to understand." }] });
  setSelected(id);
}

function makeNewPageTemplate(): ContentPage {
  const id = `page-${Date.now()}`;
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
  const copy: ContentPage = { ...structuredClone(p), id: `${p.id}-copy-${Date.now()}`, title: `${p.title} copy`, slug: `${p.slug}-copy`, status: "draft" as const };
  try {
    await app.upsertPage(copy);
    pushToast("success", "Page duplicated as draft.");
  } catch (error) {
    pushToast("error", error instanceof Error ? error.message : "We couldn't duplicate this page.");
  }
}

async function archivePage(app: AppContext, p: ContentPage) {
  if (!confirm(`Archive ${p.title}?`)) return;
  try {
    await app.upsertPage({ ...p, status: "archived" });
    pushToast("success", "Page archived.");
  } catch (error) {
    pushToast("error", error instanceof Error ? error.message : "We couldn't archive this page.");
  }
}

function Tokens() {
  const [fileName, setFileName] = useState("token-dari-figma.json");
  const groups = [["Color", "1,664"], ["Dimension", "492"], ["String", "363"], ["Font style", "69"], ["Number", "69"], ["Gradient", "43"], ["Grid", "6"], ["Effect", "5"]];
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
          <button className="active">All tokens <span>2,711</span></button>
          {["Core", "Alias", "Element", "Color", "Typography", "Gradient", "Grid", "Effect"].map((g) => (
            <button key={g}>{g}<Icon name="chevron" /></button>
          ))}
        </aside>
        <section>
          <div className="manager-toolbar">
            <label className="search-field">
              <Icon name="search" />
              <input placeholder="Search token name..." aria-label="Search tokens" />
            </label>
            <button className="secondary-button">Filters</button>
          </div>
          <div className="token-group-grid">
            {groups.map(([n, c]) => (
              <article key={n}>
                <div className={`token-preview token-${n.toLowerCase().replace(" ", "-")}`}>{n.slice(0, 2)}</div>
                <h3>{n}</h3>
                <strong>{c}</strong>
                <p>tokens available</p>
                <button>Explore <Icon name="arrow" /></button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReleasesManager({ app }: { app: AppContext }) {
  const create = async () => {
    const r: Release = {
      id: `r-${Date.now()}`,
      version: "1.1",
      title: "Untitled release",
      summary: "Describe what designers should know about this release.",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: "draft",
      changes: [],
    };
    try {
      await app.upsertRelease(r);
      pushToast("success", "Draft release created.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't create this release.");
    }
  };
  return (
    <div className="studio-page">
      <StudioHeader eyebrow="Releases" title="Changelog" action={<button className="primary-button" onClick={create}><Icon name="plus" />New release</button>} />
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
            <button className="secondary-button" onClick={() => pushToast("info", "Release editing opens here. Update version, summary, and changes.")}>Edit release</button>
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
      await app.setSettings(settings);
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
