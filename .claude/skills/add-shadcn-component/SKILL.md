---
name: add-shadcn-component
description: Add or use a shadcn/ui component in the web app (apps/web). Use when the user wants UI built from shadcn primitives — e.g. "add a dialog", "use shadcn for this form", "add a dropdown menu", "build a settings card". Covers running the shadcn CLI in this Next.js 16 + Tailwind v4 + React 19 setup, the project's theme conventions (brand indigo = --primary, .dark class), and where the pieces live.
---

# Add a shadcn/ui component to `apps/web`

shadcn is already initialized in [apps/web](../../../apps/web/). Components are
**copied into the repo** (not a dependency) under
[apps/web/components/ui/](../../../apps/web/components/ui/) and you own/edit them
freely. Don't hand-roll a button/input/dialog when shadcn ships one — add it
with the CLI and compose.

## Add a component

Run the CLI **from `apps/web`** (where [components.json](../../../apps/web/components.json) lives):

```bash
cd apps/web
pnpm dlx shadcn@latest add <name> [<name>...] -y
```

e.g. `pnpm dlx shadcn@latest add dialog dropdown-menu tooltip -y`. This writes
`components/ui/<name>.tsx` and installs any Radix deps. Already present:
`button`, `input`, `label`, `select`, `card`, `alert`.

This project's `components.json` is pinned to **`-b radix`** + the **`radix-nova`
preset** (the `style` field). If you ever re-init, keep those flags so new
components match the existing ones.

## What's already wired (don't recreate)

- **Config** — [components.json](../../../apps/web/components.json): `rsc: true`,
  aliases `@/components`, `@/components/ui`, `@/lib/utils`, base color `neutral`,
  icon library `lucide`.
- **`cn` helper** — [lib/utils.ts](../../../apps/web/lib/utils.ts)
  (`clsx` + `tailwind-merge`). Always merge incoming `className` through `cn`.
- **Theme tokens** — [app/globals.css](../../../apps/web/app/globals.css):
  Tailwind v4 `@theme inline` over CSS variables. Imports
  `tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css`.
- **Imports** — components use the **unified `radix-ui` package**
  (`import { Slot } from 'radix-ui'`), not per-package `@radix-ui/react-*`.
  Icons come from `lucide-react`.

## Theme conventions (important)

The shadcn semantic tokens are wired to Flowcore's brand:

- **Brand indigo is `--primary`** — use `bg-primary` / `text-primary` /
  `variant="default"` for primary actions and brand color. Do **not** use
  `--accent` for the brand; in shadcn semantics `--accent` is a subtle neutral
  hover background.
- **Secondary text is `text-muted-foreground`** — never `text-muted`
  (`--muted` is a background, not a text color). This was the #1 thing to fix
  when migrating the old hand-rolled styles.
- **Dark mode is the `.dark` class** (shadcn convention). It's applied from the
  system `prefers-color-scheme` by a no-flash inline script in
  [app/layout.tsx](../../../apps/web/app/layout.tsx) — so the app still auto-darks
  with no toggle. To add a real toggle later, just toggle the class on `<html>`;
  no component changes needed.
- Custom brand SVGs ([logo.tsx](../../../apps/web/components/logo.tsx),
  [brand-panel.tsx](../../../apps/web/components/brand-panel.tsx)) reference
  `var(--primary)` / `var(--primary-foreground)` directly.

## Sizing note

The `radix-nova` preset's default sizes are compact (Button/Input default to
`h-8`). The auth forms use `size="lg"` and an explicit `h-11`/`h-12` for a roomier
feel — match the surrounding screen rather than the bare default.

## Composition examples in-repo

- **Labelled input** — [components/field.tsx](../../../apps/web/components/field.tsx)
  composes `Label` + `Input` and keeps a `label`/`hint` API.
- **Submit button w/ spinner** — [components/submit-button.tsx](../../../apps/web/components/submit-button.tsx)
  wraps `Button` with a `lucide-react` `Loader2`.
- **Select** — [components/locale-switcher.tsx](../../../apps/web/components/locale-switcher.tsx)
  (client component; `onValueChange` gives the value directly).
- **Alert / Card** — error banners in the
  [auth pages](../../../apps/web/app/\(auth\)/) and the feature grid on the
  [landing page](../../../apps/web/app/page.tsx).

## Gotchas

- Interactive components (`select`, `dialog`, anything using hooks/Radix
  state) must live in a `'use client'` component.
- After adding, run `pnpm --filter web check-types && pnpm --filter web lint`.
  The generated `components/ui/*` files pass the repo's flat ESLint config as-is.
- `pnpm --filter web build` needs `API_ORIGIN` set (used by the `/api/*` rewrite
  in [next.config.ts](../../../apps/web/next.config.ts)) — unrelated to shadcn.

## Related

- UI copy must be translated, not hardcoded — see the `use-next-intl` skill.
- Data fetching/mutations in components — see the `use-react-query` skill.
- Per [apps/web/AGENTS.md](../../../apps/web/AGENTS.md), this is Next.js 16 with
  breaking changes from older versions — check `node_modules/next/dist/docs/`
  before writing Next-specific code.
