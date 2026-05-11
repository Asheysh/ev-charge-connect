import type { QueueEntry, Station, StationReport, Transaction, UserRoleEntry, Verification, AppRole } from "@/types/ev";
import { queueEntries, stations, verifications } from "./seedData";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

export async function fetchStations(): Promise<Station[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.info("[evApi] Supabase not configured, using seed stations");
    return stations;
  }
  try {
    const { data, error } = await supabase.from("stations").select("*").order("reliability_score", { ascending: false });
    if (error) {
      console.warn("[evApi] Failed to fetch stations from Supabase:", error.message);
      return stations; // Fallback to seed data
    }
    const remoteStations = (data as Station[] | null) ?? [];
    if (remoteStations.length > 0) {
      console.info(`[evApi] Loaded ${remoteStations.length} stations from Supabase`);
      return remoteStations;
    }
    console.info("[evApi] No stations in Supabase, using seed data");
    return stations;
  } catch (error) {
    console.error("[evApi] Error fetching stations:", error);
    return stations;
  }
}

export async function fetchQueue(stationId: string): Promise<QueueEntry[]> {
  const fallback = queueEntries.filter((entry) => entry.station_id === stationId);
  if (!isSupabaseConfigured || !supabase || !isUuid(stationId)) {
    return fallback;
  }
  try {
    const { data, error } = await supabase
      .from("queue")
      .select("*")
      .eq("station_id", stationId)
      .in("status", ["waiting", "next", "arrived", "charging"])
      .order("position", { ascending: true });
    if (error) {
      console.warn(`[evApi] Failed to fetch queue for station ${stationId}:`, error.message);
      return fallback;
    }
    const remoteQueue = (data as QueueEntry[]) ?? [];
    console.debug(`[evApi] Loaded ${remoteQueue.length} queue entries for station ${stationId}`);
    return remoteQueue.length > 0 ? remoteQueue : fallback;
  } catch (error) {
    console.error("[evApi] Error fetching queue:", error);
    return fallback;
  }
}

export async function joinStationQueue(stationId: string, userId: string, userName: string): Promise<QueueEntry> {
  const current = await fetchQueue(stationId);
  const entry: QueueEntry = {
    id: crypto.randomUUID(),
    station_id: stationId,
    user_id: userId,
    user_name: userName,
    position: current.length + 1,
    status: current.length === 0 ? "next" : "waiting",
    eta_minutes: current.length * 14,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase || !isUuid(stationId) || !isUuid(userId)) {
    console.info("[evApi] Queue entry created (demo mode):", entry.id);
    return entry;
  }
  try {
    const { data, error } = await supabase.from("queue").insert(entry).select().single();
    if (error) {
      console.error("[evApi] Failed to join queue:", error.message);
      if (/relation .* does not exist/i.test(error.message)) {
        console.error("[evApi] ⚠️  Queue table does not exist! Run Supabase migrations first.");
      }
      throw new Error(`Failed to join queue: ${error.message}`);
    }
    console.info("[evApi] User joined queue at position", data.position);
    return data as QueueEntry;
  } catch (error) {
    console.error("[evApi] Error joining queue:", error);
    throw error;
  }
}

export async function submitVerification(payload: Omit<Verification, "id" | "created_at">): Promise<Verification> {
  const verification: Verification = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  if (!isSupabaseConfigured || !supabase || !isUuid(payload.station_id) || !isUuid(payload.user_id)) return verification;
  const { data, error } = await supabase.from("reviews_verification").insert(verification).select().single();
  if (error) throw new Error(`Failed to submit verification: ${error.message}`);
  return data as Verification;
}

export async function createUpiTransaction(userId: string, amount: number): Promise<Transaction> {
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    amount,
    method: "UPI",
    status: "success",
    created_at: new Date().toISOString(),
  };
  if (!isSupabaseConfigured || !supabase || !isUuid(userId)) return transaction;
  const { data, error } = await supabase.from("transactions").insert(transaction).select().single();
  if (error) throw new Error(`Failed to create transaction: ${error.message}`);
  return data as Transaction;
}

export function subscribeToStationQueue(stationId: string, onChange: () => void) {
  if (!isSupabaseConfigured || !supabase || !isUuid(stationId)) return () => undefined;
  const client = supabase;
  const channel = supabase
    .channel(`queue:${stationId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "queue", filter: `station_id=eq.${stationId}` }, onChange)
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export const demoVerifications = verifications;

/* ===== Reports ===== */
export async function fetchStationReports(stationId?: string): Promise<StationReport[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("station_reports").select("*").order("created_at", { ascending: false });
  if (stationId && isUuid(stationId)) q = q.eq("station_id", stationId);
  const { data, error } = await q;
  if (error) throw new Error(`Failed to load reports: ${error.message}`);
  return (data as StationReport[]) ?? [];
}

export async function submitStationReport(input: Omit<StationReport, "id" | "created_at" | "status">): Promise<StationReport> {
  const local: StationReport = { ...input, id: crypto.randomUUID(), status: "open", created_at: new Date().toISOString() };
  if (!isSupabaseConfigured || !supabase || !isUuid(input.station_id) || !isUuid(input.user_id)) return local;
  const { data, error } = await supabase.from("station_reports").insert(local).select().single();
  if (error) throw new Error(`Failed to submit report: ${error.message}`);
  return data as StationReport;
}

/* ===== Admin: stations ===== */
export async function setStationActive(id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isUuid(id)) return;
  const { error } = await supabase.from("stations").update({ active }).eq("id", id);
  if (error) throw new Error(`Failed to toggle station: ${error.message}`);
}

export async function patchStation(id: string, patch: Partial<Station>): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isUuid(id)) return;
  const { error } = await supabase.from("stations").update(patch).eq("id", id);
  if (error) throw new Error(`Failed to update station: ${error.message}`);
}

/* ===== Admin: roles (super-admin) ===== */
export async function fetchAllRoles(): Promise<UserRoleEntry[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("user_roles").select("id, user_id, role");
  if (error) throw new Error(`Failed to load roles: ${error.message}`);
  return ((data ?? []) as Array<{ id: string; user_id: string; role: AppRole }>).map((r) => ({ ...r }));
}

export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isUuid(userId)) return;
  // Replace existing role for the user with the new one.
  const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (delErr) throw new Error(delErr.message);
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(`Failed to set role: ${error.message}`);
}
