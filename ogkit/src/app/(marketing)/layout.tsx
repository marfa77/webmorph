import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Ga4 } from '@/components/analytics/ga4'
import { Button } from '@/components/ui/button'
import { CookieBanner } from '@/components/marketing/cookie-banner'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Ga4 />
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={withBasePath('/')} className="font-heading text-lg font-bold tracking-tight text-gray-900">
            {siteConfig.name}
          </Link>
          <nav className="flex items-center gap-3 text-sm text-gray-600 sm:gap-5">
            <Link href={withBasePath('/playground')} className="hidden hover:text-gray-900 sm:inline">
              Playground
            </Link>
            <Link href={withBasePath('/docs')} className="hover:text-gray-900">
              API
            </Link>
            <Link href={withBasePath('/guides')} className="hidden hover:text-gray-900 md:inline">
              Guides
            </Link>
            <Link href={withBasePath('/pricing')} className="hover:text-gray-900">
              Pricing
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-brand px-4 font-semibold text-white hover:bg-brand-light"
            >
              <Link href={withBasePath('/login')}>Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <CookieBanner />
      <footer className="border-t border-gray-100 bg-white py-8 text-sm text-gray-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {siteConfig.name} ·{' '}
            <Link href="/" className="font-heading font-semibold text-gray-800 hover:text-brand">
              webmorp<span className="text-brand">.art</span>
            </Link>
          </p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/" className="hover:text-gray-900">
              Websites — $100
            </Link>
            <Link href={withBasePath('/pricing')} className="hover:text-gray-900">
              Pricing
            </Link>
            <Link href={withBasePath('/docs')} className="hover:text-gray-900">
              API docs
            </Link>
            <Link href={withBasePath('/guides')} className="hover:text-gray-900">
              Guides
            </Link>
            <Link href={withBasePath('/blog')} className="hover:text-gray-900">
              Blog
            </Link>
            <Link href={withBasePath('/contact')} className="hover:text-gray-900">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
