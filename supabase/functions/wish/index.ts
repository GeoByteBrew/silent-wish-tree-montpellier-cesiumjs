import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'
import { moderateWish } from '../_shared/moderation.ts'
import { verifyTurnstile } from '../_shared/turnstile.ts'

type WishRequest = {
  text?: string
  language?: 'fr' | 'en'
  ornament_type?: string
  anchor_index?: number
  client_id?: string
  turnstile_token?: string | null
}

const MAX_LEN = 140
const ANCHOR_COUNT = 1200

function pickAnchor(): number {
  return Math.floor(Math.random() * ANCHOR_COUNT)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 })

  let body: WishRequest
  try {
    body = (await req.json()) as WishRequest
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  const language = body.language
  const ornament_type = (body.ornament_type ?? '').trim()
  const client_id = (body.client_id ?? '').trim() || null
  const turnstile_token = body.turnstile_token ?? null

  if (!text || text.length > MAX_LEN) return json({ error: 'invalid_text' }, { status: 400 })
  if (language !== 'fr' && language !== 'en') return json({ error: 'invalid_language' }, { status: 400 })
  if (!ornament_type) return json({ error: 'invalid_ornament' }, { status: 400 })

  const captcha = await verifyTurnstile(turnstile_token)
  if (!captcha.ok) return json({ error: 'captcha_failed', detail: captcha.error }, { status: 400 })

  const supabase = supabaseAdmin()

  // Minimal rate limit: 5 per hour per client_id (client_id is random UUID stored in localStorage).
  if (client_id) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('wishes')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client_id)
      .gte('created_at', since)
    if ((count ?? 0) >= 5) return json({ error: 'rate_limited' }, { status: 429 })
  }

  const mod = moderateWish(text)
  const anchor_index = Number.isFinite(body.anchor_index) ? (body.anchor_index as number) : pickAnchor()

  const { data, error } = await supabase
    .from('wishes')
    .insert({
      text,
      language,
      ornament_type,
      anchor_index,
      client_id,
      is_flagged: mod.isFlagged,
      flag_reason: mod.reason ?? null,
    })
    .select('id, anchor_index')
    .single()

  if (error) return json({ error: 'db_error', detail: error.message }, { status: 500 })
  return json({ ok: true, id: data.id, anchor_index: data.anchor_index })
})


