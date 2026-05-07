import { useEffect, useState } from "react";
import { Cpu, Plus, Power, PowerOff, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useEvStore } from "@/store/evStore";

/**
 * Offline / IoT device manager. Lets a station manager (or main admin) register
 * the on-site device that handles offline queueing + IoT-payment for users
 * charging without connectivity. Persisted to localStorage so the surface is
 * usable today; swap `loadDevices`/`saveDevices` to a Supabase table when the
 * IoT backend is wired up — see DOCS.md › Offline devices.
 */

export interface OfflineDevice {
  id: string;
  station_id: string;
  label: string;
  serial: string;
  online: boolean;
  enabled: boolean;
  last_seen: string;
  /** Queue snapshot stored locally on the IoT device. */
  offline_queue: number;
  /** Pending IoT-payment captures (₹) waiting to sync. */
  pending_payments_inr: number;
}

const STORE_KEY = "ev.offline.devices.v1";

function loadDevices(): OfflineDevice[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]") as OfflineDevice[]; } catch { return []; }
}
function saveDevices(d: OfflineDevice[]) { localStorage.setItem(STORE_KEY, JSON.stringify(d)); }

export function OfflineDevicePanel() {
  const { stations, isAdmin, isSuperAdmin } = useEvStore();
  const [devices, setDevices] = useState<OfflineDevice[]>([]);
  const [stationId, setStationId] = useState<string>("");
  const [label, setLabel] = useState("Front-gate kiosk");
  const [serial, setSerial] = useState("");

  useEffect(() => { setDevices(loadDevices()); }, []);
  useEffect(() => { if (!stationId && stations[0]) setStationId(stations[0].id); }, [stations, stationId]);

  function persist(next: OfflineDevice[]) { setDevices(next); saveDevices(next); }

  function add() {
    if (!stationId || !serial.trim()) return;
    persist([
      { id: crypto.randomUUID(), station_id: stationId, label, serial: serial.trim(), online: true, enabled: true, last_seen: new Date().toISOString(), offline_queue: 0, pending_payments_inr: 0 },
      ...devices,
    ]);
    setSerial("");
  }

  // Visible to admins (station managers) and the main super-admin.
  if (!isAdmin && !isSuperAdmin) return null;

  // Station managers only see devices for stations that exist; main admin sees everything.
  const myStations = stations;
  const visible = devices.filter((d) => myStations.some((s) => s.id === d.station_id));

  return (
    <section className="glass-panel premium-border space-y-4 rounded-3xl border p-6">
      <div className="flex items-center gap-2">
        <Cpu className="size-5 text-primary" />
        <h2 className="text-2xl font-black">Offline / IoT charging devices</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Register the on-site terminals that run the offline queue and accept IoT-payments for drivers without internet. When a device is OFF the station falls back to online-only operation.
      </p>

      <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_120px]">
        <select value={stationId} onChange={(e) => setStationId(e.target.value)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          {myStations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Input placeholder="Device label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="Serial / MAC" value={serial} onChange={(e) => setSerial(e.target.value)} />
        <Button variant="hero" onClick={add} disabled={!stationId || !serial.trim()}><Plus className="size-4" /> Add</Button>
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">No devices registered yet.</p> : null}
        {visible.map((d) => {
          const station = stations.find((s) => s.id === d.station_id);
          return (
            <div key={d.id} className="grid items-center gap-2 rounded-2xl bg-secondary p-3 text-sm sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto_auto]">
              <div>
                <p className="font-bold">{d.label}</p>
                <p className="text-xs text-muted-foreground">{station?.name ?? d.station_id} · {d.serial}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs">{d.online ? <Wifi className="size-4 text-primary" /> : <WifiOff className="size-4 text-destructive" />} {d.online ? "online" : "offline"}</span>
              <span className="text-xs">Queue: <b>{d.offline_queue}</b></span>
              <span className="text-xs">Pending: <b>₹{d.pending_payments_inr}</b></span>
              <span className="flex items-center gap-1.5 text-xs">{d.enabled ? <Power className="size-4 text-primary" /> : <PowerOff className="size-4 text-destructive" />}<Switch checked={d.enabled} onCheckedChange={(v) => persist(devices.map((x) => x.id === d.id ? { ...x, enabled: v } : x))} /></span>
              <Button size="icon" variant="ghost" aria-label="Remove device" onClick={() => persist(devices.filter((x) => x.id !== d.id))}><Trash2 className="size-4" /></Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}