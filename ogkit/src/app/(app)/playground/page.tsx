import { isOpenAccess } from '@/config/access'
import { marketingMetadata } from '@/lib/marketing-metadata'
import { PlaygroundClient } from './playground-client'

const openAccess = isOpenAccess()

export const metadata = marketingMetadata({
  title: 'OGKit Playground — try Open Graph templates (1200×630)',
  description: openAccess
    ? 'Try every OGKit template: live 1200×630 PNG previews, copyable HTTPS URLs, demo=1 without an API key — no watermark during open access.'
    : 'Try every OGKit template: live 1200×630 PNG previews, copyable HTTPS URLs, demo=1 without an API key. Ship faster for Next.js, blogs, SaaS, and docs.',
  pathname: '/playground',
  ogSubtitle: 'Live template playground',
})

export default function PlaygroundPage() {
  return <PlaygroundClient openAccess={openAccess} />
}
