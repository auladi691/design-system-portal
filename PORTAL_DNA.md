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
- Brand filter appears only on Icon illustrations and Brand assets.
- Asset details show preview, name, description, category, brand (when relevant), file type, file size, version, alternative text (when relevant), and a download button.
- If a file is not available, the download button is hidden and a simple message is shown.
