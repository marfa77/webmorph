import { Suspense } from 'react'
import { siteConfig } from '@/config/site'
import { LoginForm } from './login-form'

export const metadata = { title: `Sign in — ${siteConfig.name}` }

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
