import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import { siteConfig } from '@/config/site'
import './globals.css'

/** Cryptomus domain verification — https://app.cryptomus.com/ (meta name="cryptomus"). Override via env if the wizard value changes. */
const cryptomusSiteVerify =
  process.env.NEXT_PUBLIC_CRYPTOMUS_SITE_VERIFICATION?.trim() ?? 'e78d84f1'

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  other: { cryptomus: cryptomusSiteVerify },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.trim() }
    : undefined,
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  keywords: [
    'Open Graph image API',
    'Twitter card image generator',
    'dynamic OG images',
    'og:image API',
    'social preview image API',
    'Next.js Open Graph images',
    'Next.js metadata openGraph images',
    'Vercel OG alternative',
    '@vercel/og alternative',
    'OG image generator',
    '1200x630 PNG',
    'Satori alternative hosted',
    'Bannerbear alternative',
    'Placid alternative',
    'crypto SaaS API',
    'LLM-friendly API documentation',
  ],
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: 'OGKit - Open Graph image API',
    description: siteConfig.description,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OGKit dynamic Open Graph image API' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OGKit - Open Graph image API',
    description: siteConfig.description,
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Ahrefs Web Analytics — install snippet exactly as in Ahrefs dashboard (head + data-key + async) */}
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="mxElZupDL+Tyl+iGuMaCew"
          async
        />
      </head>
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
