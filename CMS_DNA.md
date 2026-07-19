# CMS DNA

One Design Studio should feel like Notion focused on design systems, with Zeroheight-specific blocks and a Figma-like properties panel.

## Navigation

Dashboard, Content, Tokens, Assets, Releases, Feedback, Settings.

## Editor

- Left: page outline and completeness.
- Center: direct-edit block canvas.
- Right: block properties, page metadata, checks.
- Top: saved state, preview, publish.
- Autosave drafts; publishing is explicit.

## CRUD rule

Home, navigation, footer, Design, Foundations, Components, Patterns, Resources, Asset Explorer, Releases, system copy, metadata, relations, order, visibility, and assets must be manageable from the CMS.

Delete flow is `unpublish → archive → permanent delete`. Prefer archive. Never silently remove an asset or token used by published pages. Permanent delete requires a confirmation dialog and removes both the database record and the Storage file.

## Authentication

One Design Studio uses Supabase Auth. Only accounts listed in the `public.administrators` table can sign in. Demo login has been removed. Non-administrator accounts are rejected.

## Language

Use clear, short English labels written for UI/UX designers. Examples:

- "New page"
- "Save changes"
- "Needs attention"
- "Restore version"
- "Add clear guidance for designers"

Keep technical details behind "Details".

## Content states

Studio reads all page, asset, and release statuses for administrators. The
Portal queries published records only. The Studio preview banner appears only
when Supabase is unavailable and seed data is being used for local preview; it
is not a production fallback.

Initial content is added by the idempotent
`20260719000006_one_design_initial_content.sql` migration. Existing pages are
preserved by slug conflict handling, so administrator edits are not
overwritten.
