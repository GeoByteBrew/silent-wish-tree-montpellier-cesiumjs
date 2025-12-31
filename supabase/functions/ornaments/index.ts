import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

const DEFAULT_LIMIT = 250
const MAX_LIMIT = 800

function parseLimit(url: URL): number {
  const raw = (url.searchParams.get('limit') ?? '').trim()
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(n), MAX_LIMIT)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 })

  const limit = parseLimit(new URL(req.url))
  const supabase = supabaseAdmin()

  // IMPORTANT: never return the wish text from this endpoint.
  const { data, error } = await supabase
    .from('wishes')
    .select('id, created_at, anchor_index, ornament_type, is_flagged')
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return json({ error: 'db_error', detail: error.message }, { status: 500 })

  return json({
    ok: true,
    limit,
    items:
      (data ?? []).map((r) => ({
        id: r.id as string,
        created_at: r.created_at as string,
        anchor_index: r.anchor_index as number,
        ornament_type: r.ornament_type as string,
      })) ?? [],
  })
})


