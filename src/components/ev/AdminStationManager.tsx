import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Crosshair, Flag, IndianRupee, MapPin, Plus, Power, PowerOff, Trash2, TrendingUp, Wand2, Zap } from "lucide-react";
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

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
    setWizardOpen(false);
    setWizardStep(0);
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
          <Button variant="outline" onClick={() => { setWizardOpen(true); setWizardStep(0); setPickMode(true); }}>
            <Wand2 className="size-4" /> Step-by-step
          </Button>
          <Button variant="hero" onClick={commitNew}><Plus className="size-4" /> Add station</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Tip: tap “Drop pin on map”, then click anywhere on the map. The pin is also draggable for fine-tuning.</p>

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

      <EvMap
        pickMode={pickMode}
        pickPosition={pickMode ? { lat: draft.lat, lng: draft.lng } : null}
        onPickLocation={(lat, lng) => setDraft((d) => ({ ...d, lat, lng }))}
      />

      {/* Step-by-step wizard */}
      <Dialog open={wizardOpen} onOpenChange={(o) => { setWizardOpen(o); if (!o) setPickMode(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add station · step {wizardStep + 1} of 4</DialogTitle>
            <DialogDescription>Quickly set up a new charging station in four guided steps.</DialogDescription>
          </DialogHeader>
          <div className="mb-3 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= wizardStep ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
          {wizardStep === 0 ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary" /> Drop or drag the pin on the map (it stays draggable).</p>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" step="0.0001" value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })} placeholder="Latitude" />
                <Input type="number" step="0.0001" value={draft.lng} onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })} placeholder="Longitude" />
              </div>
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Street address" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
            </div>
          ) : null}
          {wizardStep === 1 ? (
            <div className="space-y-3">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Station name" />
              <Input value={draft.operator ?? ""} onChange={(e) => setDraft({ ...draft, operator: e.target.value })} placeholder="Operator" />
              <select className="h-10 w-full rounded-xl border border-input bg-card/70 px-3 text-sm" value={draft.charger_type} onChange={(e) => setDraft({ ...draft, charger_type: e.target.value as Station["charger_type"] })}>
                <option value="AC">AC</option>
                <option value="DC">DC</option>
                <option value="Fast DC">Fast DC</option>
              </select>
              <Input value={draft.connector_types.join(", ")} onChange={(e) => setDraft({ ...draft, connector_types: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="Connectors (comma separated)" />
            </div>
          ) : null}
          {wizardStep === 2 ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">Total slots
                <Input type="number" value={draft.total_slots} onChange={(e) => setDraft({ ...draft, total_slots: Number(e.target.value), available_slots: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Power (kW)
                <Input type="number" value={draft.power_kw ?? 0} onChange={(e) => setDraft({ ...draft, power_kw: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Price ₹/kWh
                <Input type="number" value={draft.price_per_kwh} onChange={(e) => setDraft({ ...draft, price_per_kwh: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Reliability %
                <Input type="number" value={draft.reliability_score} onChange={(e) => setDraft({ ...draft, reliability_score: Number(e.target.value) })} />
              </label>
            </div>
          ) : null}
          {wizardStep === 3 ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Review &amp; confirm</p>
              <div className="rounded-xl bg-secondary p-3">
                <p><b>{draft.name}</b> · {draft.operator}</p>
                <p className="text-xs text-muted-foreground">{draft.address}, {draft.city}</p>
                <p className="text-xs text-muted-foreground">{draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}</p>
                <p className="mt-1 text-xs">{draft.charger_type} · {draft.power_kw} kW · {draft.total_slots} slots · ₹{draft.price_per_kwh}/kWh</p>
                <p className="text-xs text-muted-foreground">Connectors: {draft.connector_types.join(", ")}</p>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" disabled={wizardStep === 0} onClick={() => setWizardStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {wizardStep < 3 ? (
              <Button variant="hero" onClick={() => setWizardStep((s) => s + 1)}>Next <ArrowRight className="size-4" /></Button>
            ) : (
              <Button variant="hero" onClick={commitNew}><Check className="size-4" /> Create station</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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