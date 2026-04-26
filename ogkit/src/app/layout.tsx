import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { siteConfig } from '@/config/site'
import './globals.css'

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: '/' },
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
    url: siteConfig.url,
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
