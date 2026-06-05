---
name: scaffold-workspace
description: Scaffold a new workspace member in this Turborepo — an app under apps/ or a shared @repo/* package under packages/ — wired to the shared eslint/typescript configs and the Turbo pipeline. Use for "add a Next.js web app", "scaffold an admin dashboard", "create a second API", "create a @repo/utils package", "add a shared logger package", "make a @repo/ui package".
---

# Scaffold a workspace member

Two kinds, same wiring (shared `@repo/eslint-config` + `@repo/typescript-config`, Turbo-driven `dev`/`build`/`lint`/`check-types`). `apps/*` and `packages/*` are already globbed by [pnpm-workspace.yaml](../../../pnpm-workspace.yaml) — no glob change. Turbo's `build` `dependsOn: ["^build"]` ([turbo.json](../../../turbo.json)), so deps build first automatically.

---

## A) App under `apps/`

Existing: [apps/api](../../../apps/api/). Always consume `@repo/types` for API contracts — never redeclare a payload shape in the app.

### Next.js frontend

1. Scaffold: `pnpm dlx create-next-app@latest apps/<name> --ts --eslint --app --use-pnpm`
2. Wire shared config:
   - `tsconfig.json` → `"extends": "@repo/typescript-config/nextjs.json"`
   - `eslint.config.mjs`:
     ```js
     import { nextJsConfig } from '@repo/eslint-config/next-js'
     /** @type {import("eslint").Linter.Config[]} */
     export default nextJsConfig
     ```
3. Deps in `package.json`: `"@repo/types": "workspace:*"` (deps); `"@repo/eslint-config"`, `"@repo/typescript-config"` (devDeps), all `workspace:*`. Compiled `@repo/*` work out of the box; if consuming one from source, add it to `transpilePackages` in `next.config`.
4. Scripts: Next covers `dev`/`build`/`lint`; add `"check-types": "tsc --noEmit"`.

### Another Fastify service

Copy the [apps/api](../../../apps/api/) layout (Fastify-CLI + `@fastify/autoload`).

---

## B) Package under `packages/`

`@repo/<name>` namespace. Copy the compiled-package reference [@repo/types](../../../packages/types/).

1. `package.json` (compiled pattern):
   ```jsonc
   {
     "name": "@repo/<name>", "version": "0.0.0", "private": true, "type": "module",
     "main": "./dist/index.js", "types": "./dist/index.d.ts",
     "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
     "scripts": {
       "build": "tsc", "dev": "tsc --watch --preserveWatchOutput",
       "check-types": "tsc --noEmit", "lint": "eslint . --max-warnings 0", "clean": "rm -rf dist .turbo"
     },
     "devDependencies": {
       "@repo/eslint-config": "workspace:*", "@repo/typescript-config": "workspace:*", "typescript": "5.9.2"
     }
   }
   ```
   - Add a subpath to `exports` per entry point (e.g. `"./logger": ... "./dist/logger.js"`).
   - **Types/config-only** package (like `typescript-config`): drop the build tooling, export the static files.
2. `tsconfig.json`:
   ```jsonc
   { "extends": "@repo/typescript-config/base.json",
     "compilerOptions": { "rootDir": "src", "outDir": "dist" },
     "include": ["src"], "exclude": ["node_modules", "dist"] }
   ```
3. `eslint.config.mjs`:
   ```js
   import { config } from '@repo/eslint-config/base'
   /** @type {import("eslint").Linter.Config[]} */
   export default config
   ```
4. `src/index.ts` — entry point. Use `.js` extensions on relative imports (NodeNext).
5. Add a `README.md` (see [@repo/types/README.md](../../../packages/types/README.md)).
6. **Consume**: add `"@repo/<name>": "workspace:*"` to the dependent, `pnpm install`.

---

## Verify (both)

```bash
pnpm install
pnpm --filter <name> lint
pnpm --filter <name> check-types
pnpm --filter <name> build   # apps: or `pnpm dev --filter <name>`
```

## Notes

- Match the workspace TypeScript version `5.9.2`.
- `dist/` and `.next/` are git-ignored / handled by Turbo `outputs` — commit only `src/` and config.
