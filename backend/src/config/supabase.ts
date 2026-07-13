import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Server-side client using the service role key — never expose this to the browser.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Pings Supabase on boot so a bad URL/key or an unapplied schema fails loudly instead of
// surfacing as a mysterious 500 on the first request.
export async function checkSupabaseConnection(): Promise<void> {
  const { error } = await supabaseAdmin.from('profiles').select('id', { head: true, count: 'exact' });

  if (error) {
    // eslint-disable-next-line no-console
    console.error(`[supabase] Connection check failed: ${error.message}`);
    // eslint-disable-next-line no-console
    console.error('[supabase] Check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY and that database/schema.sql has been applied.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[supabase] Connected successfully to ${env.supabaseUrl}`);
}
