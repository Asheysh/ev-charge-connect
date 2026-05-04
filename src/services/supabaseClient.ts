import { createClient } from "@supabase/supabase-js";

// Direct Supabase project (Google OAuth configured here).
// Publishable / anon keys are safe to expose in the client bundle.
const SUPABASE_URL = "https://bytfwzfcemoxybywligk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_efLD7RGj1T1yPZuRObxDOA_lRAPoj9Y";

// Use the direct Supabase project first. Lovable previews inject their own
// VITE_SUPABASE_* values, so env vars must not override this project.
const url = SUPABASE_URL;
const key = SUPABASE_PUBLISHABLE_KEY;

export const supabaseUrl = url;
export const supabasePublishableKey = key;
export const isSupabaseConfigured = Boolean(url && key);

export const supabase = createClient(url, key, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("[supabase] client initialised:", url);
}
