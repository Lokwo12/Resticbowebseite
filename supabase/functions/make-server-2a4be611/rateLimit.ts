/**
 * rateLimit.ts
 * In-memory sliding-window rate limiter, keyed by any string (typically IP address).
 *
 * NOTE: This is per-isolate (each Deno Edge Function cold start gets a fresh map).
 * For a shared, persistent rate limiter across restarts, use Upstash Redis.
 * For the initial launch, per-isolate limiting is sufficient to block simple abuse.
 */

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

/**
 * Check whether a request from `key` is within the rate limit.
 *
 * @param key      Unique identifier for the caller (e.g. IP address + route)
 * @param max      Maximum number of requests allowed within `windowMs`
 * @param windowMs Time window in milliseconds (e.g. 60_000 for 1 minute)
 * @returns        true if the request is allowed, false if the limit is exceeded
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= max) {
    return false
  }

  bucket.count++
  return true
}

/**
 * Hono middleware factory that applies a rate limit to a route.
 * Returns a 429 JSON response when the limit is exceeded.
 *
 * Usage:
 *   app.post('/contact', withRateLimit('contact', 5, 10 * 60_000), handler)
 */
export function withRateLimit(routeKey: string, max: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    // Use the connecting IP as the limiter key.
    // Supabase Edge Functions expose the client IP via the CF-Connecting-IP header.
    const ip =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
      'unknown'

    const key = `${routeKey}:${ip}`

    if (!rateLimit(key, max, windowMs)) {
      return c.json(
        {
          error: 'Too many requests. Please wait before trying again.',
          retryAfterSeconds: Math.ceil(windowMs / 1000),
        },
        429,
      )
    }

    await next()
  }
}
