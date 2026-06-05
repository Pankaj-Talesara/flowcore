# `web`

The Flowcore web app — [Next.js 16](https://nextjs.org) (App Router, React 19),
Tailwind v4 + [shadcn/ui](https://ui.shadcn.com), internationalized with
[next-intl](https://next-intl.dev), and server state via
[TanStack React Query](https://tanstack.com/query).

> **Next.js 16 has breaking changes** from earlier versions — see
> [AGENTS.md](AGENTS.md) and check `node_modules/next/dist/docs/` before writing
> Next-specific code.

## Layout

- `app/` — App Router tree. `(auth)/` holds the login/signup screens; `layout.tsx`
  mounts the React Query and next-intl providers and the no-flash dark-mode script.
- `components/` — `ui/` are shadcn primitives (owned in-repo); the rest are
  composed app components (`field`, `submit-button`, `locale-switcher`, …).
- `lib/` — `api.ts` (the only place `fetch` lives; routed through `/api`, typed
  with `@repo/types`), `errors.ts` (maps API error `code`s to localized copy),
  `utils.ts` (`cn`).
- `i18n/` — next-intl config (no `/[locale]` segment; locale lives in a cookie).
- `messages/` — one JSON catalog per locale (`en.json` is the source of truth).

## Environment

- **`API_ORIGIN`** — origin the `/api/*` rewrite proxies to (the Fastify API),
  keeping the httpOnly auth cookies same-origin. Required for `dev` and `build`
  (see [next.config.ts](next.config.ts)).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm --filter web dev` | Run the dev server. |
| `pnpm --filter web build` | Production build (needs `API_ORIGIN`). |
| `pnpm --filter web lint` | Lint. |
| `pnpm --filter web check-types` | Type-check (also flags missing/typo'd i18n keys). |

## Conventions

These map to skills in [.claude/skills/](../../.claude/skills/):
`add-shadcn-component`, `use-next-intl`, `use-react-query`. UI copy is
translated (never hardcoded); all network calls go through `lib/api.ts`; build
UI from shadcn primitives rather than hand-rolling.
