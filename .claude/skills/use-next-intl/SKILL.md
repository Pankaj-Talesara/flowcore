---
name: use-next-intl
description: Add or change internationalized (i18n) UI copy in the web app (apps/web) using next-intl. Use when the user wants to add user-facing text, translate a component, add a locale/language, or work with messages/useTranslations. The app runs next-intl WITHOUT i18n routing (locale lives in a cookie, no /[locale] segment, no proxy).
---

# Use next-intl in `apps/web`

The web app is internationalized with [next-intl](https://next-intl.dev) running
in **"without i18n routing"** mode: there is **no `/[locale]` URL segment and no
`proxy.ts`** (Next 16 renamed Middleware → Proxy). The active locale lives in a
cookie and is resolved per request. This keeps the route tree flat.

## The moving parts

<!-- prettier-ignore -->
| File | Role |
| --- | --- |
| [i18n/config.ts](../../../apps/web/i18n/config.ts) | `locales`, `defaultLocale`, `localeLabels`, `LOCALE_COOKIE`. The list of supported languages. |
| [i18n/locale.ts](../../../apps/web/i18n/locale.ts) | `'use server'` actions `getUserLocale()` / `setUserLocale()` — read/write the locale cookie. |
| [i18n/request.ts](../../../apps/web/i18n/request.ts) | `getRequestConfig` — resolves the locale and dynamically imports its message catalog. Loaded by the plugin. |
| [next.config.ts](../../../apps/web/next.config.ts) | Wraps the config in `createNextIntlPlugin()`. |
| [messages/](../../../apps/web/messages/) | One JSON catalog per locale (`en.json`, `es.json`). **`en.json` is the source of truth.** |
| [global.d.ts](../../../apps/web/global.d.ts) | Types `Messages`/`Locale` off `en.json`, so message keys are autocompleted and type-checked. |
| [components/locale-switcher.tsx](../../../apps/web/components/locale-switcher.tsx) | Client `<select>` that calls `setUserLocale` then `router.refresh()`. |

## Reading translations in a component

`useTranslations` works in **both Server and Client Components** — no provider
prop needed. The root layout already wraps the tree in
`<NextIntlClientProvider>` ([app/layout.tsx](../../../apps/web/app/layout.tsx)),
which inherits locale + messages from `i18n/request.ts`.

```tsx
import { useTranslations } from 'next-intl'

export function Example() {
  const t = useTranslations('Login') // namespace
  return <h1>{t('title')}</h1> // -> messages.Login.title
}
```

- Keys are **type-checked against `en.json`** — a typo or missing key fails
  `pnpm check-types`. Add the key to **every** locale file.
- Dynamic keys (``t(`features.${k}.title`)``) are fine as long as the template
  resolves to a real key in the catalog.
- In async Server Components or non-component code, use
  `getTranslations` from `next-intl/server` instead (it's awaitable).

## Common tasks

### Add a new piece of UI copy

1. Add the key under the right namespace in **all** files in
   [messages/](../../../apps/web/messages/) (`en.json` first — it drives the
   types). Keep the namespace shape identical across locales.
2. Read it with `useTranslations('<Namespace>')` in the component. Don't
   hard-code user-facing strings in JSX.
3. `pnpm --filter web check-types` will flag any locale missing the key.

### Add a new locale (e.g. French)

1. Add `'fr'` to `locales` and a `fr` entry to `localeLabels` in
   [i18n/config.ts](../../../apps/web/i18n/config.ts).
2. Copy `messages/en.json` → `messages/fr.json` and translate every value.
   Keys must match `en.json` exactly.
3. Nothing else — `request.ts` imports `../messages/${locale}.json`
   dynamically and the switcher reads `locales` automatically.

### Translating API error codes

The API returns `{ code, message }` error envelopes. Map known codes to the
`Errors` namespace and translate them in
[lib/errors.ts](../../../apps/web/lib/errors.ts) via `t.has(code)` (guards that
copy exists) with a `GENERIC` fallback. Add the code as a key under `Errors` in
every catalog.

## Conventions

- **`en.json` is the source of truth** for both copy and types. Every other
  locale must have the same key shape.
- Don't put locale in the URL or add a `proxy.ts`/`middleware.ts` for i18n —
  this app is intentionally routing-free. Locale changes go through
  `setUserLocale` + `router.refresh()`.
- Keep code-like sample text (URLs, `{{variable}}` tokens) **out** of messages
  when it's identical across languages — see the `detail` lines in
  [components/brand-panel.tsx](../../../apps/web/components/brand-panel.tsx).

## Verify

```bash
pnpm --filter web check-types   # missing/typo'd message keys fail here
pnpm --filter web lint
pnpm --filter web build
```
