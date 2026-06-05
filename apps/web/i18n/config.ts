export enum Locale {
  English = 'en',
  Espanol = 'es',
}

export const locales = Object.values(Locale)

export const defaultLocale: Locale = Locale.English

export const localeLabels: Record<Locale, string> = {
  [Locale.English]: 'English',
  [Locale.Espanol]: 'Español',
}

export const LOCALE_COOKIE = 'NEXT_LOCALE'
