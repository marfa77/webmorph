import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: `Tools — ${siteConfig.name}` }

const items = [
  {
    href: '/playground',
    title: 'Playground',
    desc: 'Pick a template, fill in fields, and see a 1200×630 preview with a copyable image URL.',
  },
  {
    href: '/docs',
    title: 'API reference',
    desc: 'All templates, query parameters, authentication, and error codes in one place.',
  },
] as const

const external: { href: string; label: string }[] = [
  { href: 'https://www.opengraph.xyz', label: 'opengraph.xyz — link preview debugger' },
  { href: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards', label: "Twitter (X) Cards docs" },
]

export default function ToolsPage() {
  return (
    <div className="container max-w-3xl space-y-10 py-12">
      <div>
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="mt-2 text-muted-foreground">Built into {siteConfig.name} and a few vetted third-party checkers for meta tags.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{i.title}</CardTitle>
                <CardDescription>{i.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary">Open →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">External (validation)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {external.map((e) => (
            <li key={e.href}>
              <a href={e.href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {e.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Third-party services are not affiliated with {siteConfig.name}. Use them to verify `og:*` and Twitter tags after
          you deploy.
        </p>
        <Button asChild className="mt-4" variant="outline" size="sm">
          <Link href="/login">Sign in for API keys</Link>
        </Button>
      </div>
    </div>
  )
}
