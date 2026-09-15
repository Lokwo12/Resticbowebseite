import { createClient } from 'npm:@supabase/supabase-js@2'

export function withRateLimit(routeKey: string, max: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    let ip =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
      'unknown'

    // Normalize IPv6-mapped IPv4
    ip = ip.replace(/^::ffff:/, '')

    // Create a client directly in the middleware (Deno Edge Functions are fast enough for this)
    // or reuse if available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const key = `${routeKey}:${ip}`
    const now = new Date()
    const resetTime = new Date(now.getTime() + windowMs)

    const { data: limitData, error } = await supabase.rpc('increment_rate_limit', {
      p_id: key,
      p_ip_address: ip,
      p_action: routeKey,
      p_reset_in_ms: windowMs
    })

    if (error) {
      console.warn('Rate limit check skipped due to RPC error/absence:', error.message)
      await next()
      return
    }

    if (limitData && limitData.count > max) {
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
