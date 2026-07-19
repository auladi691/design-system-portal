# Documentation System

## Component template

Overview, Visual preview, Anatomy, Variants, Sizes, States, Behavior, Content guidelines, Responsive behavior, Accessibility, Do & don't, Related components, Figma resource, Changelog.

## Foundation template

Overview, Principles, Token collection, Hierarchy, Usage, Examples, Accessibility, Do & don't, Related foundations, Figma resource, Changelog.

## Writing

Write for UI/UX designers in clear English. Keep familiar design terms (component, variant, state, token, spacing, grid, focus) and explain them on first use. Do not expose API, props, DOM, React, schema, endpoint, cache, or deployment language.

Every page should answer: what is it, when to use it, how to use it, what to avoid, and what changes for accessibility or responsive behavior.

## Language

One Design is English-only. There is no Bahasa Indonesia mode, no language switcher, and no locale selector. Do not mix languages. Token names, filenames, URLs, code snippets, and file formats are not translated.

## Portal States

Published content is loaded from Supabase without rendering production seed
content first. While it loads, show “Loading guidance” and “One moment while
we prepare the latest published content.” A configured empty database shows
“No published guidance yet”; a search miss shows “No matching guidance”. Data
failures show a friendly retry state and never expose a raw Supabase message.

The same distinction applies to assets: loading, database error, an empty
library, an empty category, and filters with no matches have separate messages.
The latest-release block is hidden when no published release exists.
