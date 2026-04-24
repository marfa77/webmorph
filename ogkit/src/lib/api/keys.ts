import { customAlphabet } from 'nanoid'
import { createHash, timingSafeEqual } from 'node:crypto'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32)

export const KEY_PREFIX = 'ogk_live_'

export function generateKey(): { fullKey: string; prefix: string; hash: string } {
  const secret = nanoid()
  const fullKey = `${KEY_PREFIX}${secret}`
  const prefix = `${KEY_PREFIX}${secret.slice(0, 4)}`
  const hash = hashKey(fullKey)
  return { fullKey, prefix, hash }
}

export function hashKey(key: string): string {
  const salt = process.env.API_KEY_SALT || 'ogkit-static-salt-do-not-change'
  return createHash('sha256').update(key + salt).digest('hex')
}

export function verifyKey(key: string, hash: string): boolean {
  const computed = hashKey(key)
  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

export function extractPrefix(key: string): string | null {
  if (!key.startsWith(KEY_PREFIX)) return null
  return key.slice(0, KEY_PREFIX.length + 4)
}
