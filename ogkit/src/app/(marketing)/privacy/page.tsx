import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Privacy Policy — ${siteConfig.name}`,
  alternates: { canonical: `${siteConfig.url}/privacy` },
}

export default function PrivacyPage() {
  const updated = 'April 29, 2026'
  return (
    <div className="container max-w-3xl py-16 prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: {updated}</p>

      <h2>1. Overview</h2>
      <p>
        {siteConfig.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates {siteConfig.url}. This Privacy Policy explains
        what information we collect, how we use it, and your rights regarding that information.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>Account data</h3>
      <p>
        When you sign up, we collect your email address and a hashed password. This is used solely to
        authenticate you and send service-related notifications.
      </p>
      <h3>API usage data</h3>
      <p>
        We log API requests (timestamp, API key identifier, template name, quota consumed) to enforce
        rate limits and calculate monthly usage. We do not store the full query parameters permanently.
      </p>
      <h3>Payment data</h3>
      <p>
        Payments are processed by Cryptomus. We receive a webhook notification confirming the plan and
        amount; we do not store your wallet address or any payment credentials.
      </p>
      <h3>Cookies and local storage</h3>
      <p>
        We use a session cookie for authentication. No third-party advertising or tracking cookies are
        set.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To provide and operate the Service;</li>
        <li>To enforce usage quotas and apply the correct plan;</li>
        <li>To send transactional emails (payment receipts, quota alerts);</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell, trade, or rent your personal data to third parties. We may share data with
        infrastructure providers (hosting, database) under confidentiality agreements, and with law
        enforcement if required by law.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        Account data is retained while your account is active and for up to 90 days after deletion.
        API logs are retained for 30 days for billing and debugging purposes.
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard measures (TLS in transit, encrypted storage at rest) to protect your
        data. No method of transmission over the internet is 100% secure; we cannot guarantee absolute
        security.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        Depending on your jurisdiction you may have the right to access, correct, or delete your
        personal data.         To exercise these rights, use our{' '}
        <a href="/contact">contact form</a>.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy at any time. Continued use of the Service after an update
        constitutes acceptance of the revised Policy.
      </p>

      <h2>9. Contact</h2>
      <p>
        Privacy questions should be directed to our{' '}
        <a href="/contact">contact form</a>.
      </p>
    </div>
  )
}
