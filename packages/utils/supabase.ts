import { createClient } from '@supabase/supabase-js';

// Define the Database type if/when we generate types from schema
// import { Database } from './types/supabase';

export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey);
};

// Singleton instance helper (optional, depends on usage)
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL and Key must be defined in environment variables');
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};
