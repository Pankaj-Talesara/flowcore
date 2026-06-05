'use server'

import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'
import { COOKIES_KEYS } from '@/lib/constants'

const { LOCALE_COOKIE } = COOKIES_KEYS

export async function getUserLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value

  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale
}

export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies()

  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
