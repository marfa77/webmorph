import Link from 'next/link'
import { withBasePath } from '@/config/paths'
import { siteConfig } from '@/config/site'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { ContactForm } from './contact-form'

export const metadata = marketingMetadata({
  title: 'Contact OGKit — billing, Cryptomus checkout & API support',
  description:
    'Billing, Cryptomus checkout, API keys, or template issues: use the secure form. Include the first 8 characters of your key and URLs — never paste the full secret.',
  pathname: '/contact',
})

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        Have a question about {siteConfig.name}, billing, or a product issue? Use the form below.
        Email is required so we can reply when a response is needed. For self-serve answers, read the{' '}
        <Link className="text-primary underline" href={withBasePath('/docs')}>
          API docs
        </Link>{' '}
        and the{' '}
        <Link className="text-primary underline" href={withBasePath('/blog/open-graph-images-seo-guide')}>
          Open Graph SEO guide
        </Link>
        .
      </p>

      <div className="mt-5 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        After a successful submission, the page shows a delivery confirmation. Messages are routed to
        our operations channel and reviewed when possible.
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What to include</p>
        <ul className="mt-2 space-y-1">
          <li>• Your API key identifier (first 8 chars only, not the full key)</li>
          <li>• The URL or endpoint you&apos;re having trouble with</li>
          <li>• Expected vs actual behaviour</li>
        </ul>
      </div>
    </div>
  )
}
