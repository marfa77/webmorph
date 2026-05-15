import { createHash } from 'node:crypto'

/**
 * Deterministic hash for storing redemptions. Never log the raw key.
 * Pepper prevents rainbow-table reuse across products; prefer `GUMROAD_LICENSE_HASH_PEPPER`, else `AUTH_SECRET`.
 */
export function hashGumroadLicenseKey(licenseKey: string): string {
  const pepper =
    process.env.GUMROAD_LICENSE_HASH_PEPPER?.trim() || process.env.AUTH_SECRET?.trim() || 'ogkit-gumroad-dev-only'
  const normalized = licenseKey.trim().toLowerCase()
  return createHash('sha256').update(`${pepper}:${normalized}`, 'utf8').digest('hex')
}
