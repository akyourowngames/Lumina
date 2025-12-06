import { createClient } from '@supabase/supabase-js';

// Safely access environment variables, handling cases where import.meta.env might be undefined
// in non-Vite environments.
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || "https://wuhqmhudtljwnotrprao.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "sb_secret_gnUe5HyzOthZSANtxrXtZQ_NO1-4xM7";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);