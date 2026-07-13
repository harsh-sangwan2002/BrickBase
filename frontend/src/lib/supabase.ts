import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Client-side Supabase instance — used ONLY for auth (login/signup session) and
// direct Storage uploads. All data reads/writes go through the Node API.
export const supabase = createClient(url ?? '', anonKey ?? '');
