import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { requireEnv } from './env.ts'

export function supabaseAdmin() {
  const url = requireEnv('SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}


