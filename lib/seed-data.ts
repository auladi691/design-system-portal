import type { Asset, ContentPage, SiteData } from "@/types/content";

const TODAY = "19 Jul 2026";

const componentSections = (name: string) => [
  { id: "overview", kind: "overview" as const, title: "Overview", body: `${name} helps designers create clear and consistent experiences. Use this guidance to choose the right shape, size, and behavior.` },
  { id: "preview", kind: "preview" as const, title: "Visual preview", body: "Try the available options to see how the component responds." },
  { id: "anatomy", kind: "anatomy" as const, title: "Anatomy", items: [{ title: "Container", description: "The main area that forms the component." }, { title: "Label", description: "Text that explains the action or information." }, { title: "Icon", description: "Supporting element that clarifies meaning." }] },
  { id: "variants", kind: "variants" as const, title: "Variants", items: [{ title: "Primary", description: "Use for the main action." }, { title: "Secondary", description: "Use for supporting actions." }, { title: "Tertiary", description: "Use for lower-priority actions." }] },
  { id: "sizes", kind: "sizes" as const, title: "Sizes", items: [{ title: "Small", description: "For compact areas." }, { title: "Medium", description: "The default choice for most needs." }, { title: "Large", description: "For actions that need to stand out." }] },
  { id: "states", kind: "states" as const, title: "States", items: [{ title: "Default", description: "The starting appearance." }, { title: "Hover", description: "When the pointer is over the component." }, { title: "Focus", description: "When selected with the keyboard." }, { title: "Disabled", description: "When the action is not available yet." }] },
  { id: "behavior", kind: "behavior" as const, title: "Behavior", body: "Give an immediate, understandable response after each interaction. Do not move the component without warning." },
  { id: "content", kind: "content" as const, title: "Content guidelines", body: "Use short labels that explain the purpose. Avoid vague words like “OK” or “Click here”." },
  { id: "responsive", kind: "responsive" as const, title: "Responsive behavior", body: "Keep hierarchy and comfortable touch areas on small screens. Stack content vertically when space is tight." },
  { id: "accessibility", kind: "accessibility" as const, title: "Accessibility", items: [{ title: "Clear labels", description: "Make the purpose understandable without guessing." }, { title: "Visible focus", description: "Show a focus marker with enough contrast." }, { title: "Touch area", description: "Provide a comfortable target on touch devices." }] },
  { id: "do-dont", kind: "do-dont" as const, title: "Do & don’t", items: [{ title: "Use clear hierarchy", description: "Help people recognize the main choice.", tone: "do" as const }, { title: "Don't make choices compete", description: "Too much emphasis makes decisions harder.", tone: "dont" as const }] },
  { id: "related", kind: "related" as const, title: "Related components", body: "See other components that work well alongside this one." },
  { id: "figma", kind: "figma" as const, title: "Figma resource", body: "Open the approved component in the Figma library." },
  { id: "changelog", kind: "changelog" as const, title: "Changelog", body: "Version 1.0 — Initial guidance published." },
];

const foundationSections = (name: string) => [
  { id: "overview", kind: "overview" as const, title: "Overview", body: `${name} helps keep visual decisions consistent across every experience.` },
  { id: "principles", kind: "rich-text" as const, title: "Principles", items: [{ title: "Consistent", description: "Use what exists before creating something new." }, { title: "Meaningful", description: "Each choice should help people understand the interface." }, { title: "Inclusive", description: "Keep the result easy to use for more people." }] },
  { id: "tokens", kind: "tokens" as const, title: "Token collection", body: "Use token names instead of hand-picked values." },
  { id: "usage", kind: "behavior" as const, title: "Usage", body: "Choose tokens by function and context, not just by appearance." },
  { id: "examples", kind: "preview" as const, title: "Examples", body: "These examples show the recommended application." },
  { id: "accessibility", kind: "accessibility" as const, title: "Accessibility", body: "Check contrast, legibility, and clarity in both light and dark mode." },
  { id: "do-dont", kind: "do-dont" as const, title: "Do & don’t", items: [{ title: "Use available tokens", description: "Keeps design consistent.", tone: "do" as const }, { title: "Don't add values without a reason", description: "Uncontrolled variation is hard to manage.", tone: "dont" as const }] },
  { id: "figma", kind: "figma" as const, title: "Figma resource", body: "Find this foundation in the Figma library." },
  { id: "changelog", kind: "changelog" as const, title: "Changelog", body: "Version 1.0 — Initial guidance published." },
];

const page = (id: string, type: ContentPage["type"], title: string, category: string, summary: string, featured = false): ContentPage => ({
  id, type, title, slug: title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), summary, category,
  status: "published", maturity: "stable", version: "1.0", owner: "Design System Team", updatedAt: TODAY, featured,
  sections: type === "component" ? componentSections(title) : foundationSections(title),
});

