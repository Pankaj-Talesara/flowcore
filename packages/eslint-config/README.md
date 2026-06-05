# `@repo/eslint-config`

Shared ESLint flat configs for the Flowcore monorepo. Exported entry points:

| Subpath                              | Use for                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `@repo/eslint-config/base`           | Plain TypeScript packages (e.g. `@repo/types`, `@repo/utils`). |
| `@repo/eslint-config/next-js`        | Next.js apps (`apps/web`).                                     |
| `@repo/eslint-config/react-internal` | Internal React component packages.                             |

Consume it from a package's `eslint.config.mjs`:

```js
import { config } from '@repo/eslint-config/base'

/** @type {import("eslint").Linter.Config[]} */
export default config
```
