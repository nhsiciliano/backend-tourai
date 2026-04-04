import { createClient } from '@supabase/supabase-js'

let supabaseAdminSingleton:
  | ReturnType<typeof createClient>
  | undefined

export function getSupabaseAdminClient() {
  supabaseAdminSingleton ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminSingleton
}
