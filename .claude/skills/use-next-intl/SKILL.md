---
name: use-next-intl
description: Add or change internationalized (i18n) UI copy in the web app (apps/web) using next-intl. Use when the user wants to add user-facing text, translate a component, add a locale/language, or work with messages/useTranslations. The app runs next-intl WITHOUT i18n routing (locale lives in a cookie, no /[locale] segment, no proxy).
---

# Use next-intl in `apps/web`

[next-intl](https://next-intl.dev) in **"without i18n routing"** mode: **no `/[locale]` segment, no `proxy.ts`** (Next 16 renamed Middleware → Proxy). Active locale lives in a cookie, resolved per request. Route tree stays flat.

| File | Role |
| --- | --- |
| [i18n/config.ts](../../../apps/web/i18n/config.ts) | `locales`, `defaultLocale`, `localeLabels`, `LOCALE_COOKIE`. |
| [i18n/locale.ts](../../../apps/web/i18n/locale.ts) | `'use server'` `getUserLocale()`/`setUserLocale()` — read/write the cookie. |
| [i18n/request.ts](../../../apps/web/i18n/request.ts) | `getRequestConfig` — resolves locale, imports its catalog. |
| [next.config.ts](../../../apps/web/next.config.ts) | Wraps config in `createNextIntlPlugin()`. |
| [messages/](../../../apps/web/messages/) | One JSON catalog per locale. **`en.json` is the source of truth.** |
| [global.d.ts](../../../apps/web/global.d.ts) | Types `Messages`/`Locale` off `en.json` — keys are type-checked. |
| [components/locale-switcher.tsx](../../../apps/web/components/locale-switcher.tsx) | Client `<select>`: `setUserLocale` then `router.refresh()`. |

## Read translations

`useTranslations` works in **both Server and Client Components** — the root layout wraps the tree in `<NextIntlClientProvider>`, no provider prop needed.

```tsx
import { useTranslations } from 'next-intl'
const t = useTranslations('Login')   // namespace
return <h1>{t('title')}</h1>           // -> messages.Login.title
```

- Keys are **type-checked against `en.json`** — a typo/missing key fails `check-types`. Add the key to **every** locale file.
- Dynamic keys (``t(`features.${k}.title`)``) are fine if they resolve to a real key.
- In async Server Components / non-component code, use `getTranslations` from `next-intl/server`.

## Tasks

**Add UI copy**: add the key under the right namespace in **all** [messages/](../../../apps/web/messages/) files (`en.json` first), read with `useTranslations('<Namespace>')`. Never hard-code user-facing strings. `check-types` flags any locale missing the key.

**Add a locale** (e.g. French): add `'fr'` to `locales` + a `fr` entry to `localeLabels` in [config.ts](../../../apps/web/i18n/config.ts); copy `en.json`→`fr.json` and translate every value (keys must match exactly). `request.ts` imports dynamically; the switcher reads `locales` automatically.

**Translate API error codes**: API returns `{ code, message }`. Map codes to the `Errors` namespace in [lib/errors.ts](../../../apps/web/lib/errors.ts) via `t.has(code)` with a `GENERIC` fallback. Add each code under `Errors` in every catalog.

## Conventions

- `en.json` is the source of truth for copy + types; every locale matches its key shape.
- No locale in the URL, no `proxy.ts`/`middleware.ts` for i18n — locale changes go through `setUserLocale` + `router.refresh()`.
- Keep code-like text identical across languages (URLs, `{{variable}}` tokens) **out** of messages.

Verify: `pnpm --filter web check-types && pnpm --filter web lint && pnpm --filter web build`
