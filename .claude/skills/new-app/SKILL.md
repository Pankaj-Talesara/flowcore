---
name: new-app
description: Add a new application under apps/ in this Turborepo, wired to the shared @repo packages and Turbo pipeline. Use when the user wants a new deployable app — e.g. "add a Next.js web app", "scaffold an admin dashboard app", "create a second API". Covers wiring the shared eslint/typescript configs, the @repo/types contracts, and turbo scripts.
---

# Add a new app to `apps/`

Apps live under [apps/](../../../apps/) (the existing one is
[apps/api](../../../apps/api/)). An app is a workspace package whose scripts
(`dev`, `build`, `lint`, `check-types`) are driven by Turbo.

## Decide the type

- **Next.js frontend** — scaffold with the official generator, then wire it into
  the workspace (below). It should consume `@repo/types` for API contracts.
- **Another Fastify service** — copy the [apps/api](../../../apps/api/) layout
  (Fastify-CLI + `@fastify/autoload`).

## Next.js app

1. **Scaffold** into `apps/<name>` (use pnpm, TypeScript, App Router):

   ```bash
   pnpm dlx create-next-app@latest apps/<name> --ts --eslint --app --use-pnpm
   ```

2. **Wire shared config.** Replace the generated configs to use the repo's:

   - `apps/<name>/tsconfig.json` → `"extends": "@repo/typescript-config/nextjs.json"`
     (see [packages/typescript-config/nextjs.json](../../../packages/typescript-config/nextjs.json)).
   - `apps/<name>/eslint.config.mjs`:

     ```js
     import { nextJsConfig } from '@repo/eslint-config/next-js'

     /** @type {import("eslint").Linter.Config[]} */
     export default nextJsConfig
     ```

3. **Add workspace deps** to `apps/<name>/package.json`:

   ```jsonc
   "dependencies": {
     "@repo/types": "workspace:*"
   },
   "devDependencies": {
     "@repo/eslint-config": "workspace:*",
     "@repo/typescript-config": "workspace:*"
   }
   ```

   Compiled `@repo/*` packages work out of the box. If you ever consume one
   directly from source, add it to `transpilePackages` in `next.config`.

4. **Align scripts** with the Turbo pipeline ([turbo.json](../../../turbo.json)
   defines `build`, `dev`, `lint`, `check-types`). Ensure
   `package.json` exposes those names. Next's defaults already cover `dev`/
   `build`/`lint`; add `"check-types": "tsc --noEmit"`.

## Shared steps (any app)

5. **Install & verify** from the repo root:

   ```bash
   pnpm install
   pnpm --filter <name> lint
   pnpm --filter <name> check-types
   pnpm dev --filter <name>      # or `pnpm build --filter <name>`
   ```

6. `apps/*` is already covered by [pnpm-workspace.yaml](../../../pnpm-workspace.yaml),
   so no workspace-glob change is needed.

## Notes

- Keep all API request/response types in `@repo/types` — never redeclare a
  payload shape in the app.
- `.next/` build output is handled by the `build` task's `outputs` in
  `turbo.json`; nothing to configure per app.
