import type { Metadata } from 'next'
import { privateAppMetadata } from '@/lib/app-route-metadata'

export const metadata: Metadata = privateAppMetadata({
  title: 'OGKit API keys — create, rotate, domains & signed URLs',
  description:
    'Create and revoke OGKit API keys, set domain allowlists, and require signed URLs for public Open Graph endpoints. Links to dashboard usage and full API documentation.',
  pathname: '/dashboard/keys',
})

export default function KeysLayout({ children }: { children: React.ReactNode }) {
  return children
}
