import { Logo } from '@/components/logo'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const FEATURE_KEYS = ['triggers', 'steps', 'executions'] as const

export default function Home() {
  const t = useTranslations('Home')
  const tNav = useTranslations('Nav')

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <LocaleSwitcher />
          <Button asChild variant="ghost" size="lg">
            <Link href="/login">{tNav('signIn')}</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/signup">{tNav('getStarted')}</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          {t('badge')}
        </span>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">{t('subtitle')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-6 text-sm">
            <Link href="/signup">{t('ctaPrimary')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6 text-sm">
            <Link href="/login">{t('ctaSecondary')}</Link>
          </Button>
        </div>

        <div className="mt-20 grid w-full gap-4 text-left sm:grid-cols-3">
          {FEATURE_KEYS.map((key) => (
            <Card key={key} size="sm">
              <CardHeader>
                <CardTitle className="text-primary">{t(`features.${key}.title`)}</CardTitle>
                <CardDescription className="leading-6">{t(`features.${key}.body`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
