import { createClient } from 'npm:@supabase/supabase-js@2'

export function withRateLimit(routeKey: string, max: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    const ip =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
      'unknown'

    // Create a client directly in the middleware (Deno Edge Functions are fast enough for this)
    // or reuse if available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const key = `${routeKey}:${ip}`
    const now = new Date()
    const resetTime = new Date(now.getTime() + windowMs)

    // Select the current limit
    const { data: currentLimit } = await supabase
      .from('rate_limits')
      .select('count, reset_at')
      .eq('id', key)
      .single()

    if (!currentLimit || new Date(currentLimit.reset_at) < now) {
      // Create or reset
      await supabase
        .from('rate_limits')
        .upsert({
          id: key,
          ip_address: ip,
          action: routeKey,
          count: 1,
          reset_at: resetTime.toISOString(),
          created_at: now.toISOString()
        })
    } else {
      // Check if over limit
      if (currentLimit.count >= max) {
        return c.json(
          {
            error: 'Too many requests. Please wait before trying again.',
            retryAfterSeconds: Math.ceil(windowMs / 1000),
          },
          429,
        )
      }

      // Increment
      await supabase
        .from('rate_limits')
        .update({ count: currentLimit.count + 1 })
        .eq('id', key)
    }

    await next()
  }
}
