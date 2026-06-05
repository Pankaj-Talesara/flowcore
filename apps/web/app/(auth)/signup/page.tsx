'use client'

import { useRegister } from '@/react-query/auth'
import { translateError } from '@/lib/utils'
import { Field } from '@/components/field'
import { SubmitButton } from '@/components/submit-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CircleAlert } from 'lucide-react'
import { NAME_REGEX, PASSWORD_REGEX, EMAIL_REGEX } from '@repo/utils/validation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const t = useTranslations('Signup')
  const tf = useTranslations('Fields')
  const tErr = useTranslations('Errors')
  const router = useRouter()
  const [clientError, setClientError] = useState<string | null>(null)

  const mutation = useRegister({
    onSuccess: () => {
      router.push('/')
      router.refresh()
    },
  })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClientError(null)

    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (!NAME_REGEX.test(name)) {
      setClientError(t('validation.name'))
      return
    }
    if (!EMAIL_REGEX.test(email)) {
      setClientError(t('validation.email'))
      return
    }
    if (!PASSWORD_REGEX.test(password)) {
      setClientError(t('validation.password'))
      return
    }

    mutation.mutate({ name, email, password })
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
          id="name"
          name="name"
          type="text"
          label={tf('name')}
          placeholder={tf('namePlaceholder')}
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          hint={tf('passwordHint')}
          required
        />
        <SubmitButton pending={mutation.isPending} pendingLabel={t('submitPending')}>
          {t('submit')}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </div>
  )
}
