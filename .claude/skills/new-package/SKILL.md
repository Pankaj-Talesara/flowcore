---
name: new-package
description: Scaffold a new shared workspace package under packages/ in this Turborepo. Use when the user wants a new internal library — e.g. "create a @repo/utils package", "add a shared logger package", "make a @repo/ui package". Sets up package.json, tsconfig, and eslint following the @repo/* convention and the compiled-package pattern used by @repo/types.
---

# Create a new `@repo/*` package

Shared packages live under [packages/](../../../packages/) and use the
`@repo/<name>` namespace. The repo already has `@repo/typescript-config`,
`@repo/eslint-config`, and the compiled-package reference
[@repo/types](../../../packages/types/) — copy its layout for any package that
ships runtime code.

## Steps

1. **Create `packages/<name>/package.json`** (compiled-package pattern):

   ```jsonc
   {
     "name": "@repo/<name>",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "default": "./dist/index.js"
       }
     },
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch --preserveWatchOutput",
       "check-types": "tsc --noEmit",
       "lint": "eslint . --max-warnings 0",
       "clean": "rm -rf dist .turbo"
     },
     "devDependencies": {
       "@repo/eslint-config": "workspace:*",
       "@repo/typescript-config": "workspace:*",
       "typescript": "5.9.2"
     }
   }
   ```

   - Add a subpath to `exports` for each entry point you want consumers to
     import directly (e.g. `"./logger"`), pointing at `./dist/<file>.js`.
   - For a **types-only / config-only** package (like `typescript-config`), drop
     the build tooling and just export the static files.

2. **`packages/<name>/tsconfig.json`**:

   ```jsonc
   {
     "extends": "@repo/typescript-config/base.json",
     "compilerOptions": { "rootDir": "src", "outDir": "dist" },
     "include": ["src"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **`packages/<name>/eslint.config.mjs`**:

   ```js
   import { config } from '@repo/eslint-config/base'

   /** @type {import("eslint").Linter.Config[]} */
   export default config
   ```

4. **`packages/<name>/src/index.ts`** — the entry point. Use `.js` extensions on
   relative imports (NodeNext resolution from the base tsconfig).

5. **Add a `README.md`** documenting the package's purpose, exports, and scripts
   (see [@repo/types/README.md](../../../packages/types/README.md) for the
   format).

6. **Install & verify**:

   ```bash
   pnpm install                       # links the workspace package
   pnpm --filter @repo/<name> build
   pnpm --filter @repo/<name> lint
   ```

## Consuming the package

Add `"@repo/<name>": "workspace:*"` to the dependent app/package and run
`pnpm install`. Turbo's `build` task already declares `dependsOn: ["^build"]`
([turbo.json](../../../turbo.json)), so dependencies build first automatically —
no pipeline changes needed.

## Notes

- `dist/` is git-ignored repo-wide; commit only `src/` and config.
- Match the existing `5.9.2` TypeScript version to keep the workspace on one
  compiler.
