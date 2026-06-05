'use client'

import { setUserLocale } from '@/i18n/locale'
import { locales, localeLabels, type Locale } from '@/i18n/config'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function LocaleSwitcher() {
  const current = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onValueChange(next: string) {
    startTransition(async () => {
      await setUserLocale(next as Locale)
      router.refresh()
    })
  }

  return (
    <Select value={current} onValueChange={onValueChange} disabled={isPending}>
      <SelectTrigger size="sm" aria-label="Language" className="text-muted-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeLabels[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
