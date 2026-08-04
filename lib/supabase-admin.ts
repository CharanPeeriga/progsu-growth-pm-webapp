import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Each route handler used to build a fresh service-role client per request.
// createClient() constructs the auth, realtime and postgrest sub-clients every
// time, which is pure overhead on a hot path — one process-wide instance is
// enough because the client is stateless here (persistSession: false).
let client: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}
