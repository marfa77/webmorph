import { createAdminClient } from '@/lib/supabase/admin'
import { getResolvedUserPlanForUserId } from '@/lib/billing/effective-plan'
import { extractPrefix, verifyKey } from './keys'

export type AuthResult =
  | {
      ok: true
      userId: string
      userEmail: string
      apiKeyId: string
      plan: 'free' | 'pro' | 'scale'
      watermark: boolean
      allowedDomains: string[]
      requireSignedUrls: boolean
      rawKey: string
    }
  | { ok: false; status: number; error: string }

export async function authenticateKey(key: string | null): Promise<AuthResult> {
  if (!key) return { ok: false, status: 401, error: 'missing_key' }

  const prefix = extractPrefix(key)
  if (!prefix) return { ok: false, status: 401, error: 'invalid_key_format' }

  const supabase = createAdminClient()
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('id, user_id, hash, revoked_at, allowed_domains, require_signed_urls')
    .eq('prefix', prefix)
    .is('revoked_at', null)
    .maybeSingle()

  if (!keyRow) return { ok: false, status: 401, error: 'key_not_found' }
  if (!verifyKey(key, keyRow.hash)) return { ok: false, status: 401, error: 'key_invalid' }

  const { data: userRow } = await supabase.from('users').select('id, email').eq('id', keyRow.user_id).single()
  if (!userRow) return { ok: false, status: 401, error: 'user_not_found' }

  const plan = await getResolvedUserPlanForUserId(keyRow.user_id)

  void supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id).then()

  return {
    ok: true,
    userId: keyRow.user_id,
    userEmail: userRow.email,
    apiKeyId: keyRow.id,
    plan,
    watermark: plan === 'free',
    allowedDomains: keyRow.allowed_domains ?? [],
    requireSignedUrls: keyRow.require_signed_urls ?? false,
    rawKey: key,
  }
}
