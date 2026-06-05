---
name: common
description: Common code conventions that apply across the whole repo (not tied to one feature or package). Use whenever you write or edit code in this repo — especially React/TypeScript in apps/web — to follow the shared rules on imports and style. Consult this alongside any more specific skill.
---

# Common conventions

Hold everywhere. More specific skills build on these, never override them.

## React imports

Import named bindings from `react`. Never a namespace import or `React.` qualifier.

```ts
// ✅
import { useState, type FormEvent, type ReactNode } from 'react'
// ❌
import * as React from 'react'   // then React.useState, e: React.FormEvent
```

- Applies to values (`useState`, `useRef`, …) **and** types (`ReactNode`, `FormEvent`, `ComponentProps`, …) — import each by name.
- Modern JSX transform: `React` need not be in scope to render JSX.
- Use `import type { … }` (or inline `type`) for type-only imports.
