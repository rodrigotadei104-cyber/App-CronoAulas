import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client with fallback for missing credentials
// If credentials are missing, the app will still load but show login page
export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key');