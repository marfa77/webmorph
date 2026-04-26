import Link from 'next/link'
import { withBasePath } from '@/config/paths'

/** Standard CTA on programmatic SEO pages (no “Phase” placeholders). */
export function FinishCta() {
  return (
    <div className="mt-8 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
      <p>
        OGKit turns one HTTPS URL into a 1200×630 Open Graph image. Read the{' '}
        <Link className="font-medium text-foreground underline" href={withBasePath('/docs')}>
          API reference
        </Link>
        , try the{' '}
        <Link className="font-medium text-foreground underline" href={withBasePath('/playground')}>
          Playground
        </Link>
        , or{' '}
        <Link className="font-medium text-foreground underline" href={withBasePath('/login')}>
          sign in
        </Link>{' '}
        to create API keys.
      </p>
    </div>
  )
}
