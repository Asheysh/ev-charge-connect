import type { Station, ChargerType } from "@/types/ev";

/**
 * Open Charge Map (OCM) integration.
 * Docs: https://openchargemap.org/site/develop/api
 * The public API works without a key but is rate-limited; set VITE_OCM_API_KEY
 * in your `.env` for production use.
 */
const OCM_BASE = "https://api.openchargemap.io/v3/poi";
const OCM_KEY = import.meta.env.VITE_OCM_API_KEY ?? "";

interface OCMPoi {
  ID: number;
  AddressInfo?: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
    Latitude: number;
    Longitude: number;
    Distance?: number;
  };
  OperatorInfo?: { Title?: string };
  StatusType?: { IsOperational?: boolean; Title?: string };
  NumberOfPoints?: number;
  Connections?: Array<{
    ConnectionType?: { Title?: string };
    PowerKW?: number;
    CurrentType?: { Title?: string };
    Quantity?: number;
  }>;
  DateLastVerified?: string;
}

function pickChargerType(powerKw: number, currentType?: string): ChargerType {
  if (currentType?.toLowerCase().includes("dc") || powerKw >= 50) return powerKw >= 50 ? "Fast DC" : "DC";
  return "AC";
}

function mapPoi(p: OCMPoi): Station | null {
  const addr = p.AddressInfo;
  if (!addr) return null;
  const conns = p.Connections ?? [];
  const power = Math.max(0, ...conns.map((c) => c.PowerKW ?? 0));
  const connectorTypes = Array.from(new Set(conns.map((c) => c.ConnectionType?.Title).filter(Boolean) as string[]));
  const total = p.NumberOfPoints ?? conns.reduce((sum, c) => sum + (c.Quantity ?? 1), 0) ?? 1;
  const operational = p.StatusType?.IsOperational !== false;
  const currentType = conns[0]?.CurrentType?.Title;
  return {
    id: `ocm-${p.ID}`,
    name: addr.Title ?? "Charging station",
    lat: addr.Latitude,
    lng: addr.Longitude,
    address: addr.AddressLine1 ?? "",
    city: addr.Town ?? addr.StateOrProvince ?? "",
    operator: p.OperatorInfo?.Title,
    charger_type: pickChargerType(power, currentType),
    connector_types: connectorTypes.length ? connectorTypes : ["Type 2"],
    total_slots: Math.max(1, total),
    available_slots: operational ? Math.max(1, Math.ceil(total / 2)) : 0,
    price_per_kwh: 18,
    status: operational ? "open" : "maintenance",
    reliability_score: operational ? 88 : 55,
    last_verified: p.DateLastVerified ?? new Date().toISOString(),
    distance_km: addr.Distance ?? 0,
    amenities: [],
    wait_minutes: 0,
    peak_hours: undefined,
    power_kw: power || undefined,
    active: operational,
  };
}

export async function fetchOpenChargeMapStations(opts: {
  lat: number;
  lng: number;
  distanceKm?: number;
  maxResults?: number;
}): Promise<Station[]> {
  const params = new URLSearchParams({
    output: "json",
    latitude: String(opts.lat),
    longitude: String(opts.lng),
    distance: String(opts.distanceKm ?? 25),
    distanceunit: "KM",
    maxresults: String(opts.maxResults ?? 50),
    compact: "true",
    verbose: "false",
  });
  if (OCM_KEY) params.set("key", OCM_KEY);
  const res = await fetch(`${OCM_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Charge Map error: ${res.status}`);
  const data = (await res.json()) as OCMPoi[];
  return data.map(mapPoi).filter((s): s is Station => s !== null);
}