---
name: use-react-query
description: Fetch or mutate server data in the web app (apps/web) with TanStack React Query. Use when the user wants to call the API from a component — load a list, submit a form, wire a button to a POST/DELETE, add loading/error states, or invalidate/refetch cached data. Covers useQuery, useMutation, and query invalidation against the Fastify API.
---

# Use React Query in `apps/web`

The web app uses [TanStack React Query](https://tanstack.com/query) for all
client-side server-state. The `QueryClientProvider` is already mounted in the
root layout via [components/query-provider.tsx](../../../apps/web/components/query-provider.tsx),
so any Client Component can call the hooks directly.

## The layers (keep them separate)

1. **`lib/instance.ts` — the shared axios client.** Exports one `apiClient`
   ([axios](https://axios-http.com) instance) created with `baseURL` +
   `withCredentials: true` so the httpOnly auth cookies are sent cross-origin.
   This is the only axios instance; never call `axios.create` elsewhere.
2. **`lib/apiUrls.ts` — the route registry.** Every API path lives here, one
   entry per route. Hooks reference `apiUrls.auth.login`, never a string
   literal like `'/auth/login'`. Add the path here first, then use it.
3. **`react-query/*.ts` — the hooks layer.** One file per resource
   (`react-query/auth.ts`, `react-query/workflows.ts`, …). Each exports
   `useXxx()` hooks that wrap `useMutation`/`useQuery`. The `mutationFn`/`queryFn`
   is **defined inline inside the hook** and calls `apiClient` directly with a
   path from `apiUrls`. **This is the only place `@tanstack/react-query` and
   `apiClient` are imported.**
4. **Components** import the `useXxx()` hooks — never `useMutation`/`useQuery`,
   `apiClient`, or `apiUrls` themselves.

```
component  ──>  react-query/<resource>.ts  ──>  apiClient + apiUrls  ──>  API
(useLogin)      (useMutation/useQuery,            (lib/instance.ts,
                 inline mutationFn/queryFn)         lib/apiUrls.ts)
```

> React Query hooks only run in **Client Components** (`'use client'`). For
> server-side data loading, fetch in a Server Component instead.

## Step 1: add the route to `lib/apiUrls.ts`

[lib/apiUrls.ts](../../../apps/web/lib/apiUrls.ts) is the single source of truth
for paths. Paths are relative — `apiClient` prepends the `baseURL`.

```ts
export const apiUrls = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  workflows: {
    list: '/workflows',
    create: '/workflows',
    byId: (id: string) => `/workflows/${id}`,
  },
} as const
```

- Group by resource. Use a function entry for parameterized paths (`byId`).
- **Never** hardcode a path string inside a hook — add it here and reference it.

## Step 2: add a hook in `react-query/`

See [react-query/auth.ts](../../../apps/web/react-query/auth.ts). The
`mutationFn`/`queryFn` is written **inline in the hook options** — there is no
separate fetcher file to import from. The fn calls `apiClient` with a path from
`apiUrls`.

Hooks accept a pass-through `options` (everything but the key and the
`mutationFn`/`queryFn`), so a component can attach `onSuccess`/`onError` without
the hook hard-coding navigation. Type the options with `UseMutationOptions`
(error typed as `AxiosError`) so callers and `mutation.error` stay typed.

```ts
// react-query/auth.ts
'use client'
import { apiClient } from '@/lib/instance'
import { apiUrls } from '@/lib/apiUrls'
import type { IUserLoginPayload, TCreateOrUpdateUserResponse } from '@repo/types/auth'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export function useLogin(
  options?: Omit<
    UseMutationOptions<TCreateOrUpdateUserResponse, AxiosError, IUserLoginPayload>,
    'mutationKey' | 'mutationFn'
  >,
) {
  return useMutation({
    mutationKey: ['LOGIN'],
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<TCreateOrUpdateUserResponse>(
        apiUrls.auth.login,
        payload,
      )
      return data
    },
    ...options,
  })
}
```

A query hook follows the same shape, with `invalidateQueries` to refetch a list
a mutation changed:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await apiClient.get<TWorkflowsResponse>(apiUrls.workflows.list)
      return data
    },
  })
}

export function useCreateWorkflow(options?: /* UseMutationOptions<…> */) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['CREATE_WORKFLOW'],
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<TWorkflowResponse>(apiUrls.workflows.create, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
    ...options,
  })
}
```

- **`queryKey`/`mutationKey` are defined inline** in the hook — there is no
  central keys file. Include every input the key depends on:
  `queryKey: ['workflows', id]`. Same key → shared cache. The key a query reads
  and the key a mutation invalidates must match — keep them as matching literals
  in the same resource file.
- Type the request/response with `@repo/types`. Don't redeclare shapes.

## Step 3: use the hook in a component

See [app/(auth)/login/page.tsx](<../../../apps/web/app/(auth)/login/page.tsx>)
and [app/(auth)/signup/page.tsx](<../../../apps/web/app/(auth)/signup/page.tsx>).

```tsx
'use client'
import { useLogin } from '@/react-query/auth'
import { translateError } from '@/lib/errors'
import { useTranslations } from 'next-intl'

const tErr = useTranslations('Errors')
const mutation = useLogin({
  onSuccess: () => {
    /* navigate, etc. */
  },
})

mutation.mutate({ email, password }) // in the submit handler
mutation.isPending // -> drive the submit button's disabled/spinner state
const error = translateError(mutation.error, tErr) // localized via the API error code
```

For a query:

```tsx
'use client'
import { useWorkflows } from '@/react-query/workflows'
const { data, isLoading, error } = useWorkflows()
```

- Drive the submit button's pending state from `mutation.isPending`, not local
  `useState`.
- Map errors through [lib/errors.ts](../../../apps/web/lib/errors.ts) so the API
  error `code` becomes localized copy (see the **use-next-intl** skill). Don't
  surface raw `err.message`.

## Conventions

- **Layers, never skipped:** component → `react-query/<resource>` →
  `apiClient` + `apiUrls`. A component importing `@tanstack/react-query`,
  `apiClient`, or `apiUrls` directly is a smell.
- `mutationFn`/`queryFn` live **inline** in the hook options — do not extract
  them into a separate `lib/api.ts` fetcher module.
- Every API path lives in `lib/apiUrls.ts`; hooks reference it, never a literal.
- `queryKey`/`mutationKey` are defined inline in the hook, not in a central
  registry; list every dependency in the key and keep read/invalidate keys
  matching within the resource file.
- All axios config (`baseURL`, `withCredentials`, headers) lives on the single
  `apiClient` in `lib/instance.ts`. Hooks don't repeat it.
- Prefer mutating + `invalidateQueries` over manually editing the cache.
- Errors surface as axios errors; translate via `lib/errors.ts`
  (`translateError` reads `error.response.data.code`).

## Verify

```bash
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```
