# AI Working Agreement

Read these instructions before changing the project.

## Locked decisions

1. The product is **One Design**: a public Portal without login and a CMS (**One Design Studio**) for Administrators only.
2. Foundations and Components follow the scope of Wise; guidance depth follows Atlassian Design.
3. Visual direction: **Monochrome Editorial**. Neutral-first, one selected accent, light/dark mode.
4. Motion follows Apple/Wise restraint: helps orientation, never distracts from reading.
5. Copy is **English only**, written for UI/UX designers. Avoid engineering jargon.
6. Token source is the JSON export from the Figma Design Tokens plugin. Never edit the source file.
7. No Figma API. No global brand switcher.
8. Icons use the Outline style only. `Icon illustrations` is a separate category with a brand filter.
9. All Portal content is managed through the CMS. Do not hardcode new editorial pages into JSX.
10. Drafts never appear in the Portal.
11. **Supabase is the single source of truth** for content, assets, auth, and Storage. Do not use localStorage for CMS data or sessionStorage for authentication. localStorage is only used for theme preference.
12. Asset Library has **seven categories**: Icons, Icon illustrations, Illustrations, Logos, Brand assets, Templates, Downloads.
13. Brand filter appears only on Icon illustrations and Brand assets. It is not a global switcher.
14. Bulk upload is available for every asset category. Default upload status is `draft`.
15. Permanent delete requires a confirmation dialog. Bulk delete handles partial failure and never assumes full success when only some items succeeded.
16. Storage and database must stay in sync. If a database insert fails after a Storage upload, the uploaded file is removed.

## Before editing

- Read the relevant DNA documents.
- Preserve `.openai/hosting.json`, build scripts, and the Next.js structure.
- Do not delete unrelated user changes.
- Use semantic tokens, not new hardcoded colors.
- Test light/dark, responsive, keyboard, reduced motion, and build.

## Quality bar

- Text is easy to understand on first read.
- Body copy is comfortable for long reading sessions.
- Animation is never continuous decoration.
- Portal and CMS share the same data.
- Empty, loading, error, success, draft, archived, and deprecated states are clear.
- Raw Supabase errors are never shown to users. Translate them into clear, actionable copy.
