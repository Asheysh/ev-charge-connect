import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/ev";
import { demoUser } from "./seedData";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export interface AuthStatePayload {
  user: User | null;
  session: Session | null;
  profile: UserProfile;
}

function mapProfile(row: Record<string, unknown>, user?: User | null): UserProfile {
  return {
    id: String(row.id ?? user?.id ?? demoUser.id),
    name: String(row.name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? demoUser.name),
    email: String(row.email ?? user?.email ?? demoUser.email),
    phone: row.phone ? String(row.phone) : undefined,
    vehicleModel: row.vehicle_model ? String(row.vehicle_model) : undefined,
    preferredConnector: row.preferred_connector ? String(row.preferred_connector) : undefined,
    coins: Number(row.coins ?? demoUser.coins),
    vehicleRangeKm: Number(row.vehicle_range_km ?? demoUser.vehicleRangeKm),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getCurrentAuth(): Promise<AuthStatePayload> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[auth] Supabase not configured, using demo user");
    return { user: null, session: null, profile: demoUser };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[auth] Failed to get session:", error.message);
      return { user: null, session: null, profile: demoUser };
    }
    const user = data.session?.user ?? null;
    const profile = user ? await fetchProfile(user) : demoUser;
    return { user, session: data.session, profile };
  } catch (error) {
    console.error("[auth] Unexpected error in getCurrentAuth:", error);
    return { user: null, session: null, profile: demoUser };
  }
}

export async function fetchProfile(user: User): Promise<UserProfile> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[auth] Supabase not configured, using demo profile");
    return demoUser;
  }
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) {
      console.warn("[auth] Error fetching profile (may not exist yet):", error.message);
      // Create profile if it doesn't exist
      return upsertProfile({
        id: user.id,
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "EV Driver",
        email: user.email ?? "driver@example.com",
      });
    }
    if (data) return mapProfile(data, user);
    // No profile found, create one
    return upsertProfile({
      id: user.id,
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "EV Driver",
      email: user.email ?? "driver@example.com",
    });
  } catch (error) {
    console.error("[auth] Unexpected error in fetchProfile:", error);
    return demoUser;
  }
}

export async function upsertProfile(input: Partial<UserProfile> & { id: string; email: string; name: string }): Promise<UserProfile> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[auth] Supabase not configured, skipping profile upsert");
    return { ...demoUser, ...input, created_at: new Date().toISOString() };
  }
  try {
    const payload = {
      id: input.id,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      vehicle_model: input.vehicleModel ?? "Tata Nexon EV",
      preferred_connector: input.preferredConnector ?? "CCS2",
      coins: input.coins ?? 250,
      vehicle_range_km: input.vehicleRangeKm ?? 220,
    };
    const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select().single();
    if (error) {
      console.error("[auth] Failed to save profile:", error.message);
      // Still return a valid profile even if save fails
      return mapProfile(payload);
    }
    return mapProfile(data);
  } catch (error) {
    console.error("[auth] Unexpected error in upsertProfile:", error);
    return mapProfile(input);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthStatePayload> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[auth] Supabase not configured, using demo credentials");
    return { user: null, session: null, profile: { ...demoUser, email } };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[auth] Sign in failed:", error.message);
      throw new Error(error.message);
    }
    const profile = data.user ? await fetchProfile(data.user) : demoUser;
    return { user: data.user, session: data.session, profile };
  } catch (error) {
    console.error("[auth] Sign in error:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function signUpWithEmail(input: { email: string; password: string; name: string; phone?: string; vehicleModel?: string }): Promise<AuthStatePayload> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[auth] Supabase not configured, using demo signup");
    return { user: null, session: null, profile: { ...demoUser, ...input } };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: input.name },
      },
    });
    if (error) {
      console.error("[auth] Sign up failed:", error.message);
      throw new Error(error.message);
    }
    const profile = data.user
      ? await upsertProfile({ id: data.user.id, name: input.name, email: input.email, phone: input.phone, vehicleModel: input.vehicleModel })
      : demoUser;
    return { user: data.user, session: data.session, profile };
  } catch (error) {
    console.error("[auth] Sign up error:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function signInWithGoogle(): Promise<AuthStatePayload> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot start Google sign-in.");
  }
  try {
    const redirectTo = `${window.location.origin}/login`;
    console.info("[auth] Starting Google OAuth", { redirectTo });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) {
      console.error("[auth] Google OAuth error:", error);
      if (/provider is not enabled|unsupported provider|missing oauth secret/i.test(error.message)) {
        throw new Error("Google sign-in is not fully configured in Supabase. Please verify the Google provider has a Client ID and Client Secret, and that this app URL is allowed as a redirect URL.");
      }
      throw new Error(error.message);
    }
    if (data?.url) {
      window.location.assign(data.url);
    } else {
      throw new Error("Supabase did not return a redirect URL for Google OAuth.");
    }
    return { user: null, session: null, profile: demoUser };
  } catch (error) {
    console.error("[auth] Google sign-in error:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[auth] Supabase not configured, skipping sign out");
    return;
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[auth] Sign out failed:", error.message);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("[auth] Sign out error:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}
