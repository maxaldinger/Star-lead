import { createClient, SupabaseClient } from '@supabase/supabase-js'

let db: SupabaseClient | null = null

export function getDb(): SupabaseClient {
  if (!db) {
    db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return db
}

export const FEED_TTL_HOURS = 12
export const INTEL_TTL_HOURS = 24
