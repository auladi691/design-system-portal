# Component System

Portal UI components use semantic theme variables and accessible interaction patterns. Content blocks are rendered through a controlled registry; arbitrary HTML and scripts are not allowed.

Required families:

- Navigation: header, sidebar, table of contents, breadcrumbs.
- Content: rich text, callout, tables, token tables.
- Documentation: anatomy, variant gallery, state matrix, do/don't, accessibility checklist.
- Assets: grid, filter, preview drawer, download actions.
- CMS: tables, editor blocks, properties, asset/token pickers, dialogs, toast.

Unknown block types fail safely without breaking a page. Every hover interaction must have a keyboard equivalent.
