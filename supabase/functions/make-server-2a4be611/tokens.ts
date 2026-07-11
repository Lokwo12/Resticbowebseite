export async function getMtnAccessToken(): Promise<string> {
  const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')!
  // Use documented env var name MTN_MOMO_API_USER for consistency
  const apiUserId = Deno.env.get('MTN_MOMO_API_USER')!
  if (!apiUserId) throw new Error('MTN_MOMO_API_USER is not configured')
  const apiKey = Deno.env.get('MTN_MOMO_API_KEY')!
  const environment = Deno.env.get('MTN_MOMO_ENVIRONMENT') ?? 'sandbox'
  const baseUrl = environment === 'production'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com'
  
  const credentials = btoa(`${apiUserId}:${apiKey}`)
  const res = await fetch(`${baseUrl}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  })
  if (!res.ok) throw new Error(`MTN auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

export async function getAirtelAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AIRTEL_CLIENT_ID')!
  const clientSecret = Deno.env.get('AIRTEL_CLIENT_SECRET')!
  const environment = Deno.env.get('AIRTEL_ENVIRONMENT') ?? 'sandbox'
  const baseUrl = environment === 'production'
    ? 'https://openapi.airtel.africa'
    : 'https://openapiuat.airtel.africa'
  const res = await fetch(`${baseUrl}/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error(`Airtel auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}
