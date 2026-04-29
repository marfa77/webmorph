import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { CookieBanner } from '@/components/marketing/cookie-banner'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 max-w-6xl items-center justify-between">
          <Link href={withBasePath('/')} className="font-semibold">
            {siteConfig.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href={withBasePath('/pricing')} className="hover:text-foreground">
              Pricing
            </Link>
            <Link href={withBasePath('/docs')} className="hover:text-foreground">
              API
            </Link>
            <Link href={withBasePath('/tools')} className="hover:text-foreground">
              Resources
            </Link>
            <Link href={withBasePath('/playground')} className="hover:text-foreground">
              Playground
            </Link>
            <Button asChild size="sm">
              <Link href={withBasePath('/login')}>Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <CookieBanner />
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="container max-w-6xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}</p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href={withBasePath('/pricing')} className="hover:text-foreground">Pricing</Link>
            <Link href={withBasePath('/docs')} className="hover:text-foreground">API docs</Link>
            <Link href={withBasePath('/contact')} className="hover:text-foreground">Contact</Link>
            <Link href={withBasePath('/terms')} className="hover:text-foreground">Terms</Link>
            <Link href={withBasePath('/privacy')} className="hover:text-foreground">Privacy</Link>
            <Link href={withBasePath('/contact')} className="hover:text-foreground">Support</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
