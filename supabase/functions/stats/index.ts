import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 })

  const supabase = supabaseAdmin()
  const { count, error } = await supabase.from('wishes').select('id', { count: 'exact', head: true })
  if (error) return json({ error: 'db_error', detail: error.message }, { status: 500 })

  return json({ totalWishes: count ?? 0 })
})


