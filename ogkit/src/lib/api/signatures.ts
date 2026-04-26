import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AuthResult } from './authenticate'

type AuthOk = Extract<AuthResult, { ok: true }>

function canonicalPathAndQuery(url: URL): string {
  const params = new URLSearchParams(url.searchParams)
  params.delete('sig')
  params.sort()
  const query = params.toString()
  return query ? `${url.pathname}?${query}` : url.pathname
}

function safeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

export function signOgUrl(url: URL, key: string): string {
  return createHmac('sha256', key).update(canonicalPathAndQuery(url)).digest('hex')
}

export function verifySignedRequest(url: URL, auth: AuthOk): { ok: true } | { ok: false; error: string } {
  if (auth.allowedDomains.length > 0) {
    const domain = url.searchParams.get('domain')?.trim().toLowerCase()
    if (domain && !auth.allowedDomains.includes(domain)) return { ok: false, error: 'domain_not_allowed' }
  }

  if (!auth.requireSignedUrls) return { ok: true }

  const signature = url.searchParams.get('sig')
  if (!signature) return { ok: false, error: 'missing_signature' }

  const expected = signOgUrl(url, auth.rawKey)
  if (!safeEqual(signature, expected)) return { ok: false, error: 'invalid_signature' }
  return { ok: true }
}
