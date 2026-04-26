import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/signout'
import { Button } from '@/components/ui/button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 max-w-6xl items-center justify-between">
          <Link href={withBasePath('/')} className="text-sm font-semibold">
            {siteConfig.name}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href={withBasePath('/dashboard')} className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href={withBasePath('/playground')} className="text-muted-foreground hover:text-foreground">
              Playground
            </Link>
            {user ? (
              <form action={signOut}>
                <Button type="submit" size="sm" variant="outline">
                  Sign out
                </Button>
              </form>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href={withBasePath('/login')}>Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href={withBasePath('/')}>Home</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
