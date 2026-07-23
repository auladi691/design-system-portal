# Portal DNA

## Routes

```text
/
/design
/foundations/[slug]
/components/[slug]
/patterns/[slug]
/resources
/resources/assets
/resources/assets/{icon|icon-illustration|illustration|logo|brand-asset|template|download}
/changelog
/search
```

## Modes

- Discovery pages are expressive and editorial.
- Documentation pages are calm and reading-first.
- Asset Explorer is visual and filterable.

## Shell

Header: logo, Design, Foundations, Components, Patterns, Resources, Search, Theme. No brand switcher. Detail pages use collection navigation, a readable content column, and on-page navigation.

Viewer requires no account. The portal is unlisted and includes `noindex`; this is not a security boundary.

## Asset Explorer

- Shows only assets with status `published`.
- Each category has a dedicated filtered view, search, asset count, loading state, and empty state.
- Seven public categories only: icon, icon-illustration, illustration, logo, brand-asset, template, download. No `/resources/assets/component-preview` route.
- Component preview is an internal-only asset purpose (`purpose: "component-preview"`, `visibility: "internal"`). It is never shown in public navigation, category cards, tabs, counts, filters, or sitemap. It renders only when referenced by a published documentation block (Design Preview, Variant Gallery, State Gallery). Draft/archived previews never render publicly.
- Brand filter appears only on Icon illustrations and Brand assets.
- Asset details show preview, name, description, category, brand (when relevant), file type, file size, version, alternative text (when relevant), and a download button.
- If a file is not available, the download button is hidden and a simple message is shown.

## Data and Route Rules

The Portal is published-only and has no administrator data access. Design,
pattern, resource, foundation, and component cards are loaded from published
pages and use explicit route mapping. Resources link to published resource
pages or the appropriate asset category. Figma opens in a new tab only when
`figmaUrl` exists; otherwise the card is non-interactive and says “Coming
soon”.

An unknown detail slug is a 404. A collection without a slug remains a
collection page. Loading, database error, empty database, and no-search-result
states are distinct so an empty result is never mistaken for a failed query.
