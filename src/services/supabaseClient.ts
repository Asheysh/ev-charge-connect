import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://knasrxgmdhlxhllcuheq.supabase.co";
const defaultSupabasePublishableKey = "sb_publishable_bzQP0t3Ht4xodz9jRH_uVQ_UVtyR71y";

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
