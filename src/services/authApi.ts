import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/ev";
import { lovable } from "@/integrations/lovable";
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
  if (!isSupabaseConfigured || !supabase) return { user: null, session: null, profile: demoUser };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const user = data.session?.user ?? null;
  const profile = user ? await fetchProfile(user) : demoUser;
  return { user, session: data.session, profile };
}

export async function fetchProfile(user: User): Promise<UserProfile> {
  if (!isSupabaseConfigured || !supabase) return demoUser;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (data) return mapProfile(data, user);
  return upsertProfile({
    id: user.id,
    name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "EV Driver",
    email: user.email ?? "driver@example.com",
  });
}

export async function upsertProfile(input: Partial<UserProfile> & { id: string; email: string; name: string }): Promise<UserProfile> {
  if (!isSupabaseConfigured || !supabase) return { ...demoUser, ...input, created_at: new Date().toISOString() };
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
  if (error) throw new Error(`Failed to save profile: ${error.message}`);
  return mapProfile(data);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthStatePayload> {
  if (!isSupabaseConfigured || !supabase) return { user: null, session: null, profile: { ...demoUser, email } };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const profile = data.user ? await fetchProfile(data.user) : demoUser;
  return { user: data.user, session: data.session, profile };
}

export async function signUpWithEmail(input: { email: string; password: string; name: string; phone?: string; vehicleModel?: string }): Promise<AuthStatePayload> {
  if (!isSupabaseConfigured || !supabase) return { user: null, session: null, profile: { ...demoUser, ...input } };
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { name: input.name },
    },
  });
  if (error) throw new Error(error.message);
  const profile = data.user
    ? await upsertProfile({ id: data.user.id, name: input.name, email: input.email, phone: input.phone, vehicleModel: input.vehicleModel })
    : demoUser;
  return { user: data.user, session: data.session, profile };
}

export async function signInWithGoogle(): Promise<AuthStatePayload> {
  const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (result.error) throw result.error;
  if (result.redirected) return { user: null, session: null, profile: demoUser };
  return getCurrentAuth();
}

export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
