# src/components — Component Patterns

## Layout

Every component under here is a React component, TypeScript strict, Tailwind
for styling. Components that touch the DOM, hold hook state, or import
`@xyflow/react` / `codemirror` start with `'use client'`.

## Sub-trees

- **`Canvas/`** — React Flow wiring, custom nodes and edges, view toggle. See
  `Canvas/skills.md` for internal details.
- **`Editor/`** — CodeMirror 6 host. Single component, `YamlEditor.tsx`. It
  owns the CodeMirror lifecycle and exposes a tiny `{ value, onChange }` API.
- **`Layout/`** — `Header.tsx` and `ThemeProvider.tsx`. The header renders
  nav and theme toggle; the theme provider wraps `next-themes` with project
  defaults (`attribute="class"`, system-aware).

## Style rules

- Prefer **CSS custom properties** defined in `globals.css` for values that
  need to respond to dark mode (`rgb(var(--fg))`, `rgb(var(--panel))`, etc.).
- Use Tailwind utilities for layout, spacing and typography. Avoid one-off
  class soup — extract components when a combo repeats.
- No inline SVGs copy-pasted around. Reusable icons come from `lucide-react`.
  Device stencils come from `public/stencils/netweave/`.

## Client/server boundary

If a component imports `@xyflow/react`, `@codemirror/*`, `next-themes`, or uses
`useState`, it MUST be a client component. Keep that boundary tight — the more
server components we have, the smaller the JS bundle on docs pages.

## Adding a component

1. Create `src/components/<Area>/<Name>.tsx`.
2. Start with `'use client'` only if needed.
3. Export the component by name; don't default-export.
4. Style with Tailwind + the CSS variables.
