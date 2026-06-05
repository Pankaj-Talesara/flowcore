---
name: add-shadcn-component
description: Add or use a shadcn/ui component in the web app (apps/web). Use when the user wants UI built from shadcn primitives — e.g. "add a dialog", "use shadcn for this form", "add a dropdown menu", "build a settings card". Covers running the shadcn CLI in this Next.js 16 + Tailwind v4 + React 19 setup, the project's theme conventions (brand indigo = --primary, .dark class), and where the pieces live.
---

# Add a shadcn/ui component to `apps/web`

shadcn is initialized. Components are **copied into the repo** (not a dependency) under [components/ui/](../../../apps/web/components/ui/) — you own/edit them. Don't hand-roll a button/input/dialog when shadcn ships one.

## Add a component

Run **from `apps/web`** (where [components.json](../../../apps/web/components.json) lives):

```bash
cd apps/web && pnpm dlx shadcn@latest add <name> [<name>...] -y
```

Writes `components/ui/<name>.tsx` + installs Radix deps. Already present: `button`, `input`, `label`, `select`, `card`, `alert`. `components.json` is pinned to **`-b radix`** + the **`radix-nova`** preset — keep those flags if re-initializing.

## Already wired (don't recreate)

- **Config** — [components.json](../../../apps/web/components.json): `rsc: true`, aliases `@/components`, `@/components/ui`, `@/lib/utils`, base color `neutral`, icons `lucide`.
- **`cn` helper** — [lib/utils.ts](../../../apps/web/lib/utils.ts) (`clsx` + `tailwind-merge`). Always merge incoming `className` through `cn`.
- **Theme tokens** — [app/globals.css](../../../apps/web/app/globals.css): Tailwind v4 `@theme inline` over CSS vars.
- **Imports** — unified `radix-ui` package (`import { Slot } from 'radix-ui'`), not `@radix-ui/react-*`. Icons from `lucide-react`.

## Theme conventions

- **Brand indigo is `--primary`** — `bg-primary`/`text-primary`/`variant="default"` for primary actions. `--accent` is a subtle neutral hover bg, **not** the brand.
- **Secondary text is `text-muted-foreground`**, never `text-muted` (`--muted` is a background).
- **Dark mode is the `.dark` class**, applied from `prefers-color-scheme` by a no-flash inline script in [app/layout.tsx](../../../apps/web/app/layout.tsx). A real toggle = toggle the class on `<html>`.
- Brand SVGs ([logo.tsx](../../../apps/web/components/logo.tsx), [brand-panel.tsx](../../../apps/web/components/brand-panel.tsx)) use `var(--primary)` directly.

## Sizing

`radix-nova` defaults are compact (Button/Input `h-8`). Auth forms use `size="lg"` + explicit `h-11`/`h-12` — match the surrounding screen, not the bare default.

## In-repo composition examples

- Labelled input — [field.tsx](../../../apps/web/components/field.tsx) (`Label`+`Input`, `label`/`hint` API).
- Submit + spinner — [submit-button.tsx](../../../apps/web/components/submit-button.tsx) (`Button` + `Loader2`).
- Select — [locale-switcher.tsx](../../../apps/web/components/locale-switcher.tsx) (client; `onValueChange`).
- Alert/Card — [auth pages](../../../apps/web/app/\(auth\)/), landing [page.tsx](../../../apps/web/app/page.tsx).

## Gotchas

- Interactive components (hooks/Radix state) must be in a `'use client'` component.
- After adding: `pnpm --filter web check-types && pnpm --filter web lint`.
- `pnpm --filter web build` needs `API_ORIGIN` set (the `/api/*` rewrite in [next.config.ts](../../../apps/web/next.config.ts)) — unrelated to shadcn.
- Next.js 16 has breaking changes ([apps/web/AGENTS.md](../../../apps/web/AGENTS.md)) — check `node_modules/next/dist/docs/` before Next-specific code.

## Related

- UI copy must be translated — see `use-next-intl`. Data fetching — see `use-react-query`.