const pages: ContentPage[] = [
  page("f-color", "foundation", "Colour", "Visual language", "Use color to build hierarchy, communicate meaning, and keep experiences consistent.", true),
  page("f-type", "foundation", "Typography", "Visual language", "Make information easy to scan and comfortable to read at every screen size.", true),
  page("f-space", "foundation", "Spacing", "Layout", "Create consistent rhythm between elements and page sections."),
  page("f-grid", "foundation", "Grid", "Layout", "Arrange content with a flexible structure for desktop, tablet, and mobile."),
  page("f-radius", "foundation", "Radius", "Shape", "Use consistent corner shapes to clarify relationships between elements."),
  page("f-elevation", "foundation", "Elevation", "Visual language", "Show layer relationships without adding heavy shadows."),
  page("f-gradient", "foundation", "Gradients", "Visual language", "Use gradients for selected brand moments, not as general decoration."),
  page("f-icon", "foundation", "Iconography", "Assets", "Use clear, consistent outline icons for actions and navigation."),
  page("f-illustration", "foundation", "Illustration", "Assets", "Use visuals to help explain a story, situation, or message."),
  page("f-motion", "foundation", "Motion", "Interaction", "Use motion to explain change and provide feedback."),
  page("f-a11y", "foundation", "Accessibility", "Experience", "Design experiences that more people can use."),
  page("c-button", "component", "Button", "Actions", "Help people take a clear action.", true),
  page("c-input", "component", "Input", "Forms", "Help people enter information easily.", true),
  page("c-select", "component", "Select", "Forms", "Help people choose one option from a list."),
  page("c-check", "component", "Checkbox", "Selection", "Let people choose one or more options."),
  page("c-radio", "component", "Radio", "Selection", "Use when people need to pick one option from a set."),
  page("c-switch", "component", "Switch", "Selection", "Turn a setting on or off directly."),
  page("c-card", "component", "Card", "Content", "Group related information and actions."),
  page("c-badge", "component", "Badge", "Status", "Show status or short information."),
  page("c-modal", "component", "Modal", "Overlay", "Focus attention on a specific decision or task."),
  page("c-tabs", "component", "Tabs", "Navigation", "Move between equal sections."),
  page("c-table", "component", "Table", "Data display", "Help people read and compare structured data."),
];

const asset = (
  id: string,
  type: Asset["type"],
  name: string,
  category: string,
  brand: Asset["brand"],
  glyph: string,
): Asset => ({
  id,
  type,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  category,
  brand,
  purpose: "general-asset",
  status: "published",
  description: `${name} helps communicate meaning clearly.`,
  keywords: [name.toLowerCase(), category.toLowerCase()],
  glyph,
  version: "1.0",
  updatedAt: TODAY,
  altText: `${name} ${type.replace("-", " ")} preview`,
  caption: "",
  theme: "both",
  figmaUrl: undefined,
  downloadAvailable: true,
  filePath: null,
  fileUrl: null,
  mimeType: null,
  fileSize: null,
  originalFileName: null,
  createdAt: TODAY,
});

const iconNames = [["Add","Actions","＋"],["Arrow right","Navigation","→"],["Check","Status","✓"],["Search","Navigation","⌕"],["Close","Actions","×"],["Edit","Actions","✎"],["Delete","Actions","⌫"],["Settings","System","⚙"],["Download","Actions","↓"],["Upload","Actions","↑"],["Info","Status","i"],["Warning","Status","!"]] as const;

export const SEED_SITE_SETTINGS = {
  name: "One Design",
  tagline: "Design with clarity.",
  description:
    "One place to find foundations, components, patterns, and assets that help designers create consistent experiences.",
  visibility: "unlisted" as const,
};

export const emptySiteData: SiteData = {
  settings: SEED_SITE_SETTINGS,
  pages: [],
  assets: [],
  releases: [],
  tokenImports: [],
};

export const seedData: SiteData = {
  settings: SEED_SITE_SETTINGS,
  pages,
  assets: [
    ...iconNames.map((item, index) => asset(`icon-${index}`, "icon", item[0], item[1], "Shared", item[2])),
    asset("ii-1", "icon-illustration", "Internet package", "Product", "IM3", "◉"),
    asset("ii-2", "icon-illustration", "Entertainment", "Lifestyle", "Indosat", "✦"),
    asset("ii-3", "icon-illustration", "Rewards", "Service", "Tri", "◇"),
    asset("ii-4", "icon-illustration", "Partner support", "Support", "Partner", "◎"),
    asset("ill-1", "illustration", "Empty state", "Empty state", "Shared", "◌"),
    asset("ill-2", "illustration", "Success moment", "Success", "Shared", "✺"),
    asset("logo-1", "logo", "IM3 Logo", "Corporate", "IM3", "IM3"),
    asset("logo-2", "logo", "Tri Logo", "Corporate", "Tri", "3"),
    asset("brand-1", "brand-asset", "Brand background", "Background", "Indosat", "▧"),
    asset("template-1", "template", "Mobile screen template", "UI template", "Shared", "▯"),
  ],
  releases: [
    {
      id: "r-1",
      version: "1.0",
      title: "A clearer starting point",
      summary: "Foundations, components, and the Asset Library are now available in one portal.",
      date: TODAY,
      status: "published",
      changes: [
        "Added Colour and Typography",
        "Added Button and Input",
        "Opened Icons and Icon Illustrations explorer",
      ],
    },
  ],
  tokenImports: [],
};
