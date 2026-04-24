import { siteConfig } from '@/config/site'
import { PlaygroundClient } from './playground-client'

export const metadata = { title: `Playground — ${siteConfig.name}` }

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
