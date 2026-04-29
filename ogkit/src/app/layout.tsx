import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { siteConfig } from '@/config/site'
import './globals.css'

/** Cryptomus domain verification — https://app.cryptomus.com/ (meta name="cryptomus"). Override via env if the wizard value changes. */
const cryptomusSiteVerify =
  process.env.NEXT_PUBLIC_CRYPTOMUS_SITE_VERIFICATION?.trim() ?? 'e78d84f1'

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  other: { cryptomus: cryptomusSiteVerify },
  keywords: [
    'Open Graph image API',
    'dynamic OG images',
    'social preview image API',
    'Next.js Open Graph images',
    'Vercel OG alternative',
    'OG image generator',
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
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
