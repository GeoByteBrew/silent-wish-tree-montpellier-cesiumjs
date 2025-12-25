import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getEnv } from '../_shared/env.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'
import { tokenize } from '../_shared/tokenize.ts'

function getRevealAt(): Date {
  const iso = getEnv('REVEAL_AT_ISO') ?? '2026-01-06T00:00:00+01:00'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return new Date('2026-01-06T00:00:00+01:00')
  return d
}

function demoOverrideAllowed(url: URL): boolean {
  const demoKey = url.searchParams.get('demoKey')
  const expected = getEnv('DEMO_KEY')
  return Boolean(demoKey && expected && demoKey === expected)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 })

  const url = new URL(req.url)
  const revealAt = getRevealAt()
  const now = new Date()
  const allowed = now >= revealAt || demoOverrideAllowed(url)

  if (!allowed) {
    return json({ notYet: true, revealAt: revealAt.toISOString() })
  }

  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('wishes')
    .select('text')
    .eq('is_flagged', false)
    .order('created_at', { ascending: true })
    .limit(5000)

  if (error) return json({ error: 'db_error', detail: error.message }, { status: 500 })

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    for (const tok of tokenize(row.text)) {
      counts.set(tok, (counts.get(tok) ?? 0) + 1)
    }
  }

  const words = Array.from(counts.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 140)

  return json({
    ok: true,
    revealAt: revealAt.toISOString(),
    words,
  })
})


