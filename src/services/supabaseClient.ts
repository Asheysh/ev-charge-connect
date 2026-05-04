import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://bytfwzfcemoxybywligk.supabase.co";
const defaultSupabasePublishableKey = "sb_publishable_efLD7RGj1T1yPZuRObxDOA_lRAPoj9Y";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || defaultSupabasePublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
