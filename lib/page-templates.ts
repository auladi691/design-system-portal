import type { ContentPage, ContentSection, PageTemplateId, PageType } from "@/types/content";

export type PageTemplateDefinition = {
  id: PageTemplateId;
  label: string;
  description: string;
  type: PageType;
  sectionTitles: { title: string; kind: ContentSection["kind"]; guidance: string }[];
};

export const PAGE_TEMPLATES: PageTemplateDefinition[] = [
  {
    id: "foundation",
    label: "Foundation template",
    description: "Use for colour, typography, spacing, grid, and other shared visual decisions.",
    type: "foundation",
    sectionTitles: [
      { title: "Overview", kind: "overview", guidance: "Explain what this foundation is and where it is used." },
      { title: "Principles", kind: "rich-text", guidance: "List the principles or rules designers should follow." },
      { title: "Token collection", kind: "tokens", guidance: "Reference the tokens that form this foundation." },
      { title: "Visual reference", kind: "preview", guidance: "Add a visual reference that shows the foundation in practice." },
      { title: "Usage", kind: "behavior", guidance: "Explain when and how to apply this foundation." },
      { title: "Examples", kind: "preview", guidance: "Show real usage examples that designers can refer to." },
      { title: "Accessibility", kind: "accessibility", guidance: "Describe accessibility considerations for this foundation." },
      { title: "Do and don't", kind: "do-dont", guidance: "Add clear good and bad examples." },
      { title: "Related foundations", kind: "related", guidance: "Link to foundations designers may also need." },
      { title: "Figma resource", kind: "figma", guidance: "Link to the Figma library section for this foundation." },
      { title: "Changelog", kind: "changelog", guidance: "Record the reason for each meaningful change." },
    ],
  },
  {
    id: "component",
    label: "Component template",
    description: "Use for buttons, inputs, cards, and other reusable components.",
    type: "component",
    sectionTitles: [
      { title: "Overview", kind: "overview", guidance: "Describe what this component is and when it is used." },
      { title: "Design preview", kind: "preview", guidance: "Add a design preview block with a Figma-exported visual." },
      { title: "Interactive preview", kind: "preview", guidance: "Let designers try the component in different configurations." },
      { title: "Anatomy", kind: "anatomy", guidance: "Describe the parts that make up this component." },
      { title: "Variants", kind: "variants", guidance: "Explain when to use each variant." },
      { title: "Sizes", kind: "sizes", guidance: "Describe the available sizes and their intended use." },
      { title: "States", kind: "states", guidance: "List interaction states and how they appear." },
      { title: "Behavior", kind: "behavior", guidance: "Explain how the component responds to interaction." },
      { title: "Content guidelines", kind: "content", guidance: "Help designers choose the right labels and content." },
      { title: "Responsive behavior", kind: "responsive", guidance: "Describe how the component adapts across screen sizes." },
      { title: "Accessibility", kind: "accessibility", guidance: "Explain keyboard, focus, and assistive technology considerations." },
      { title: "Do and don't", kind: "do-dont", guidance: "Add clear good and bad examples." },
      { title: "Related components", kind: "related", guidance: "Link to components that work well alongside this one." },
      { title: "Figma resource", kind: "figma", guidance: "Link to the approved Figma component." },
      { title: "Changelog", kind: "changelog", guidance: "Record the reason for each meaningful change." },
    ],
  },
  {
    id: "pattern",
    label: "Pattern template",
    description: "Use for forms, navigation, search, feedback, and recurring design problems.",
    type: "pattern",
    sectionTitles: [
      { title: "Overview", kind: "overview", guidance: "Describe the problem and the goal of this pattern." },
      { title: "Problem and context", kind: "rich-text", guidance: "Explain where the problem occurs and what makes it important." },
      { title: "When to use", kind: "behavior", guidance: "Describe when to use this pattern." },
      { title: "When not to use", kind: "behavior", guidance: "Describe when a different approach is more appropriate." },
      { title: "User flow", kind: "preview", guidance: "Show the flow that solves the problem." },
      { title: "Component composition", kind: "related", guidance: "List the components used to build this pattern." },
      { title: "Behavior", kind: "behavior", guidance: "Explain how the pattern responds to interaction." },
      { title: "Responsive behavior", kind: "responsive", guidance: "Describe how the pattern adapts across screen sizes." },
      { title: "Edge cases", kind: "behavior", guidance: "Cover loading, empty, and error states." },
      { title: "Accessibility", kind: "accessibility", guidance: "Explain accessibility decisions and checks for this pattern." },
      { title: "Do and don't", kind: "do-dont", guidance: "Add clear good and bad examples." },
      { title: "Related patterns or components", kind: "related", guidance: "Link to related patterns and components." },
      { title: "Figma resource", kind: "figma", guidance: "Link to the Figma flow for this pattern." },
      { title: "Changelog", kind: "changelog", guidance: "Record the reason for each meaningful change." },
    ],
  },
  {
    id: "resource",
    label: "Resource template",
    description: "Use for Figma libraries, templates, downloads, and other shared resources.",
    type: "resource",
    sectionTitles: [
      { title: "Overview", kind: "overview", guidance: "Describe what this resource contains and when to use it." },
      { title: "Cover preview", kind: "preview", guidance: "Add a cover visual that represents this resource." },
      { title: "What's included", kind: "rich-text", guidance: "List what designers will find in this resource." },
      { title: "Asset gallery", kind: "preview", guidance: "Show the assets included with this resource." },
      { title: "Usage guidelines", kind: "behavior", guidance: "Explain how to use this resource correctly." },
      { title: "Available formats", kind: "rich-text", guidance: "List available file formats or download options." },
      { title: "Availability", kind: "behavior", guidance: "Explain who can use this resource and where." },
      { title: "Download or Open in Figma", kind: "figma", guidance: "Add the Figma resource link or download action." },
      { title: "License or restrictions", kind: "rich-text", guidance: "Explain any usage restrictions or license notes." },
      { title: "Related resources", kind: "related", guidance: "Link to related resources designers may also need." },
      { title: "Changelog", kind: "changelog", guidance: "Record the reason for each meaningful change." },
    ],
  },
];

export function makePageFromTemplate(templateId: PageTemplateId, owner: string = "Design System Team"): ContentPage {
  const template = PAGE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Unknown template "${templateId}"`);
  }
  const id = crypto.randomUUID();
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const title = template.id === "foundation" ? "Untitled foundation" : template.id === "component" ? "Untitled component" : template.id === "pattern" ? "Untitled pattern" : "Untitled resource";
  return {
    id,
    type: template.type,
    title,
    slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${id.slice(0, 8)}`,
    summary: `Add a clear summary for this ${template.id}.`,
    category: "General",
    status: "draft",
    maturity: "experimental",
    version: "1.0",
    owner,
    updatedAt: today,
    sections: template.sectionTitles.map((s, i) => ({
      id: `section-${i + 1}`,
      kind: s.kind,
      title: s.title,
      body: s.guidance,
    })),
  };
}

export function getTemplate(templateId: PageTemplateId): PageTemplateDefinition | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === templateId);
}
