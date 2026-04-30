import { Suspense } from 'react'
import { privateAppMetadata } from '@/lib/app-route-metadata'
import { LoginForm } from './login-form'

export const metadata = privateAppMetadata({
  title: 'Sign in to OGKit — magic link email authentication',
  description:
    'Sign in to OGKit with email only: we send a secure magic link to your inbox. Access dashboard, API keys, usage, and the Open Graph image Playground. No password stored on our servers.',
  pathname: '/login',
})

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
