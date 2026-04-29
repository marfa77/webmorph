import { siteConfig } from '@/config/site'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: `Contact — ${siteConfig.name}`,
  alternates: { canonical: `${siteConfig.url}/contact` },
}

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        Have a question about {siteConfig.name}, your API key, or a billing issue? We&apos;re here to help.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General &amp; API support</CardTitle>
            <CardDescription>Questions about the API, templates, and integration</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="text-sm font-medium underline hover:text-foreground"
            >
              {siteConfig.supportEmail}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing &amp; payments</CardTitle>
            <CardDescription>Crypto payment issues, quota, plan upgrades</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={`mailto:${siteConfig.supportEmail}?subject=Billing%20inquiry`}
              className="text-sm font-medium underline hover:text-foreground"
            >
              {siteConfig.supportEmail}
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Response time</p>
        <p className="mt-1">
          We typically respond within 1 business day. For faster help, include your API key identifier
          (not the secret key itself) and a description of the issue.
        </p>
      </div>
    </div>
  )
}
