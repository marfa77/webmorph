import { marketingMetadata } from '@/lib/marketing-metadata'
import { PlaygroundClient } from './playground-client'

export const metadata = marketingMetadata({
  title: 'OGKit Playground — try Open Graph templates (1200×630)',
  description:
    'Try every OGKit template: live 1200×630 PNG previews, copyable HTTPS URLs, demo=1 without an API key. Ship faster for Next.js, blogs, SaaS, and docs.',
  pathname: '/playground',
})

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
