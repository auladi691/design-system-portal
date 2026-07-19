-- Initial published content for One Design.
-- Safe to run repeatedly: existing pages are never overwritten.

insert into public.pages (
  id, type, title, slug, summary, category, status, maturity, version, owner,
  content, featured, published_at
)
values
  (
    '10000000-0000-4000-8000-000000000001', 'foundation', 'Colour', 'colour',
    'Use colour to build hierarchy, communicate meaning, and keep experiences consistent.',
    'Visual language', 'published', 'stable', '1.0', 'Design System Team',
    '[
      {"id":"overview","kind":"overview","title":"Overview","body":"Colour creates hierarchy, communicates meaning, and gives every experience a recognisable visual language."},
      {"id":"principles","kind":"rich-text","title":"Principles","items":[{"title":"Use colour with purpose","description":"Reserve emphasis for actions, states, and information that need attention."},{"title":"Keep contrast clear","description":"Choose combinations that remain legible in light and dark surfaces."}]},
      {"id":"tokens","kind":"tokens","title":"Token collection","body":"Use semantic colour tokens so a decision can change without editing every screen."},
      {"id":"usage","kind":"behavior","title":"Usage","body":"Start with neutral surfaces and text. Add the selected accent only when it helps people understand priority or state."},
      {"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Check text, controls, focus indicators, and meaningful status colours against the required contrast."},
      {"id":"do-dont","kind":"do-dont","title":"Do and do not","items":[{"title":"Use colour to clarify","description":"Let colour reinforce hierarchy or meaning already present in the content.","tone":"do"},{"title":"Do not rely on colour alone","description":"Pair status colour with text, shape, or an icon.","tone":"dont"}]}
    ]'::jsonb, true, now()
  ),
  (
    '10000000-0000-4000-8000-000000000002', 'foundation', 'Typography', 'typography',
    'Make information easy to scan and comfortable to read at every screen size.',
    'Visual language', 'published', 'stable', '1.0', 'Design System Team',
    '[
      {"id":"overview","kind":"overview","title":"Overview","body":"Typography gives content a clear order and makes long reading sessions comfortable."},
      {"id":"principles","kind":"rich-text","title":"Principles","items":[{"title":"Create hierarchy","description":"Use size, weight, and spacing to show how information relates."},{"title":"Prioritise readability","description":"Keep body copy at a comfortable size and line length."}]},
      {"id":"tokens","kind":"tokens","title":"Token collection","body":"Use text, display, and line-height tokens instead of styling each heading by eye."},
      {"id":"usage","kind":"behavior","title":"Usage","body":"Choose a text style by the role content plays, not by the amount of visual emphasis you want."},
      {"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Check zoom, reflow, contrast, and the reading order of headings and supporting text."},
      {"id":"do-dont","kind":"do-dont","title":"Do and do not","items":[{"title":"Use a clear type scale","description":"Make the difference between levels predictable.","tone":"do"},{"title":"Do not use size as decoration","description":"Every size change should help people scan or understand content.","tone":"dont"}]}
    ]'::jsonb, true, now()
  ),
  (
    '10000000-0000-4000-8000-000000000003', 'foundation', 'Spacing', 'spacing',
    'Create consistent rhythm between elements and page sections.',
    'Layout', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Spacing creates rhythm, separates ideas, and gives interfaces room to breathe."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use the spacing scale to express relationships: less space within a group, more space between groups."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Leave enough room for readable text, focus indicators, and comfortable touch targets."}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000004', 'foundation', 'Grid', 'grid',
    'Arrange content with a flexible structure for desktop, tablet, and mobile.',
    'Layout', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"A grid keeps alignment intentional while allowing content to adapt across screen sizes."},{"id":"usage","kind":"behavior","title":"Usage","body":"Align related content to the same columns and let the layout simplify as space becomes limited."},{"id":"responsive","kind":"responsive","title":"Responsive behavior","body":"Prefer fluid columns and comfortable gutters. Stack content when a row becomes difficult to scan."}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000005', 'foundation', 'Radius', 'radius',
    'Use consistent corner shapes to clarify relationships between elements.',
    'Shape', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Radius gives surfaces a shared shape language and helps people recognise related elements."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use smaller radii for controls and larger radii for grouped surfaces when the hierarchy calls for it."},{"id":"do-dont","kind":"do-dont","title":"Do and do not","items":[{"title":"Use the radius scale","description":"Choose an available value that matches the component role.","tone":"do"},{"title":"Do not mix shapes without reason","description":"Unrelated corner treatments make a layout feel inconsistent.","tone":"dont"}]}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000006', 'foundation', 'Elevation', 'elevation',
    'Show layer relationships without adding heavy shadows.',
    'Visual language', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Elevation explains which surfaces sit above or below others without distracting from the content."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use tonal surfaces and subtle borders before adding shadow. Elevation should describe an interaction or layer relationship."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Do not use shadow as the only way to identify a surface or interactive boundary."}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000007', 'foundation', 'Gradients', 'gradients',
    'Use gradients for selected brand moments, not as general decoration.',
    'Visual language', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Gradients can add depth and energy when they support a clear story or brand moment."},{"id":"usage","kind":"behavior","title":"Usage","body":"Keep gradients away from essential text and controls unless contrast remains clear."},{"id":"do-dont","kind":"do-dont","title":"Do and do not","items":[{"title":"Use a restrained gradient","description":"Let it support the composition without becoming the message.","tone":"do"},{"title":"Do not make every surface colourful","description":"Neutral surfaces keep the system calm and easier to read.","tone":"dont"}]}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000008', 'foundation', 'Iconography', 'iconography',
    'Use clear, consistent outline icons for actions and navigation.',
    'Assets', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Icons support recognition and scanning. They should be simple, aligned, and familiar."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use outline icons with a clear relationship to their label or surrounding content."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Decorative icons are hidden from assistive technology. Meaningful icons need an accessible label."}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000009', 'foundation', 'Illustration', 'illustration',
    'Use visuals to help explain a story, situation, or message.',
    'Assets', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Illustration adds context and personality when words alone do not explain the situation clearly."},{"id":"usage","kind":"behavior","title":"Usage","body":"Choose an illustration that supports the message and does not compete with the next action."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Provide alternative text when an illustration carries meaning. Mark purely decorative artwork as decorative."}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000010', 'foundation', 'Motion', 'motion',
    'Use motion to explain change and provide feedback.',
    'Interaction', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Motion helps people understand where something came from, where it went, and what changed."},{"id":"usage","kind":"behavior","title":"Usage","body":"Keep transitions short and purposeful. Motion should help orientation, never interrupt reading."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Respect reduced-motion preferences and provide the same information without animation."}]'::jsonb, false, now()
  ),
  (
    '10000000-0000-4000-8000-000000000011', 'foundation', 'Accessibility', 'accessibility',
    'Design experiences that more people can use.',
    'Experience', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Accessibility is part of the design decision from the beginning, not a final check."},{"id":"usage","kind":"behavior","title":"Usage","body":"Consider keyboard access, readable content, clear focus, input help, and responsive behaviour together."},{"id":"do-dont","kind":"do-dont","title":"Do and do not","items":[{"title":"Design for different ways of using the interface","description":"Check touch, keyboard, zoom, contrast, and assistive technology needs.","tone":"do"},{"title":"Do not treat accessibility as optional polish","description":"An inaccessible interaction is not complete.","tone":"dont"}]}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000001', 'component', 'Button', 'button',
    'Help people take a clear action.', 'Actions', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Buttons let people complete an action or move to the next step."},{"id":"preview","kind":"preview","title":"Visual preview","body":"Use one primary action and supporting alternatives when a decision has more than one path."},{"id":"variants","kind":"variants","title":"Variants","items":[{"title":"Primary","description":"Use for the main action."},{"title":"Secondary","description":"Use for a supporting action."},{"title":"Tertiary","description":"Use for a lower-priority action."}]},{"id":"states","kind":"states","title":"States","items":[{"title":"Default","description":"The action is available."},{"title":"Focus","description":"The keyboard focus is clear."},{"title":"Disabled","description":"The action is unavailable and explains why when needed."}]},{"id":"content","kind":"content","title":"Content guidelines","body":"Use a short verb that describes the outcome, such as Save changes or Continue."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Keep the label understandable without surrounding context and provide a visible focus state."}]'::jsonb, true, now()
  ),
  (
    '20000000-0000-4000-8000-000000000002', 'component', 'Input', 'input',
    'Help people enter information easily.', 'Forms', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Inputs collect a single piece of information and help people understand what belongs there."},{"id":"anatomy","kind":"anatomy","title":"Anatomy","items":[{"title":"Label","description":"Names the information to enter."},{"title":"Field","description":"Provides the space for the value."},{"title":"Help or error text","description":"Adds context or explains how to recover."}]},{"id":"states","kind":"states","title":"States","items":[{"title":"Default","description":"The field is ready for input."},{"title":"Focus","description":"The active field is easy to identify."},{"title":"Error","description":"The problem and the next step are clear."}]},{"id":"content","kind":"content","title":"Content guidelines","body":"Use labels that describe the requested information. Keep examples separate from instructions."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Connect the label and help text to the field, preserve entered values, and do not rely on placeholder text alone."}]'::jsonb, true, now()
  ),
  (
    '20000000-0000-4000-8000-000000000003', 'component', 'Select', 'select',
    'Help people choose one option from a list.', 'Forms', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Select is useful when people choose one value from a known set of options."},{"id":"usage","kind":"behavior","title":"Usage","body":"Order options in a way that supports recognition and keep the selected value visible."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Make the label, expanded state, selected option, and keyboard behaviour clear."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000004', 'component', 'Checkbox', 'checkbox',
    'Let people choose one or more options.', 'Selection', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Checkboxes support independent choices where people can select any number of options."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use a group label when several checkboxes answer one question."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Keep the label and control together and make checked, unchecked, and indeterminate states clear."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000005', 'component', 'Radio', 'radio',
    'Use when people need to pick one option from a set.', 'Selection', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Radio buttons make one choice visible within a mutually exclusive set."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use a clear group question and provide a sensible initial choice when one option is recommended."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Provide a group label and keep keyboard movement predictable."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000006', 'component', 'Switch', 'switch',
    'Turn a setting on or off directly.', 'Selection', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Switch communicates an immediate on or off setting."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use a switch when the change takes effect immediately and can be reversed."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Pair the control with a clear label and announce the current state."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000007', 'component', 'Card', 'card',
    'Group related information and actions.', 'Content', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Cards group related content so people can scan and act on a clear unit of information."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use cards when grouping adds meaning. Do not turn every piece of content into a separate surface."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Keep the heading order and interactive targets clear within the card."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000008', 'component', 'Badge', 'badge',
    'Show status or short information.', 'Status', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Badges provide a short piece of status or classification information."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use a badge for compact context, not for an important action or a long sentence."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Do not use colour as the only way to communicate the badge meaning."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000009', 'component', 'Modal', 'modal',
    'Focus attention on a specific decision or task.', 'Overlay', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Modal temporarily focuses attention on a task that must be completed before returning to the page."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use modal for a focused decision, not for information that belongs in the normal page flow."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Move focus into the modal, keep it contained while open, and return it to the triggering element when closed."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000010', 'component', 'Tabs', 'tabs',
    'Move between equal sections.', 'Navigation', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Tabs organise related views that share the same level of importance."},{"id":"usage","kind":"behavior","title":"Usage","body":"Keep tab labels short and make the active view obvious."},{"id":"responsive","kind":"responsive","title":"Responsive behavior","body":"Allow tabs to scroll or simplify on narrow screens without hiding the active state."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Expose the selected tab and associated panel to keyboard and assistive technology users."}]'::jsonb, false, now()
  ),
  (
    '20000000-0000-4000-8000-000000000011', 'component', 'Table', 'table',
    'Help people read and compare structured data.', 'Data display', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Tables make relationships between values easier to compare when the data has a consistent structure."},{"id":"usage","kind":"behavior","title":"Usage","body":"Keep columns purposeful, align values consistently, and provide a useful empty state."},{"id":"responsive","kind":"responsive","title":"Responsive behavior","body":"Prioritise important columns or allow horizontal scrolling when the full table cannot fit."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Use real headers, clear scope, and a meaningful caption when the table needs context."}]'::jsonb, false, now()
  ),
  (
    '30000000-0000-4000-8000-000000000001', 'design', 'Introduction', 'introduction',
    'Start here to understand how One Design helps teams make clearer decisions.', 'Getting started', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"One Design brings foundations, components, patterns, and assets together so teams can create consistent experiences with confidence."},{"id":"usage","kind":"behavior","title":"How to use this portal","body":"Start with the guidance closest to your decision, then follow related links to understand the wider system."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Use the system as a starting point and validate the final experience with the people who use it."}]'::jsonb, true, now()
  ),
  (
    '30000000-0000-4000-8000-000000000002', 'design', 'Principles', 'principles',
    'The principles behind clear, consistent, and inclusive design decisions.', 'Decision making', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Good system decisions are clear enough to reuse, flexible enough to adapt, and inclusive enough to serve different needs."},{"id":"principles","kind":"rich-text","title":"Principles","items":[{"title":"Clarity over decoration","description":"Every visual choice should make the experience easier to understand."},{"title":"Reuse before reinvention","description":"Start with the system and add a new pattern only when the need is real."},{"title":"Progress through feedback","description":"Share decisions early and improve them with the people who use them."}]}]'::jsonb, false, now()
  ),
  (
    '30000000-0000-4000-8000-000000000003', 'design', 'Getting started', 'getting-started',
    'A practical path from a new idea to a consistent design.', 'Getting started', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Use the system as a design partner from the first wireframe through to the finished experience."},{"id":"usage","kind":"behavior","title":"A simple path","items":[{"title":"Understand the need","description":"Describe the user goal before choosing a component."},{"title":"Find an existing decision","description":"Search foundations, components, patterns, and resources."},{"title":"Check the edges","description":"Review states, accessibility, and responsive behaviour."}]}]'::jsonb, false, now()
  ),
  (
    '30000000-0000-4000-8000-000000000004', 'design', 'Contribution', 'contribution',
    'How to suggest improvements and make the system stronger for everyone.', 'Collaboration', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Contributions help the system respond to real product needs while protecting consistency."},{"id":"usage","kind":"behavior","title":"Before you contribute","body":"Explain the problem, show where existing guidance falls short, and include examples of the proposed direction."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Include accessibility and responsive considerations in the proposal from the beginning."}]'::jsonb, false, now()
  ),
  (
    '30000000-0000-4000-8000-000000000005', 'design', 'Governance', 'governance',
    'The shared responsibilities that keep One Design useful and trusted.', 'Collaboration', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Governance makes ownership, review, and change visible so the system can evolve without losing its foundation."},{"id":"usage","kind":"behavior","title":"Working agreements","body":"Keep ownership clear, record meaningful changes, and publish guidance only after it is ready for designers to use."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Accessibility is part of the acceptance criteria for every published decision."}]'::jsonb, false, now()
  ),
  (
    '40000000-0000-4000-8000-000000000001', 'pattern', 'Forms', 'forms',
    'Build forms that help people complete tasks with confidence.', 'Common needs', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"A good form makes the task, required information, and next step easy to understand."},{"id":"usage","kind":"behavior","title":"Usage","body":"Group related fields, use clear labels, validate at the right moment, and preserve what people have entered."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Make errors discoverable, associate help with each field, and support keyboard completion."}]'::jsonb, false, now()
  ),
  (
    '40000000-0000-4000-8000-000000000002', 'pattern', 'Navigation', 'navigation',
    'Help people understand where they are and where they can go next.', 'Common needs', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Navigation gives people a reliable map of the experience and a clear route to their goal."},{"id":"usage","kind":"behavior","title":"Usage","body":"Keep destinations grouped, labels predictable, and the current location visible."},{"id":"responsive","kind":"responsive","title":"Responsive behavior","body":"Preserve the most important destinations and use a clear compact menu when space is limited."}]'::jsonb, false, now()
  ),
  (
    '40000000-0000-4000-8000-000000000003', 'pattern', 'Search', 'search',
    'Help people find the right content without needing to know its exact name.', 'Common needs', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Search is most useful when the content library is broad and people have a clear intent."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use familiar language, show useful results, and explain what to do when no result matches."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Keep the search field labelled, expose result counts when helpful, and make keyboard selection clear."}]'::jsonb, false, now()
  ),
  (
    '40000000-0000-4000-8000-000000000004', 'pattern', 'Feedback', 'feedback',
    'Tell people what happened and what they can do next.', 'Common needs', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Feedback closes the loop after an action and reduces uncertainty."},{"id":"usage","kind":"behavior","title":"Usage","body":"Match the feedback to the importance of the event. Keep messages short and actionable."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Make important feedback available to assistive technology and do not rely on colour alone."}]'::jsonb, false, now()
  ),
  (
    '40000000-0000-4000-8000-000000000005', 'pattern', 'Empty states', 'empty-states',
    'Make an empty moment clear, useful, and easy to move through.', 'Common needs', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"An empty state explains why content is not present and gives people a useful next step."},{"id":"usage","kind":"behavior","title":"Usage","body":"Say what is empty, why it is empty when that matters, and what action will help."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Use a clear heading and text so the message remains understandable without the illustration."}]'::jsonb, false, now()
  ),
  (
    '40000000-0000-4000-8000-000000000006', 'pattern', 'Responsive layout', 'responsive-layout',
    'Adapt content and interaction gracefully across screen sizes.', 'Common needs', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Responsive layout preserves hierarchy and usability while the available space changes."},{"id":"usage","kind":"behavior","title":"Usage","body":"Start with the content priority, then choose how columns, controls, and navigation should adapt."},{"id":"accessibility","kind":"accessibility","title":"Accessibility","body":"Check zoom, reflow, touch targets, and reading order rather than relying on one viewport."}]'::jsonb, false, now()
  ),
  (
    '50000000-0000-4000-8000-000000000001', 'resource', 'Figma Library', 'figma-library',
    'Open approved components and foundations in the shared Figma library.', 'Resources', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"The Figma Library is the source for approved design assets and component starting points."},{"id":"usage","kind":"behavior","title":"Usage","body":"Use the library when creating or reviewing work. The published Portal guidance explains the decisions behind each asset."}]'::jsonb, false, now()
  ),
  (
    '50000000-0000-4000-8000-000000000002', 'resource', 'Templates', 'templates',
    'Start new design work from a consistent structure.', 'Resources', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Templates provide a considered starting point so teams can focus on the problem rather than rebuilding structure."},{"id":"usage","kind":"behavior","title":"Usage","body":"Choose the closest template, remove what is not needed, and keep the underlying guidance intact."}]'::jsonb, false, now()
  ),
  (
    '50000000-0000-4000-8000-000000000003', 'resource', 'Downloads', 'downloads',
    'Find approved files ready for designers to download.', 'Resources', 'published', 'stable', '1.0', 'Design System Team',
    '[{"id":"overview","kind":"overview","title":"Overview","body":"Downloads collect files that are ready to use in design work."},{"id":"usage","kind":"behavior","title":"Usage","body":"Check the version and guidance before using a downloaded file in a product experience."}]'::jsonb, false, now()
  )
on conflict (slug) do nothing;

insert into public.releases (id, version, title, summary, status, changes, release_date)
select
  '60000000-0000-4000-8000-000000000001', '1.0', 'A clearer starting point',
  'Foundations, components, patterns, and the Asset Library are now available in one portal.',
  'published',
  '["Added published foundations and components","Added design and pattern guidance","Added the published-only Portal data flow"]'::jsonb,
  current_date
where not exists (
  select 1
  from public.releases
  where version = '1.0'
    and title = 'A clearer starting point'
)
on conflict (id) do nothing;
