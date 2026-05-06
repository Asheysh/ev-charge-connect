import { useEffect, useState } from "react";
import { Crosshair, Flag, IndianRupee, Plus, Power, PowerOff, Trash2, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EvMap } from "@/components/ev/EvMap";
import { useEvStore } from "@/store/evStore";
import type { Station } from "@/types/ev";

/** Default values used for newly added stations. */
const blankStation = (): Omit<Station, "id"> => ({
  name: "New Station",
  address: "",
  city: "Delhi",
  operator: "Independent",
  charger_type: "Fast DC",
  connector_types: ["CCS2"],
  total_slots: 4,
  available_slots: 4,
  price_per_kwh: 18,
  status: "open",
  reliability_score: 85,
  last_verified: "just now",
  distance_km: 0,
  amenities: ["Parking"],
  wait_minutes: 0,
  power_kw: 60,
  lat: 28.6,
  lng: 77.2,
});

export function AdminStationManager() {
  const { stations, addStation, updateStation, removeStation, isAdmin, toggleStationActive, reports, loadReports } = useEvStore();
  const [pickMode, setPickMode] = useState(false);
  const [draft, setDraft] = useState<Omit<Station, "id">>(blankStation);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { void loadReports(); }, [loadReports]);

  if (!isAdmin) {
    return (
      <div className="glass-panel premium-border rounded-3xl border p-6 text-sm text-muted-foreground">
        Sign in with an admin account to manage stations. Grant the <code>admin</code> role from the database (see DOCS.md › Admin role).
      </div>
    );
  }

  function commitNew() {
    addStation({ id: crypto.randomUUID(), ...draft });
    setDraft(blankStation());
    setPickMode(false);
  }

  const opened = stations.find((s) => s.id === openId) ?? null;
  const filtered = stations.filter((s) => `${s.name} ${s.city} ${s.operator ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const reportsForOpen = opened ? reports.filter((r) => r.station_id === opened.id) : [];
  const dailyEnergy = (s: Station) => (s.total_slots - s.available_slots) * 24 + s.total_slots * 60;
  const dailyRevenue = (s: Station) => Math.round(dailyEnergy(s) * s.price_per_kwh);

  return (
    <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="glass-panel premium-border space-y-4 rounded-3xl border p-5">
        <div className="flex items-center gap-2 text-primary"><Plus className="size-5" /><h2 className="text-2xl font-black">Add a new station</h2></div>
        <p className="text-sm text-muted-foreground">Drop a pin on the map or enter coordinates manually. Click any station name in the list below to open its profile.</p>

        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
          <Input placeholder="Address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className="col-span-2" />
          <Input placeholder="Operator" value={draft.operator ?? ""} onChange={(e) => setDraft({ ...draft, operator: e.target.value })} />
          <Input placeholder="₹/kWh" type="number" value={draft.price_per_kwh} onChange={(e) => setDraft({ ...draft, price_per_kwh: Number(e.target.value) })} />
          <Input placeholder="Total slots" type="number" value={draft.total_slots} onChange={(e) => setDraft({ ...draft, total_slots: Number(e.target.value), available_slots: Number(e.target.value) })} />
          <Input placeholder="Power kW" type="number" value={draft.power_kw ?? 0} onChange={(e) => setDraft({ ...draft, power_kw: Number(e.target.value) })} />
          <Input placeholder="Lat" type="number" step="0.0001" value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })} />
          <Input placeholder="Lng" type="number" step="0.0001" value={draft.lng} onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })} />
        </div>
        <div className="flex gap-2">
          <Button variant={pickMode ? "hero" : "outline"} onClick={() => setPickMode((v) => !v)}>
            <Crosshair className="size-4" /> {pickMode ? "Picking…" : "Drop pin on map"}
          </Button>
          <Button variant="hero" onClick={commitNew}><Plus className="size-4" /> Add station</Button>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Stations · {stations.length}</p>
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-40" />
          </div>
          <div className="mt-2 max-h-[420px] space-y-1 overflow-y-auto">
            {filtered.map((s) => {
              const off = s.active === false;
              const openReports = reports.filter((r) => r.station_id === s.id && r.status === "open").length;
              return (
                <div key={s.id} className={`flex items-center gap-2 rounded-xl p-2.5 text-sm ${off ? "bg-destructive/10" : "bg-secondary"}`}>
                  <button className="flex-1 text-left font-semibold hover:text-primary" onClick={() => setOpenId(s.id)}>
                    {s.name}
                    <span className="ml-1 text-xs text-muted-foreground">· {s.city}</span>
                  </button>
                  {openReports > 0 ? <span className="flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground"><Flag className="size-3" /> {openReports}</span> : null}
                  <span className="flex items-center gap-1.5 text-xs">
                    {off ? <PowerOff className="size-3.5 text-destructive" /> : <Power className="size-3.5 text-primary" />}
                    <Switch checked={!off} onCheckedChange={(v) => void toggleStationActive(s.id, v)} aria-label="Toggle station" />
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => removeStation(s.id)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EvMap pickMode={pickMode} onPickLocation={(lat, lng) => setDraft((d) => ({ ...d, lat, lng }))} />

      <Dialog open={!!opened} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          {opened ? (
            <>
              <DialogHeader>
                <DialogTitle>{opened.name}</DialogTitle>
                <DialogDescription>{opened.address} · {opened.city}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
                <span className="text-sm font-semibold">{opened.active === false ? "Station OFF — hidden from public map" : "Station LIVE — visible on map"}</span>
                <Switch checked={opened.active !== false} onCheckedChange={(v) => void toggleStationActive(opened.id, v)} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <KPI icon={<Zap className="size-4" />} label="Reliability" value={`${opened.reliability_score}%`} />
                <KPI icon={<IndianRupee className="size-4" />} label="Price" value={`₹${opened.price_per_kwh}/kWh`} />
                <KPI icon={<TrendingUp className="size-4" />} label="Energy/day" value={`${dailyEnergy(opened)} kWh`} />
                <KPI icon={<IndianRupee className="size-4" />} label="Revenue/day" value={`₹${dailyRevenue(opened).toLocaleString()}`} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <label className="text-xs">Price ₹/kWh
                  <Input type="number" value={opened.price_per_kwh} onChange={(e) => updateStation(opened.id, { price_per_kwh: Number(e.target.value) })} />
                </label>
                <label className="text-xs">Reliability %
                  <Input type="number" value={opened.reliability_score} onChange={(e) => updateStation(opened.id, { reliability_score: Number(e.target.value) })} />
                </label>
                <label className="text-xs">Total slots
                  <Input type="number" value={opened.total_slots} onChange={(e) => updateStation(opened.id, { total_slots: Number(e.target.value) })} />
                </label>
                <label className="text-xs">Available
                  <Input type="number" value={opened.available_slots} onChange={(e) => updateStation(opened.id, { available_slots: Number(e.target.value) })} />
                </label>
              </div>
              <div className="pt-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reports · {reportsForOpen.length}</p>
                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                  {reportsForOpen.length === 0 ? <p className="rounded-lg bg-secondary p-2 text-xs text-muted-foreground">No reports yet.</p> : reportsForOpen.map((r) => (
                    <div key={r.id} className="rounded-lg bg-secondary p-2 text-xs">
                      <p className="font-semibold capitalize">{r.category.replaceAll("_", " ")} <span className="text-muted-foreground">· {r.status}</span></p>
                      {r.message ? <p className="mt-0.5 text-muted-foreground">{r.message}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">{icon}{label}</div>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}