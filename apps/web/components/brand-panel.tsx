import { Logo } from './logo'
import { useTranslations } from 'next-intl'

// Translatable title/badge live in messages; the mono `detail` lines are
// code-like examples (URLs, variable tokens) and stay verbatim across locales.
const STAGES = [
  { key: 'trigger', detail: 'webhook · POST /webhooks/wf_a1b2c3' },
  { key: 'step1', detail: 'Summarize {{trigger.issue.description}}' },
  { key: 'step2', detail: 'New ticket: {{steps.0.output.summary}}' },
  { key: 'execution', detail: '2 steps · logged · retried 0×' },
] as const

/**
 * The left-hand marketing panel. It renders an example workflow as a vertical
 * pipeline (trigger → steps → execution) so the auth screens reflect what
 * Flowcore actually does.
 */
export function BrandPanel() {
  const t = useTranslations('BrandPanel')

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
      {/* subtle grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(var(--background) 1px, transparent 1px), linear-gradient(90deg, var(--background) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative">
        <Logo />
      </div>

      <div className="relative max-w-md">
        <h2 className="text-2xl font-semibold leading-snug tracking-tight">{t('title')}</h2>
        <p className="mt-2 text-sm leading-6 text-background/70">{t('subtitle')}</p>

        <ol className="mt-8 space-y-3">
          {STAGES.map((stage, i) => (
            <li key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {i + 1}
                </span>
                {i < STAGES.length - 1 ? (
                  <span
                    className="mt-1 w-px flex-1"
                    style={{
                      background: 'var(--primary)',
                      animation: 'flow-pulse 2.4s ease-in-out infinite',
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                ) : null}
              </div>
              <div className="rounded-lg border border-background/15 bg-background/5 px-3.5 py-2.5">
                <span className="text-[10px] font-semibold tracking-widest text-background/50">
                  {t(`stages.${stage.key}.badge`)}
                </span>
                <p className="text-sm font-medium">{t(`stages.${stage.key}.title`)}</p>
                <p className="font-mono text-xs text-background/55">{stage.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="relative text-xs text-background/40">{t('footer')}</p>
    </div>
  )
}
