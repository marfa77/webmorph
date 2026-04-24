import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 max-w-6xl items-center justify-between">
          <Link href="/" className="font-semibold">
            {siteConfig.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              API
            </Link>
            <Link href="/tools" className="hover:text-foreground">
              Resources
            </Link>
            <Link href="/playground" className="hover:text-foreground">
              Playground
            </Link>
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}
      </footer>
    </div>
  )
}
