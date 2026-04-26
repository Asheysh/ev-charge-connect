import type { QueueEntry, Station, Transaction, Verification } from "@/types/ev";
import { queueEntries, stations, verifications } from "./seedData";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function fetchStations(): Promise<Station[]> {
  if (!isSupabaseConfigured || !supabase) return stations;
  const { data, error } = await supabase.from("stations").select("*").order("reliability_score", { ascending: false });
  if (error) throw new Error(`Failed to load stations: ${error.message}`);
  return (data as Station[]) ?? [];
}

export async function fetchQueue(stationId: string): Promise<QueueEntry[]> {
  if (!isSupabaseConfigured || !supabase) return queueEntries.filter((entry) => entry.station_id === stationId);
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .eq("station_id", stationId)
    .in("status", ["waiting", "next", "arrived", "charging"])
    .order("position", { ascending: true });
  if (error) throw new Error(`Failed to load queue: ${error.message}`);
  return (data as QueueEntry[]) ?? [];
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

  if (!isSupabaseConfigured || !supabase) return entry;
  const { data, error } = await supabase.from("queue").insert(entry).select().single();
  if (error) throw new Error(`Failed to join queue: ${error.message}`);
  return data as QueueEntry;
}

export async function submitVerification(payload: Omit<Verification, "id" | "created_at">): Promise<Verification> {
  const verification: Verification = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  if (!isSupabaseConfigured || !supabase) return verification;
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
  if (!isSupabaseConfigured || !supabase) return transaction;
  const { data, error } = await supabase.from("transactions").insert(transaction).select().single();
  if (error) throw new Error(`Failed to create transaction: ${error.message}`);
  return data as Transaction;
}

export function subscribeToStationQueue(stationId: string, onChange: () => void) {
  if (!isSupabaseConfigured || !supabase) return () => undefined;
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
