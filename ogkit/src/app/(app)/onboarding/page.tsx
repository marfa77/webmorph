import { OnboardingClient } from '@/app/(app)/onboarding/onboarding-client'
import { privateAppMetadata } from '@/lib/app-route-metadata'

export const metadata = privateAppMetadata({
  title: 'Get started — OGKit onboarding',
  description: 'Auto-provision your OGKit API key, open the Playground, and connect the hosted MCP server in Cursor.',
  pathname: '/onboarding',
})

export default function OnboardingPage() {
  return <OnboardingClient />
}
