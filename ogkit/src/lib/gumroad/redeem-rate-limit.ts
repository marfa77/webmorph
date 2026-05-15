type Bucket = { count: number; resetAt: number }

const globalBuckets = globalThis as typeof globalThis & { __ogkitGumroadRedeemBuckets?: Map<string, Bucket> }

function buckets(): Map<string, Bucket> {
  if (!globalBuckets.__ogkitGumroadRedeemBuckets) {
    globalBuckets.__ogkitGumroadRedeemBuckets = new Map()
  }
  return globalBuckets.__ogkitGumroadRedeemBuckets
}

/** In-memory limiter for the redeem route (per user id). */
export function gumroadRedeemRateLimitOk(userId: string, max = 12, windowMs = 15 * 60 * 1000): boolean {
  const key = `user:${userId}`
  const now = Date.now()
  const map = buckets()
  let b = map.get(key)
  if (!b || now >= b.resetAt) {
    b = { count: 1, resetAt: now + windowMs }
    map.set(key, b)
    return true
  }
  if (b.count >= max) return false
  b.count += 1
  return true
}
