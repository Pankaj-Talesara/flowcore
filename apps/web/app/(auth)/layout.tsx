import { BrandPanel } from '@/components/brand-panel'
import { Logo } from '@/components/logo'
import { LocaleSwitcher } from '@/components/locale-switcher'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6">
          <span className="lg:invisible">
            <Logo />
          </span>
          <LocaleSwitcher />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
