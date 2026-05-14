export type ChargerType = "AC" | "DC" | "Fast DC";
export type StationStatus = "open" | "busy" | "maintenance";
export type ChargerStatus = "available" | "occupied" | "offline";
export type QueueStatus = "waiting" | "next" | "arrived" | "charging" | "completed" | "skipped";
export type SessionStatus = "pending" | "active" | "completed" | "paid";
export type VerificationStatus = "working" | "not_working";
export type TransactionStatus = "pending" | "success" | "failed";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleModel?: string;
  preferredConnector?: string;
  coins: number;
  vehicleRangeKm: number;
  created_at: string;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  operator?: string;
  charger_type: ChargerType;
  connector_types: string[];
  total_slots: number;
  available_slots: number;
  price_per_kwh: number;
  status: StationStatus;
  reliability_score: number;
  last_verified: string;
  distance_km: number;
  amenities: string[];
  wait_minutes: number;
  peak_hours?: string;
  power_kw?: number;
  image_url?: string;
  /** When false, station is hidden from public map and search. Admins control this. */
  active?: boolean;
}

export type ReportCategory = "not_working" | "faulty_cable" | "wrong_location" | "no_station" | "safety" | "other";

export interface StationReport {
  id: string;
  station_id: string;
  user_id: string;
  user_name?: string;
  category: ReportCategory;
  message: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}

export type AppRole = "user" | "admin" | "super_admin";

export interface UserRoleEntry {
  id: string;
  user_id: string;
  email?: string;
  name?: string;
  role: AppRole;
}

export interface Charger {
  id: string;
  station_id: string;
  status: ChargerStatus;
  type: ChargerType;
  connector: string;
  power_kw?: number;
}

export interface QueueEntry {
  id: string;
  station_id: string;
  user_id: string;
  user_name: string;
  position: number;
  status: QueueStatus;
  eta_minutes: number;
  created_at: string;
}

export interface ChargingSession {
  id: string;
  user_id: string;
  station_id: string;
  start_time: string;
  end_time?: string;
  energy_used: number;
  cost: number;
  status: SessionStatus;
}

export interface Verification {
  id: string;
  station_id: string;
  user_id: string;
  status: VerificationStatus;
  cable_condition: "excellent" | "usable" | "damaged";
  image_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  method: "UPI";
  status: TransactionStatus;
  created_at: string;
}

export interface StationFilters {
  chargerType: "all" | ChargerType;
  availability: "all" | "available" | "busy";
  connector: "all" | string;
  city: "all" | string;
  maxDistance: number;
  maxPrice: number;
}
