import { getEnv } from './env.ts'

export async function verifyTurnstile(token: string | null): Promise<{ ok: boolean; error?: string }> {
  const secret = getEnv('TURNSTILE_SECRET_KEY')
  if (!secret) {
    // Allow local/dev without captcha secret configured.
    return { ok: true }
  }
  if (!token) return { ok: false, error: 'missing_token' }

  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  if (!res.ok) return { ok: false, error: `http_${res.status}` }
  const json = (await res.json()) as { success: boolean; ['error-codes']?: string[] }
  if (!json.success) return { ok: false, error: (json['error-codes'] ?? ['failed']).join(',') }
  return { ok: true }
}


