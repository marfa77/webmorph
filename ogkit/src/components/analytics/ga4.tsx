'use client'

import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim()

/** Optional GA4 — set NEXT_PUBLIC_GA4_MEASUREMENT_ID. Uses lazyOnload to protect INP on marketing pages. */
export function Ga4() {
  if (!GA_ID) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="lazyOnload" />
      <Script id="ga4-config" strategy="lazyOnload">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: true });
        `.trim()}
      </Script>
    </>
  )
}
