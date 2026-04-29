import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Terms of Service — ${siteConfig.name}`,
  alternates: { canonical: `${siteConfig.url}/terms` },
}

export default function TermsPage() {
  const updated = 'April 29, 2026'
  return (
    <div className="container max-w-3xl py-16 prose prose-sm dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground text-sm">Last updated: {updated}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using {siteConfig.name} (&ldquo;Service&rdquo;) at {siteConfig.url}, you agree to be bound
        by these Terms of Service. If you do not agree, please do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        {siteConfig.name} is an Open Graph image generation API. It generates dynamic social preview
        images (1200×630 PNG) from templates via URL parameters. The Service offers a free tier with a
        monthly image quota and paid tiers (Pro, Scale) unlocked via cryptocurrency checkout.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old and capable of forming a binding contract to use the Service.
        By using the Service, you represent that you meet these requirements.
      </p>

      <h2>4. Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your API key. All activity that
        occurs under your API key is your responsibility. Notify us immediately at{' '}
        <a href="/contact">use the contact form</a> if you suspect
        unauthorized use.
      </p>

      <h2>5. Payments</h2>
      <p>
        Paid plans are billed monthly and settled via cryptocurrency through Cryptomus. All payments are
        non-refundable unless otherwise required by law. Quota is granted for the current calendar month
        from the date of payment and does not carry over.
      </p>

      <h2>6. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Generate images containing illegal, harmful, or abusive content;</li>
        <li>Circumvent rate limits, quota systems, or access controls;</li>
        <li>Resell API access or sublicense your API key to third parties;</li>
        <li>Violate any applicable laws or regulations.</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        You retain ownership of any content you supply as query parameters. {siteConfig.name} retains
        ownership of the Service, templates, and generated image infrastructure. You are granted a
        non-exclusive, non-transferable licence to use the generated images for lawful purposes.
      </p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranty of any kind. {siteConfig.name} does not warrant
        that the Service will be uninterrupted, error-free, or free of harmful components.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, {siteConfig.name} shall not be liable for any indirect,
        incidental, special, or consequential damages arising out of or in connection with the Service.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may update these Terms at any time. Continued use of the Service after changes are posted
        constitutes acceptance of the revised Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms should be directed to our{' '}
        <a href="/contact">contact form</a>.
      </p>
    </div>
  )
}
