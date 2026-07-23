"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppContext } from "@/components/design-system-app";
import { Icon } from "@/components/icons";
import { AssetsManager } from "@/components/assets-manager";
import { AssetPicker, AssetPickerButton } from "@/components/asset-picker";
import { PortalConfigEditor } from "@/components/portal-config-editor";
import { TemplatePicker } from "@/components/template-picker";
import { VisualBlock as VisualBlockRender } from "@/components/visual-block";
import { useAuth } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase-client";
import { pushToast } from "@/lib/toast";
import { makePageFromTemplate } from "@/lib/page-templates";
import { getDefaultPortalConfig } from "@/lib/portal-config";
import { parseTokenLibrary, emptyTokenLibrary, validateTokenStructure, validateTokenAliases, type TokenLibrary } from "@/lib/tokens";
import { getResolvedTokensFromImport, getPublishedTokenImport } from "@/lib/token-resolver";
import type { Asset, AssetTheme, ContentPage, ContentSection, GalleryItem, PageTemplateId, PageType, Release, TokenImport, VisualBlock, VisualBlockKind } from "@/types/content";
import { VISUAL_BLOCK_KINDS_NEW, VISUAL_BLOCK_KIND_LABELS, normalizeVisualBlockKind } from "@/types/content";

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
          : section === "tokens" ? <TokensManager app={app} />
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
  const draftAssets = app.data.assets.filter((a) => a.status === "draft");
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
          <div className="big-number">{app.data.tokenImports.length ? app.data.tokenImports.reduce((sum, imp) => sum + (imp.summary.total || 0), 0).toLocaleString() : "—"}</div>
          <h2>Tokens available</h2>
          <p>{app.data.tokenImports.filter((t) => t.status === "published").length} published versions · {draftAssets.length} draft assets</p>
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
        {[
          [`${drafts.length} pages`, "Draft documentation needs review", "/studio/content"],
          [`${draftAssets.length} assets`, "Draft assets waiting to be published", "/studio/assets"],
          [`${app.data.tokenImports.filter((t) => t.status === "draft").length} token imports`, "Token imports ready to review", "/studio/tokens"],
        ].map(([n, t, href]) => (
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [newFromTemplate, setNewFromTemplate] = useState<ContentPage | null>(null);
  const pageId = parts[2];
  if (pageId === "new") {
    return <PageEditor app={app} initial={newFromTemplate ?? undefined} />;
  }
  if (pageId && parts[3] === "edit") {
    const page = app.data.pages.find((p) => p.id === pageId);
    return page ? <PageEditor app={app} initial={page} /> : <div className="studio-page"><p className="muted-note">Page not found.</p></div>;
  }
  const list = app.data.pages.filter((p) => (type === "all" || p.type === type) && `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="studio-page">
      <StudioHeader eyebrow="Content" title="Documentation" action={<button className="primary-button" onClick={() => setShowTemplates(true)}><Icon name="plus" />New page</button>} />
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

      {showTemplates && (
        <TemplatePicker
          onSelect={(templateId) => {
            const templatedPage = makePageFromTemplate(templateId);
            const id = crypto.randomUUID();
            const newPage: ContentPage = { ...templatedPage, id, slug: `${templatedPage.slug}-${id.slice(0, 8)}` };
            setNewFromTemplate(newPage);
            setShowTemplates(false);
            app.navigate("/studio/content/new");
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}

function PageEditor({ app, initial }: { app: AppContext; initial?: ContentPage }) {
  const isNew = !initial;
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [page, setPage] = useState<ContentPage>(() => {
    if (initial) return structuredClone(initial);
    return makeNewPageTemplate();
  });
  const [selected, setSelected] = useState<string | null>(page.sections[0]?.id || null);
  const [saved, setSaved] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showTemplatesInEditor, setShowTemplatesInEditor] = useState(false);

  const updatePage = (patch: Partial<ContentPage>) => { setPage((p) => ({ ...p, ...patch })); setSaved(false); };
  const markDirty = () => setSaved(false);

  const save = async (publish = false) => {
    if (saving) return;
    setSaving(true);
    const next: ContentPage = {
      ...page,
      status: publish ? "published" as const : page.status === "archived" ? "draft" as const : page.status,
      updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    if (publish) next.status = "published";
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

  const unpublish = async () => {
    setSaving(true);
    try {
      const result = await app.upsertPage({ ...page, status: "draft", updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
      if (!result.ok) throw new Error(result.error ?? "We couldn't unpublish this page.");
      setPage({ ...page, status: "draft" });
      pushToast("success", "Page moved to draft.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't unpublish this page.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!confirm(`Archive ${page.title}? Drafts and archived items never appear in the Portal.`)) return;
    setSaving(true);
    try {
      const result = await app.upsertPage({ ...page, status: "archived", updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
      if (!result.ok) throw new Error(result.error ?? "We couldn't archive this page.");
      pushToast("success", "Page archived.");
      app.navigate("/studio/content");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't archive this page.");
    } finally {
      setSaving(false);
    }
  };

  const section = page.sections.find((s) => s.id === selected);

  const moveSection = (sectionId: string, dir: -1 | 1) => {
    const idx = page.sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const dest = idx + dir;
    if (dest < 0 || dest >= page.sections.length) return;
    const arr = [...page.sections];
    const [removed] = arr.splice(idx, 1);
    arr.splice(dest, 0, removed);
    setPage({ ...page, sections: arr });
    setSaved(false);
  };

  const addSection = (kind?: ContentSection["kind"], title?: string) => {
    const id = `section-${crypto.randomUUID()}`;
    const newSection: ContentSection = {
      id,
      kind: (kind ?? "rich-text") as ContentSection["kind"],
      title: title ?? "New section",
      body: kind === "overview" ? "Explain what this page is about." : "Add clear guidance for designers.",
    };
    setPage({ ...page, sections: [...page.sections, newSection] });
    setSelected(id);
    setSaved(false);
  };

  const addRecommended = (templateId?: PageTemplateId) => {
    if (templateId) {
      const tpl = makePageFromTemplate(templateId);
      setPage({ ...page, sections: tpl.sections });
      setSelected(tpl.sections[0]?.id ?? null);
      setSaved(false);
      return;
    }
    const names = page.type === "component"
      ? ["Overview", "Design preview", "Interactive preview", "Anatomy", "Variants", "Sizes", "States", "Behavior", "Content guidelines", "Responsive behavior", "Accessibility", "Do & don't", "Related components", "Figma resource", "Changelog"]
      : page.type === "pattern"
        ? ["Overview", "Problem and context", "When to use", "When not to use", "User flow", "Component composition", "Behavior", "Responsive behavior", "Edge cases", "Accessibility", "Do & don't", "Related patterns or components", "Figma resource", "Changelog"]
        : page.type === "resource"
          ? ["Overview", "Cover preview", "What's included", "Asset gallery", "Usage guidelines", "Available formats", "Availability", "Download or Open in Figma", "License or restrictions", "Related resources", "Changelog"]
          : ["Overview", "Principles", "Token collection", "Visual reference", "Usage", "Examples", "Accessibility", "Do & don't", "Related foundations", "Figma resource", "Changelog"];
    const sections = names.map((n, i) => ({
      id: `section-${crypto.randomUUID()}`,
      kind: (i === 0 ? "overview" : "rich-text") as ContentSection["kind"],
      title: n,
      body: "Add clear guidance for designers. This placeholder will not appear in production — replace it with real content.",
    }));
    setPage({ ...page, sections });
    setSelected(sections[0]?.id ?? null);
    setSaved(false);
  };

  return (
    <div className="editor-shell">
      <header className="editor-top">
        <div>
          <button onClick={() => app.navigate("/studio/content")}>Content</button>
          <span>/</span>
          <strong>{page.title}</strong>
          <em className={`status ${page.status}`} style={{ marginLeft: 10, fontSize: 10 }}>{page.status}</em>
        </div>
        <div className="save-state">
          <span className={saved ? "saved" : "unsaved"} />
          {saved ? "Saved" : "Unsaved changes"}
        </div>
        <div>
          <button className="secondary-button" onClick={() => setPreviewOpen(true)}><Icon name="layers" />Preview</button>
          <button className="secondary-button" onClick={() => void save(false)} disabled={saved || saving}>{saving ? "Saving..." : saved ? "Saved" : "Save draft"}</button>
          {page.status === "published" ? (
            <button className="secondary-button" onClick={() => void unpublish()} disabled={saving}>Unpublish</button>
          ) : (
            <button className="primary-button" onClick={() => void save(true)} disabled={saving}>{saving ? "Publishing..." : "Publish page"}</button>
          )}
          <button className="text-button" onClick={() => void archive()} disabled={saving} title="Archive"><Icon name="trash" /></button>
        </div>
      </header>
      <aside className="editor-outline">
        <div>
          <span>Page outline</span>
          <button onClick={() => addSection()} aria-label="Add section"><Icon name="plus" /></button>
        </div>
        {page.sections.map((s, i) => (
          <div key={s.id} className={`editor-outline-row ${selected === s.id ? "active" : ""}`}>
            <button className="editor-outline-item" onClick={() => setSelected(s.id)}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s.title}
              <i />
            </button>
            <div className="editor-outline-actions">
              <button onClick={(e) => { e.stopPropagation(); moveSection(s.id, -1); }} title="Move up" aria-label="Move section up"><Icon name="chevron" /></button>
              <button onClick={(e) => { e.stopPropagation(); moveSection(s.id, 1); }} title="Move down" aria-label="Move section down" className="move-down"><Icon name="chevron" /></button>
            </div>
          </div>
        ))}
        {!page.sections.length && (
          <div className="outline-empty">
            <p>No sections yet.</p>
            <button onClick={() => addRecommended()}>Add recommended sections</button>
            <button onClick={() => setShowTemplatesInEditor(true)} className="text-button">Start from a template</button>
          </div>
        )}
        {showTemplatesInEditor && (
          <TemplatePicker
            onSelect={(id) => { addRecommended(id); setShowTemplatesInEditor(false); }}
            onClose={() => setShowTemplatesInEditor(false)}
          />
        )}
      </aside>
      <main className="editor-canvas">
        <div className="editable-header">
          <span className="eyebrow">{page.category}</span>
          <input className="title-input" value={page.title} onChange={(e) => updatePage({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} placeholder="Page title" />
          <textarea value={page.summary} onChange={(e) => updatePage({ summary: e.target.value })} placeholder="Short summary that helps designers decide whether this page answers their question." />
          <div className="meta-row"><span className="status-dot" />{page.maturity}<span>v{page.version}</span></div>
          <div className="page-meta-bar">
            <button className="secondary-button small" onClick={() => setShowCoverPicker(true)}>
              <Icon name="image" /> {page.coverAssetId ? "Change cover visual" : "Select cover visual"}
            </button>
            {page.coverAssetId && (
              <span className="muted-note">
                <AssetPickerButton assetId={page.coverAssetId} assets={app.data.assets} onOpen={() => setShowCoverPicker(true)} label="Select cover visual" />
                <button className="text-button small" onClick={() => updatePage({ coverAssetId: undefined })}><Icon name="close" /> Remove</button>
              </span>
            )}
          </div>
        </div>
        {page.sections.map((s) => (
          <button className={`editable-block ${selected === s.id ? "selected" : ""}`} key={s.id} onClick={() => setSelected(s.id)}>
            <span className="drag-handle">⋮⋮</span>
            <span className="block-type">{s.kind}</span>
            <h2>{s.title}</h2>
            {s.body && <p>{s.body}</p>}
            {s.items && <div className="mini-item-grid">{s.items.map((it) => <span key={it.title}>{it.title}</span>)}</div>}
            {s.visualBlocks?.length ? <div className="mini-visual-count">{s.visualBlocks.length} visual block{s.visualBlocks.length === 1 ? "" : "s"}</div> : null}
          </button>
        ))}
        <div className="editor-add-actions">
          <button className="add-block" onClick={() => addSection()}><Icon name="plus" />Add a section</button>
          <button className="text-button" onClick={() => addRecommended()}><Icon name="layers" />Add recommended sections</button>
        </div>
      </main>
      <aside className="editor-properties">
        {section ? (
          <SectionProperties
            section={section}
            page={page}
            setPage={(p) => { setPage(p); setSaved(false); }}
            onDelete={() => {
              const nextSections = page.sections.filter((s) => s.id !== section.id);
              setPage({ ...page, sections: nextSections });
              setSaved(false);
              setSelected(nextSections[0]?.id ?? null);
            }}
            markDirty={markDirty}
            assets={app.data.assets}
            tokenImports={app.data.tokenImports}
          />
        ) : (
          <PageProperties page={page} update={updatePage} assets={app.data.assets} />
        )}

        {showRawJson && (
          <div className="raw-json-panel">
            <span className="eyebrow">Details — JSON</span>
            <textarea
              rows={22}
              value={rawJsonText || JSON.stringify(page, null, 2)}
              onChange={(e) => setRawJsonText(e.target.value)}
              aria-label="Raw page JSON"
            />
            <div className="raw-json-actions">
              <button className="secondary-button" onClick={() => setRawJsonText(JSON.stringify(page, null, 2))}>Reset</button>
              <button className="primary-button" onClick={() => {
                try {
                  const parsed = JSON.parse(rawJsonText) as ContentPage;
                  if (!parsed.id || !parsed.title || !Array.isArray(parsed.sections)) throw new Error("Page must have id, title, and sections array");
                  setPage(parsed);
                  setSaved(false);
                  pushToast("success", "Page updated from JSON. Save to persist.");
                } catch (e) {
                  pushToast("error", e instanceof Error ? e.message : "Invalid JSON");
                }
              }}>Apply</button>
            </div>
          </div>
        )}
        <div className="properties-footer">
          <button className="text-button small" onClick={() => { setRawJsonText(JSON.stringify(page, null, 2)); setShowRawJson(!showRawJson); }}>
            {showRawJson ? "Hide details" : "Show details (JSON)"}
          </button>
        </div>
      </aside>
      <div className="editor-save-bar">
        <button className="secondary-button" onClick={() => void save(false)} disabled={saved || saving}>{saving ? "Saving..." : saved ? "Saved" : "Save draft"}</button>
        <button className="primary-button" onClick={() => void save(true)} disabled={saving}>{saving ? "Publishing..." : "Publish page"}</button>
      </div>

      {showCoverPicker && (
        <AssetPicker
          assets={app.data.assets}
          onSelect={(asset) => { updatePage({ coverAssetId: asset.id }); setShowCoverPicker(false); }}
          onClose={() => setShowCoverPicker(false)}
          selectedId={page.coverAssetId}
          title="Choose cover visual"
          allowClear
          onClear={() => { updatePage({ coverAssetId: undefined }); setShowCoverPicker(false); }}
        />
      )}

      {previewOpen && (
        <PortalPreviewDrawer page={page} assets={app.data.assets} tokenImports={app.data.tokenImports} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}

function SectionProperties({
  section,
  page,
  setPage,
  onDelete,
  markDirty,
  assets,
  tokenImports,
}: {
  section: ContentSection;
  page: ContentPage;
  setPage: (p: ContentPage) => void;
  onDelete: () => void;
  markDirty: () => void;
  assets: Asset[];
  tokenImports: TokenImport[];
}) {
  const update = (patch: Partial<ContentSection>) => { setPage({ ...page, sections: page.sections.map((s) => (s.id === section.id ? { ...s, ...patch } : s)) }); markDirty(); };

  const addVisualBlock = (kind: VisualBlockKind) => {
    const normalized = normalizeVisualBlockKind(kind);
    const block: VisualBlock = { id: crypto.randomUUID(), kind: normalized as VisualBlockKind, label: "", items: kind.endsWith("gallery") || kind === "anatomy" || kind === "do-dont" || kind === "flow-diagram" ? [] : undefined };
    update({ visualBlocks: [...(section.visualBlocks ?? []), block] });
  };

  const duplicateBlock = (blockId: string) => {
    const blocks = section.visualBlocks ?? [];
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const copy = { ...structuredClone(blocks[idx]), id: crypto.randomUUID() };
    const next = [...blocks.slice(0, idx + 1), copy, ...blocks.slice(idx + 1)];
    update({ visualBlocks: next });
  };

  const reorderBlock = (blockId: string, dir: -1 | 1) => {
    const blocks = [...(section.visualBlocks ?? [])];
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const dest = idx + dir;
    if (dest < 0 || dest >= blocks.length) return;
    const [removed] = blocks.splice(idx, 1);
    blocks.splice(dest, 0, removed);
    update({ visualBlocks: blocks });
  };

  const updateVisualBlock = (id: string, patch: Partial<VisualBlock>) => {
    update({ visualBlocks: section.visualBlocks?.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  };

  const removeVisualBlock = (id: string) => {
    update({ visualBlocks: section.visualBlocks?.filter((b) => b.id !== id) });
  };

  const addGalleryItem = (blockId: string) => {
    const block = section.visualBlocks?.find((b) => b.id === blockId);
    if (!block) return;
    const item: GalleryItem = { id: crypto.randomUUID(), name: "New item", description: "", order: (block.items?.length ?? 0) };
    updateVisualBlock(blockId, { items: [...(block.items ?? []), item] });
  };

  const updateGalleryItem = (blockId: string, itemId: string, patch: Partial<GalleryItem>) => {
    const block = section.visualBlocks?.find((b) => b.id === blockId);
    if (!block) return;
    updateVisualBlock(blockId, { items: block.items?.map((it) => it.id === itemId ? { ...it, ...patch } : it) });
  };

  const removeGalleryItem = (blockId: string, itemId: string) => {
    const block = section.visualBlocks?.find((b) => b.id === blockId);
    if (!block) return;
    updateVisualBlock(blockId, { items: block.items?.filter((it) => it.id !== itemId) });
  };

  const reorderGalleryItem = (blockId: string, itemId: string, dir: -1 | 1) => {
    const block = section.visualBlocks?.find((b) => b.id === blockId);
    if (!block?.items) return;
    const idx = block.items.findIndex((it) => it.id === itemId);
    if (idx === -1) return;
    const dest = idx + dir;
    if (dest < 0 || dest >= block.items.length) return;
    const arr = [...block.items];
    const [removed] = arr.splice(idx, 1);
    arr.splice(dest, 0, removed);
    updateVisualBlock(blockId, { items: arr });
  };

  const publishedTokens = getPublishedTokenImport(tokenImports);
  const resolvedTokens = useMemo(() => (publishedTokens ? getResolvedTokensFromImport(publishedTokens) : []), [publishedTokens]);

  return (
    <div className="properties-form">
      <span className="eyebrow">Section</span>
      <h2>{section.title}</h2>
      <label>Section title<input value={section.title} onChange={(e) => update({ title: e.target.value })} /></label>
      <label>Section type
        <select value={section.kind} onChange={(e) => update({ kind: e.target.value as ContentSection["kind"] })}>
          <option value="overview">Overview</option>
          <option value="preview">Preview</option>
          <option value="anatomy">Anatomy</option>
          <option value="variants">Variants</option>
          <option value="sizes">Sizes</option>
          <option value="states">States</option>
          <option value="behavior">Behavior</option>
          <option value="content">Content guidelines</option>
          <option value="responsive">Responsive behavior</option>
          <option value="accessibility">Accessibility</option>
          <option value="do-dont">Do and don&apos;t</option>
          <option value="tokens">Token collection</option>
          <option value="related">Related</option>
          <option value="figma">Figma resource</option>
          <option value="changelog">Changelog</option>
          <option value="rich-text">Rich text</option>
        </select>
      </label>
      <label>Guidance<textarea rows={8} value={section.body || ""} onChange={(e) => update({ body: e.target.value })} placeholder="Write clear guidance for designers..." /></label>

      <div className="property-group">
        <div className="property-group-head">
          <span>Visual blocks</span>
          <small className="muted-note">{(section.visualBlocks?.length ?? 0)} block{(section.visualBlocks?.length ?? 0) === 1 ? "" : "s"}</small>
        </div>
        {section.visualBlocks?.map((block) => {
          const normalized = normalizeVisualBlockKind(block.kind);
          return (
            <VisualBlockEditor
              key={block.id}
              block={block}
              normalized={normalized}
              assets={assets}
              onUpdate={(patch) => updateVisualBlock(block.id, patch)}
              onDuplicate={() => duplicateBlock(block.id)}
              onRemove={() => removeVisualBlock(block.id)}
              onReorder={(dir) => reorderBlock(block.id, dir)}
              onAddItem={() => addGalleryItem(block.id)}
              onUpdateItem={(itemId, patch) => updateGalleryItem(block.id, itemId, patch)}
              onRemoveItem={(itemId) => removeGalleryItem(block.id, itemId)}
              onReorderItem={(itemId, dir) => reorderGalleryItem(block.id, itemId, dir)}
              resolvedTokens={resolvedTokens}
              publishedTokenImport={publishedTokens}
              tokenImports={tokenImports}
            />
          );
        })}
        <div className="add-visual-block-group">
          <span>Add visual block</span>
          <div className="visual-block-type-grid">
            {VISUAL_BLOCK_KINDS_NEW.map((kind) => (
              <button key={kind} className="visual-block-type-btn" onClick={() => addVisualBlock(kind)}>
                {VISUAL_BLOCK_KIND_LABELS[kind]}
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
        <p>Cover visuals and block previews use real uploaded assets. Preview in Studio to check how they look on Portal.</p>
      </div>
      <button className="danger-button" onClick={onDelete}><Icon name="trash" />Remove section</button>
    </div>
  );
}

function VisualBlockEditor({
  block,
  normalized,
  assets,
  onUpdate,
  onDuplicate,
  onRemove,
  onReorder,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onReorderItem,
  resolvedTokens,
}: {
  block: VisualBlock;
  normalized: string;
  assets: Asset[];
  onUpdate: (patch: Partial<VisualBlock>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onReorder: (dir: -1 | 1) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<GalleryItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItem: (itemId: string, dir: -1 | 1) => void;
  resolvedTokens: { path: string; type: string; value: unknown; description?: string; ref?: string; resolvedValue: unknown }[];
  publishedTokenImport?: TokenImport | null;
  tokenImports: TokenImport[];
}) {
  const [pickAssetForBlock, setPickAssetForBlock] = useState(false);
  const [pickAssetForItem, setPickAssetForItem] = useState<string | null>(null);
  const kindLabel = VISUAL_BLOCK_KIND_LABELS[block.kind as keyof typeof VISUAL_BLOCK_KIND_LABELS] ?? normalized;

  const isGalleryKind = ["asset-gallery", "variant-gallery", "state-gallery", "anatomy", "do-dont", "flow-diagram", "typography-specimen", "spacing-specimen", "icon-construction"].includes(normalized);
  const isSingleAssetKind = ["design-preview"].includes(normalized);
  const isTokenKind = normalized === "token-reference";
  const isInteractiveKind = normalized === "interactive-preview";

  const selectedAssetId = block.assetId;
  const items = block.items ?? [];

  return (
    <div className="visual-block-editor">
      <div className="visual-block-editor-head">
        <select value={block.kind} onChange={(e) => onUpdate({ kind: e.target.value as VisualBlock["kind"] })}>
          {VISUAL_BLOCK_KINDS_NEW.map((k) => <option key={k} value={k}>{VISUAL_BLOCK_KIND_LABELS[k]}</option>)}
        </select>
        <div className="visual-block-editor-actions">
          <button className="text-button small" onClick={() => onReorder(-1)} title="Move up"><Icon name="chevron" /></button>
          <button className="text-button small" onClick={() => onReorder(1)} title="Move down" style={{ transform: "rotate(180deg)" }}><Icon name="chevron" /></button>
          <button className="text-button small" onClick={onDuplicate} title="Duplicate"><Icon name="copy" /></button>
          <button className="danger-button small" onClick={onRemove}><Icon name="trash" /></button>
        </div>
      </div>
      <small className="muted-note">{kindLabel}</small>
      <input value={block.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="Block label" aria-label="Visual block label" />
      <input value={block.caption ?? ""} onChange={(e) => onUpdate({ caption: e.target.value || undefined })} placeholder="Caption" aria-label="Caption" />
      <input value={block.altText ?? ""} onChange={(e) => onUpdate({ altText: e.target.value || undefined })} placeholder="Alternative text" aria-label="Alternative text" />

      {isSingleAssetKind && (
        <>
          <AssetPickerButton assetId={selectedAssetId} assets={assets} onOpen={() => setPickAssetForBlock(true)} label="Select visual" />
          {selectedAssetId && <button className="text-button small" onClick={() => onUpdate({ assetId: undefined })}><Icon name="close" /> Remove asset</button>}
          <div className="visual-block-extra-fields">
            <input value={block.variant ?? ""} onChange={(e) => onUpdate({ variant: e.target.value || undefined })} placeholder="Variant (e.g. Primary)" />
            <input value={block.size ?? ""} onChange={(e) => onUpdate({ size: e.target.value || undefined })} placeholder="Size (e.g. Medium)" />
            <input value={block.state ?? ""} onChange={(e) => onUpdate({ state: e.target.value || undefined })} placeholder="State (e.g. Default)" />
            <select value={block.theme ?? "both"} onChange={(e) => onUpdate({ theme: e.target.value as AssetTheme })}>
              <option value="both">Theme: both</option>
              <option value="light">Theme: light</option>
              <option value="dark">Theme: dark</option>
            </select>
            <input value={block.figmaUrl ?? ""} onChange={(e) => onUpdate({ figmaUrl: e.target.value || undefined })} placeholder="Figma URL" />
            <label className="inline-check"><input type="checkbox" checked={block.downloadEnabled ?? true} onChange={(e) => onUpdate({ downloadEnabled: e.target.checked })} /> Allow download</label>
          </div>
        </>
      )}

      {isInteractiveKind && (
        <div className="visual-block-extra-fields">
          <input value={block.componentSlug ?? ""} onChange={(e) => onUpdate({ componentSlug: e.target.value || undefined })} placeholder="Component slug (button, input, card)" />
          <input value={block.variant ?? ""} onChange={(e) => onUpdate({ variant: e.target.value || undefined })} placeholder="Variant" />
          <input value={block.size ?? ""} onChange={(e) => onUpdate({ size: e.target.value || undefined })} placeholder="Size" />
          <input value={block.state ?? ""} onChange={(e) => onUpdate({ state: e.target.value || undefined })} placeholder="State" />
          <input value={block.iconName ?? ""} onChange={(e) => onUpdate({ iconName: e.target.value || undefined })} placeholder="Icon name" />
          <label className="inline-check"><input type="checkbox" checked={Boolean(block.disabled)} onChange={(e) => onUpdate({ disabled: e.target.checked })} /> Disabled</label>
          <label className="inline-check"><input type="checkbox" checked={Boolean(block.loading)} onChange={(e) => onUpdate({ loading: e.target.checked })} /> Loading</label>
        </div>
      )}

      {isTokenKind && (
        <div className="token-reference-editor">
          <small className="muted-note">Select tokens from published library — never type values manually.</small>
          {resolvedTokens.length === 0 ? (
            <p className="muted-note">No published token version available. Import and publish tokens first.</p>
          ) : (
            <>
              <div className="token-picker-list">
                {resolvedTokens.slice(0, 100).map((t) => (
                  <label key={t.path} className="token-picker-check">
                    <input
                      type="checkbox"
                      checked={block.tokenNames?.includes(t.path) ?? false}
                      onChange={(e) => {
                        const existing = block.tokenNames ?? [];
                        onUpdate({ tokenNames: e.target.checked ? [...existing, t.path] : existing.filter((p) => p !== t.path) });
                      }}
                    />
                    <span className="token-picker-name">{t.path}</span>
                    <small>{typeof t.resolvedValue === "string" ? t.resolvedValue : ""}</small>
                  </label>
                ))}
                {resolvedTokens.length > 100 && <small className="muted-note">Showing first 100 tokens. Search or refine your selection.</small>}
              </div>
              {block.tokenNames?.length ? <small className="muted-note">{block.tokenNames.length} token{block.tokenNames.length === 1 ? "" : "s"} selected</small> : null}
            </>
          )}
        </div>
      )}

      {isGalleryKind && (
        <div className="gallery-items-editor">
          <span className="muted-note">{items.length} item{items.length === 1 ? "" : "s"}</span>
          {items.map((item, idx) => (
            <div key={item.id} className="gallery-item-editor">
              <div className="gallery-item-head">
                <span>{idx + 1}</span>
                <input value={item.name ?? item.title ?? ""} onChange={(e) => onUpdateItem(item.id, { name: e.target.value, title: e.target.value })} placeholder="Item title / variant / state name" />
                <button className="text-button small" onClick={() => onReorderItem(item.id, -1)}><Icon name="chevron" /></button>
                <button className="text-button small" onClick={() => onReorderItem(item.id, 1)} style={{ transform: "rotate(180deg)" }}><Icon name="chevron" /></button>
                <button className="danger-button small" onClick={() => onRemoveItem(item.id)}><Icon name="trash" /></button>
              </div>
              <textarea rows={2} value={item.description ?? ""} onChange={(e) => onUpdateItem(item.id, { description: e.target.value })} placeholder="Description" />
              <input value={item.caption ?? ""} onChange={(e) => onUpdateItem(item.id, { caption: e.target.value })} placeholder="Caption" />
              <input value={item.figmaUrl ?? ""} onChange={(e) => onUpdateItem(item.id, { figmaUrl: e.target.value })} placeholder="Figma URL" />
              <input value={item.altText ?? ""} onChange={(e) => onUpdateItem(item.id, { altText: e.target.value })} placeholder="Alternative text" />
              <AssetPickerButton assetId={item.assetId} assets={assets} onOpen={() => setPickAssetForItem(item.id)} label="Select visual" />
              {item.assetId && <button className="text-button small" onClick={() => onUpdateItem(item.id, { assetId: undefined })}><Icon name="close" /> Remove visual</button>}

              {pickAssetForItem === item.id && (
                <AssetPicker
                  assets={assets}
                  onSelect={(asset) => { onUpdateItem(item.id, { assetId: asset.id }); setPickAssetForItem(null); }}
                  onClose={() => setPickAssetForItem(null)}
                  selectedId={item.assetId}
                  title="Choose visual for item"
                  allowClear
                  onClear={() => { onUpdateItem(item.id, { assetId: undefined }); setPickAssetForItem(null); }}
                />
              )}
            </div>
          ))}
          <button className="secondary-button small" onClick={onAddItem}><Icon name="plus" />Add item</button>
        </div>
      )}

      {!isGalleryKind && !isTokenKind && !isSingleAssetKind && !isInteractiveKind && (
        <p className="muted-note">Add label and caption for this block. Use gallery blocks for multiple visuals.</p>
      )}

      {pickAssetForBlock && (
        <AssetPicker
          assets={assets}
          onSelect={(asset) => { onUpdate({ assetId: asset.id }); setPickAssetForBlock(false); }}
          onClose={() => setPickAssetForBlock(false)}
          selectedId={selectedAssetId}
          title={`Choose visual for ${kindLabel}`}
          allowClear
          onClear={() => { onUpdate({ assetId: undefined }); setPickAssetForBlock(false); }}
        />
      )}
    </div>
  );
}

function PageProperties({ page, update, assets }: { page: ContentPage; update: (p: Partial<ContentPage>) => void; assets: Asset[] }) {
  const coverAsset = assets.find((a) => a.id === page.coverAssetId);
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
          <option value="design">Design</option>
        </select>
      </label>
      <label>Category<input value={page.category} onChange={(e) => update({ category: e.target.value })} /></label>
      <label>Owner<input value={page.owner} onChange={(e) => update({ owner: e.target.value })} /></label>
      <label>Version<input value={page.version} onChange={(e) => update({ version: e.target.value })} /></label>
      <label>Figma URL<input value={page.figmaUrl ?? ""} onChange={(e) => update({ figmaUrl: e.target.value || undefined })} placeholder="https://www.figma.com/file/..." /></label>
      <label className="inline-check"><input type="checkbox" checked={Boolean(page.featured)} onChange={(e) => update({ featured: e.target.checked })} /> Featured on homepage</label>
      <label>Cover visual
        {coverAsset ? (
          <span className="muted-note">Selected: {coverAsset.name} · {coverAsset.status}</span>
        ) : <span className="muted-note">No cover selected — page will show neutral state</span>}
      </label>
    </div>
  );
}

function PortalPreviewDrawer({ page, assets, tokenImports, onClose }: { page: ContentPage; assets: Asset[]; tokenImports: TokenImport[]; onClose: () => void }) {
  const publishedTokens = getPublishedTokenImport(tokenImports);
  const resolvedTokens = useMemo(() => getResolvedTokensFromImport(publishedTokens), [publishedTokens]);
  return (
    <div className="drawer-backdrop portal-preview-backdrop" onClick={onClose}>
      <aside className="portal-preview-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Preview">
        <header className="studio-header" style={{ marginBottom: 16 }}>
          <div>
            <span className="eyebrow">Preview — {page.status}</span>
            <h2>{page.title}</h2>
            <p className="muted-note">How this page will appear in the Portal. Drafts never appear in Portal — this preview uses admin assets.</p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close preview"><Icon name="close" /></button>
        </header>
        <div className="portal-preview-content">
          {page.coverAssetId && (
            <div className="portal-preview-cover">
              {(() => {
                const cov = assets.find((a) => a.id === page.coverAssetId);
                if (!cov?.fileUrl) return <div className="asset-unavailable small"><Icon name="image" /><span>Cover: no file yet</span></div>;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cov.fileUrl} alt={cov.altText || cov.name} />
                );
              })()}
            </div>
          )}
          {page.sections.map((section) => (
            <section key={section.id} className="doc-section">
              <h3>{section.title}</h3>
              {section.body && <p>{section.body}</p>}
              {section.items && (
                <div className="guidance-grid">
                  {section.items.map((item) => (
                    <article key={item.title}><h4>{item.title}</h4><p>{item.description}</p></article>
                  ))}
                </div>
              )}
              {section.visualBlocks?.map((block) => (
                <VisualBlockRender key={block.id} block={block} assets={assets} resolvedTokens={resolvedTokens} activeTokenImport={publishedTokens} />
              ))}
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

function makeNewPageTemplate(): ContentPage {
  const id = crypto.randomUUID();
  return {
    id,
    type: "component" as PageType,
    title: "Untitled component",
    slug: `untitled-component-${id.slice(0, 8)}`,
    summary: "Describe the purpose and when to use this component.",
    category: "General",
    status: "draft" as const,
    maturity: "experimental" as const,
    version: "1.0",
    owner: "Design System Team",
    updatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    sections: [],
  };
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

// ─────────────────────────────────────────────────────────────
// Tokens — Supabase-backed import flow
// ─────────────────────────────────────────────────────────────

function TokensManager({ app }: { app: AppContext }) {
  const [selectedGroup, setSelectedGroup] = useState("All tokens");
  const [query, setQuery] = useState("");
  const [libraryPreview, setLibraryPreview] = useState<TokenLibrary | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [pendingImport, setPendingImport] = useState<TokenImport | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importBroken, setImportBroken] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<TokenLibrary | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published" | "archived">("all");

  useEffect(() => {
    if (libraryPreview) return;
    fetch("/token-dari-figma.json")
      .then((res) => res.json())
      .then((parsed) => {
        try {
          const lib = parseTokenLibrary(parsed, "token-dari-figma.json");
          setLibraryPreview(lib);
          setPreviewName("token-dari-figma.json");
        } catch {
          setLibraryPreview(emptyTokenLibrary("token-dari-figma.json"));
        }
      })
      .catch(() => {
        setLibraryPreview(emptyTokenLibrary("token-dari-figma.json"));
      });
  }, [libraryPreview]);

  const handleFileImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const structValid = validateTokenStructure(parsed);
      if (!structValid.ok) {
        setImportErrors(structValid.errors);
        setImportBroken([]);
        setImportSummary(null);
        setPendingImport(null);
        pushToast("warning", structValid.errors[0]);
        return;
      }
      const lib = parseTokenLibrary(parsed, file.name);
      const aliasValid = validateTokenAliases(parsed);
      setImportSummary(lib);
      setImportErrors(aliasValid.errors);
      setImportBroken(aliasValid.brokenAliases);
      setPreviewName(file.name);
      setLibraryPreview(lib);

      const summary = {
        fileName: file.name,
        total: lib.total,
        references: lib.references,
        uniqueReferences: lib.uniqueReferences,
        withDescription: lib.withDescription,
        groups: lib.groups,
      };
      const newImport: TokenImport = {
        id: crypto.randomUUID(),
        fileName: file.name,
        sourceJson: parsed,
        summary,
        status: "draft",
        createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        publishedAt: null,
        validationErrors: aliasValid.errors,
        validationBrokenAliases: aliasValid.brokenAliases,
      };
      setPendingImport(newImport);
      if (!aliasValid.ok) {
        pushToast("warning", `${aliasValid.brokenAliases.length} broken alias${aliasValid.brokenAliases.length === 1 ? "" : "es"} found — fix in Figma before publishing.`);
      } else {
        pushToast("info", `Import ready — ${lib.total.toLocaleString()} tokens · ${lib.groups.length} groups`);
      }
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : "Could not parse token JSON"]);
      pushToast("error", error instanceof Error ? error.message : "Could not parse token JSON. Check the file format.");
    }
  };

  const saveDraft = async () => {
    if (!pendingImport) return;
    setSaving(true);
    try {
      const result = await app.upsertTokenImport(pendingImport);
      if (!result.ok) throw new Error(result.error ?? "We couldn't save this token import.");
      pushToast("success", "Token import saved as draft.");
      setPendingImport(null);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't save this token import.");
    } finally {
      setSaving(false);
    }
  };

  const publishImport = async (imp: TokenImport) => {
    // Validate alias chain before allowing publish
    const aliasValid = validateTokenAliases(imp.sourceJson);
    if (!aliasValid.ok) {
      pushToast("error", `Cannot publish — ${aliasValid.brokenAliases.length} broken alias${aliasValid.brokenAliases.length === 1 ? "" : "es"}. Fix in Figma first.`);
      return;
    }
    setSaving(true);
    try {
      const result = await app.upsertTokenImport({ ...imp, status: "published", publishedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) });
      if (!result.ok) throw new Error(result.error ?? "We couldn't publish this token import.");
      pushToast("success", "Token version published. Portal now uses this version.");
      setPendingImport(null);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't publish this token import.");
    } finally {
      setSaving(false);
    }
  };

  const unpublishImport = async (imp: TokenImport) => {
    setSaving(true);
    try {
      const result = await app.upsertTokenImport({ ...imp, status: "draft", publishedAt: null });
      if (!result.ok) throw new Error(result.error ?? "We couldn't unpublish this token import.");
      pushToast("success", "Token version moved to draft.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't unpublish this token import.");
    } finally {
      setSaving(false);
    }
  };

  const archiveImport = async (imp: TokenImport) => {
    if (!confirm(`Archive token import ${imp.fileName}?`)) return;
    setSaving(true);
    try {
      const result = await app.upsertTokenImport({ ...imp, status: "archived" });
      if (!result.ok) throw new Error(result.error ?? "We couldn't archive this token import.");
      pushToast("success", "Token import archived.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't archive this token import.");
    } finally {
      setSaving(false);
    }
  };

  const deleteImport = async (imp: TokenImport) => {
    if (!confirm(`Delete token import ${imp.fileName}? This removes the record permanently.`)) return;
    setSaving(true);
    try {
      const result = await app.removeTokenImport(imp.id);
      if (!result.ok) throw new Error(result.error ?? "We couldn't delete this token import.");
      pushToast("success", "Token import deleted.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "We couldn't delete this token import.");
    } finally {
      setSaving(false);
    }
  };

  const filteredImports = app.data.tokenImports.filter((t) => filterStatus === "all" || t.status === filterStatus);
  const lib = libraryPreview ?? emptyTokenLibrary(previewName);
  const visibleGroups = lib.groups
    .filter((g) => selectedGroup === "All tokens" || g.name === selectedGroup)
    .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="studio-page">
      <StudioHeader
        eyebrow="Tokens"
        title="Token library"
        action={
          <label className="primary-button">
            <Icon name="upload" />Import JSON
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileImport(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
        }
      />

      {pendingImport && (
        <div className="token-import-review" role="region" aria-label="Import review">
          <h3>Review import</h3>
          <p className="muted-note">Original file is never edited inside CMS. Fix broken aliases in Figma and re-import.</p>
          <dl>
            <div><dt>File</dt><dd>{pendingImport.fileName}</dd></div>
            <div><dt>Total tokens</dt><dd>{importSummary?.total.toLocaleString()}</dd></div>
            <div><dt>Groups</dt><dd>{importSummary?.groups.length}</dd></div>
            <div><dt>References</dt><dd>{importSummary?.references}</dd></div>
            <div><dt>With description</dt><dd>{importSummary?.withDescription}</dd></div>
          </dl>
          {importBroken.length > 0 && (
            <div className="form-error">
              <strong>Broken aliases ({importBroken.length})</strong>
              <ul>{importBroken.slice(0, 10).map((b) => <li key={b}>{b}</li>)}</ul>
              {importErrors.length > 0 && <small>{importErrors[0]}</small>}
            </div>
          )}
          {!importBroken.length && <p className="form-success" role="status">No broken aliases — ready to save as draft.</p>}
          <div className="token-import-actions">
            <button className="secondary-button" onClick={saveDraft} disabled={saving}>Save as draft in Supabase</button>
            <button className="primary-button" onClick={() => saving || pendingImport && publishImport(pendingImport)} disabled={saving || importBroken.length > 0}>Save and publish</button>
            <button className="text-button" onClick={() => { setPendingImport(null); setImportErrors([]); setImportBroken([]); }}>Cancel</button>
          </div>
        </div>
      )}

      <section className="token-summary">
        <article><span>Active source</span><h2>{lib.fileName || previewName || "No file"}</h2><p>Figma Design Tokens format</p><em className="status published">Preview</em></article>
        <article><span>Total tokens</span><strong>{lib.total.toLocaleString()}</strong><p>Across {lib.groups.length} collections</p></article>
        <article><span>References</span><strong>{lib.references.toLocaleString()}</strong><p>{lib.uniqueReferences} unique references</p></article>
        <article><span>Descriptions</span><strong>{lib.withDescription.toLocaleString()}</strong><p>{(lib.total - lib.withDescription).toLocaleString()} still need guidance</p></article>
      </section>

      <div className="token-filter-bar">
        <span>Status:</span>
        {(["all", "draft", "published", "archived"] as const).map((s) => (
          <button key={s} className={filterStatus === s ? "active" : ""} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
        <span style={{ marginLeft: 12 }}>{filteredImports.length} import{filteredImports.length === 1 ? "" : "s"}</span>
      </div>

      {filteredImports.length > 0 && (
        <div className="token-imports-table-wrap">
          <table className="token-imports-table">
            <thead><tr><th>File</th><th>Total</th><th>Status</th><th>Published</th><th>Broken aliases</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredImports.map((imp) => (
                <tr key={imp.id}>
                  <td>{imp.fileName}</td>
                  <td>{imp.summary.total}</td>
                  <td><em className={`status ${imp.status}`}>{imp.status}</em></td>
                  <td>{imp.publishedAt ?? "—"}</td>
                  <td>{imp.validationBrokenAliases.length ? <span className="form-error">{imp.validationBrokenAliases.length} broken</span> : <span className="form-success">OK</span>}</td>
                  <td>
                    <div className="token-row-actions">
                      {imp.status === "draft" && <button className="primary-button small" onClick={() => publishImport(imp)} disabled={saving || imp.validationBrokenAliases.length > 0}>Publish</button>}
                      {imp.status === "published" && <button className="secondary-button small" onClick={() => unpublishImport(imp)} disabled={saving}>Unpublish</button>}
                      <button className="secondary-button small" onClick={() => archiveImport(imp)} disabled={saving}>Archive</button>
                      <button className="danger-button small" onClick={() => deleteImport(imp)} disabled={saving}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="token-workspace">
        <aside>
           <button className={selectedGroup === "All tokens" ? "active" : ""} onClick={() => setSelectedGroup("All tokens")}>All tokens <span>{lib.total.toLocaleString()}</span></button>
           {lib.groups.slice(0, 8).map((g) => (
             <button key={g.name} className={selectedGroup === g.name ? "active" : ""} onClick={() => setSelectedGroup(g.name)}>{g.name}<Icon name="chevron" /></button>
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
             {visibleGroups.map((g) => (
              <article key={g.name}>
                <div className={`token-preview token-${g.name.toLowerCase().replace(/\s+/g, "-")}`}>{g.name.slice(0, 2)}</div>
                <h3>{g.name}</h3>
                <strong>{g.count.toLocaleString()}</strong>
                <p>tokens available</p>
                 <button onClick={() => setSelectedGroup(g.name)}>Explore <Icon name="arrow" /></button>
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
  const [portalConfig, setPortalConfig] = useState(() => {
    if (app.data.settings.portal) return app.data.settings.portal;
    // seed from empty config
    return getDefaultPortalConfig();
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("General");

  const save = async () => {
    setSaving(true);
    try {
      const result = await app.setSettings({ ...settings, portal: portalConfig, seo: { title: settings.seo?.title ?? "", description: settings.seo?.description ?? "" } });
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
          {["General", "Branding", "Navigation", "Templates", "Administrator", "Visibility", "Backup & export", "Audit log"].map((x) => (
            <button className={activeSection === x ? "active" : ""} key={x} onClick={() => setActiveSection(x)}>{x}</button>
          ))}
        </aside>
        <section>
          <h2>{activeSection}</h2>
          {activeSection === "General" && (
            <>
              <p>Set the identity that appears across the portal.</p>
              <div className="properties-form">
                <label>Design system name<input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></label>
                <label>Hero statement<input value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} /></label>
                <label>Description<textarea rows={5} value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></label>
                <label>SEO title<input value={settings.seo?.title ?? ""} onChange={(e) => setSettings({ ...settings, seo: { title: e.target.value, description: settings.seo?.description ?? "" } })} /></label>
                <label>SEO description<textarea rows={3} value={settings.seo?.description ?? ""} onChange={(e) => setSettings({ ...settings, seo: { title: settings.seo?.title ?? "", description: e.target.value } })} /></label>
                <label>Portal visibility
                  <select value={settings.visibility} onChange={(e) => setSettings({ ...settings, visibility: e.target.value as "public" | "unlisted" })}>
                    <option value="unlisted">Unlisted — no login, no search indexing</option>
                    <option value="public">Public</option>
                  </select>
                </label>
                <button className="primary-button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save general settings"}</button>
              </div>
            </>
          )}
          {activeSection === "Branding" && (
            <div className="portal-config-tab-wrapper">
              <p className="muted-note">Configure navigation, homepage, collections, resource cards, footer, and public messages using the structured form. The JSON details view is for administrators only.</p>
              <PortalConfigEditor config={portalConfig} assets={app.data.assets} onChange={(next) => setPortalConfig(next)} />
              <div style={{ marginTop: 24 }}>
                <button className="primary-button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save portal configuration"}</button>
              </div>
            </div>
          )}
          {activeSection !== "General" && activeSection !== "Branding" && (
            <p className="muted-note">{activeSection} configuration will be available in a future update.</p>
          )}
        </section>
      </div>
    </div>
  );
}
