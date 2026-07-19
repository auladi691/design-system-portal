# Token System

Source format: Figma Design Tokens plugin (`org.lukasoppermann.figmaDesignTokens`). The source uses `type`, `value`, `description`, aliases in braces, extensions, and custom types.

Never edit the uploaded source JSON. Corrections happen in Figma and are exported again.

Pipeline:

```text
Upload → validate JSON → validate aliases → normalize → diff → review → publish
```

Groups: Core, Alias, Element, Brand, Typography, Gradient, Grid, Effect. Preserve IM3, Indosat, Tri, Partner data without a global portal brand selector.

Broken aliases and removed tokens used by published content block publication. Values shown in documentation come from the published token version.

## Brand filter

Brand filter is not a global switcher. It appears only on Icon illustrations and Brand assets in the Asset Library. Token groups keep IM3, Indosat, Tri, and Partner data without exposing a portal-wide brand selector.
