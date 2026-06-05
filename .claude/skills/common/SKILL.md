---
name: common
description: Common code conventions that apply across the whole repo (not tied to one feature or package). Use whenever you write or edit code in this repo — especially React/TypeScript in apps/web — to follow the shared rules on imports and style. Consult this alongside any more specific skill.
---

# Common conventions

Rules that hold everywhere in this repo. More specific skills (use-react-query,
add-shadcn-component, …) build on top of these — they never override them.

## React imports

**Always import the named bindings you use from `react`. Never use a namespace
import or the `React.` qualifier.**

```ts
// ✅ do this
import { useState, useEffect, type FormEvent, type ReactNode } from 'react'

const [open, setOpen] = useState(false)
function onSubmit(e: FormEvent<HTMLFormElement>) { /* … */ }
type Props = { children: ReactNode }
```

```ts
// ❌ never
import * as React from 'react'
import React from 'react'

React.useState(false)
React.FormEvent
e: React.FormEvent<HTMLFormElement>
```

- This applies to **values** (`useState`, `useRef`, `useCallback`, …), **types**
  (`ReactNode`, `FormEvent`, `ComponentProps`, `Dispatch`, …), and everything
  else off the `React` namespace — import each by name instead.
- The app uses the modern JSX transform, so `React` does not need to be in scope
  to render JSX. There is no reason to import the namespace.
- Use `import type { … }` (or inline `type`) for type-only React imports.
