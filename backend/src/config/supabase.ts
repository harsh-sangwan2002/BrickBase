import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Server-side client using the service role key — never expose this to the browser.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
