import type { useTranslations } from 'next-intl'
import { isCommonAxiosError } from '@/lib/typeGuards'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateError(error: unknown, t: ReturnType<typeof useTranslations<'Errors'>>) {
  if (!isCommonAxiosError(error)) {
    return t('GENERIC')
  }

  const { code, message } = error.response!.data

  return t(code as ErrorKeys) || message || t('GENERIC')
}
