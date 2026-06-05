import { UseMutationOptions } from '@tanstack/react-query'
import type { useTranslations } from 'next-intl'

declare global {
  type TMutationOptions<Data, Variables> = Omit<
    UseMutationOptions<Data, Error, Variables>,
    'mutationKey' | 'mutationFn'
  >

  type ErrorKeys = Parameters<ReturnType<typeof useTranslations<'Errors'>>>[0]
}
