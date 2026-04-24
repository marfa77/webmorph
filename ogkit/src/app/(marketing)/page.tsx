import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="container max-w-4xl py-24">
      <p className="text-sm font-medium text-muted-foreground">{siteConfig.tagline}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
        Dynamic Open Graph images for any stack
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{siteConfig.description}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/playground">Try playground</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs">API reference</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </div>
  )
}
