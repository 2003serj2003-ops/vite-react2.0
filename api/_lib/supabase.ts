import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

// Admin client with service role key (только для серверной части!)
export const supabaseAdmin = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public client (для публичных данных)
export const supabasePublic = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY
);
