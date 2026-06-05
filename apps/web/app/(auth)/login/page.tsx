'use client'

import { useLogin } from '@/react-query/auth'
import { translateError } from '@/lib/utils'
import { Field } from '@/components/field'
import { SubmitButton } from '@/components/submit-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CircleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const t = useTranslations('Login')
  const tf = useTranslations('Fields')
  const tErr = useTranslations('Errors')

  const router = useRouter()
  const [clientError, setClientError] = useState<string | null>(null)

  const mutation = useLogin({
    onSuccess: () => {
      router.push('/')
      router.refresh()
    },
  })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClientError(null)

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (!email || !password) {
      setClientError(t('missingFields'))
      return
    }

    mutation.mutate({ email, password })
  }

  const error = clientError ?? translateError(mutation.error, tErr)

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field
          id="email"
          name="email"
          type="email"
          label={tf('email')}
          placeholder={tf('emailPlaceholder')}
          autoComplete="email"
          required
        />
        <Field
          id="password"
          name="password"
          type="password"
          label={tf('password')}
          placeholder={tf('passwordPlaceholder')}
          autoComplete="current-password"
          required
        />
        <SubmitButton pending={mutation.isPending} pendingLabel={t('submitPending')}>
          {t('submit')}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {t('createAccount')}
        </Link>
      </p>
    </div>
  )
}
