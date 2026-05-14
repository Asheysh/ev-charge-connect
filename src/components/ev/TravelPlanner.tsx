import { useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Navigation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchRoute, geocode, stationsAlongRoute, type RouteResult } from "@/lib/geo";
import { useEvStore } from "@/store/evStore";
import type { Station } from "@/types/ev";

const startIcon = new L.DivIcon({ html: '<div style="width:14px;height:14px;background:oklch(0.7 0.18 200);border:3px solid white;border-radius:9999px"></div>', iconSize: [14, 14] });
const endIcon = new L.DivIcon({ html: '<div style="width:14px;height:14px;background:oklch(0.65 0.22 25);border:3px solid white;border-radius:9999px"></div>', iconSize: [14, 14] });
const stIcon = new L.DivIcon({ html: '<div class="ev-marker"><span></span></div>', className: "ev-marker-shell", iconSize: [28, 28], iconAnchor: [14, 14] });

/**
 * Trip planner: enter origin + destination, fetch the OSRM route and surface
 * the charging stations along it, plus a heuristic AI insight.
 */
export function TravelPlanner() {
  const stations = useEvStore((s) => s.stations);
  const { user, batteryPercent } = useEvStore();
  const [origin, setOrigin] = useState("Connaught Place, New Delhi");
  const [destination, setDestination] = useState("Jaipur");
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [stops, setStops] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insight, setInsight] = useState<string>("");

  async function plan() {
    setLoading(true); setError(""); setInsight("");
    try {
      const [a, b] = await Promise.all([geocode(origin), geocode(destination)]);
      if (!a || !b) { setError("Could not geocode one of the locations"); return; }
      const r = await fetchRoute(a, b);
      if (!r) { setError("Routing service unavailable, try again"); return; }
      setRoute(r);
      const onRoute = stationsAlongRoute(r.geometry, stations, 12);
      setStops(onRoute);

      const range = (batteryPercent / 100) * (user.vehicleRangeKm || 220);
      const stopsNeeded = Math.max(0, Math.ceil((r.distanceKm - range) / ((user.vehicleRangeKm || 220) * 0.7)));
      setInsight(
        `🛣️ ${r.distanceKm.toFixed(0)} km · ~${Math.round(r.durationMin)} min. ` +
        `Your ${batteryPercent}% battery covers ~${range.toFixed(0)} km. ` +
        (stopsNeeded === 0
          ? `No mandatory charging stops needed.`
          : `Plan ${stopsNeeded} fast-charge stop${stopsNeeded > 1 ? "s" : ""} — ${onRoute.length} stations are within 12 km of your route.`),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="glass-panel premium-border space-y-4 rounded-3xl border p-5">
        <div className="flex items-center gap-2 text-primary"><Compass className="size-5" /><h2 className="text-2xl font-black tracking-tight">Travel planner</h2></div>
        <p className="text-sm text-muted-foreground">Plan an EV trip from A → B. We map the route, surface chargers along the way, and give an AI-style range insight.</p>
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">From</span>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origin" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">To</span>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" />
          </label>
          <Button variant="hero" className="w-full" disabled={loading} onClick={() => void plan()}>
            <Navigation className="size-4" /> {loading ? "Planning…" : "Plan trip"}
          </Button>
        </div>
        {error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        {insight ? (
          <div className="rounded-2xl bg-gradient-soft p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" /> AI insight</p>
            <p className="mt-1 text-muted-foreground">{insight}</p>
          </div>
        ) : null}
        {stops.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Suggested stops · {stops.length}</p>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {stops.map((s) => (
                <div key={s.id} className="rounded-xl bg-secondary p-3 text-sm">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.city} · ₹{s.price_per_kwh}/kWh · {s.power_kw} kW · ★ {s.reliability_score}%</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="premium-border min-h-[520px] overflow-hidden rounded-3xl border bg-card shadow-panel">
        <MapContainer center={[27.5, 76]} zoom={6} className="h-full min-h-[520px]">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {route ? (
            <>
              <Polyline positions={route.geometry} pathOptions={{ color: "oklch(0.65 0.2 200)", weight: 5 }} />
              <Marker position={route.geometry[0]} icon={startIcon}><Popup>Start</Popup></Marker>
              <Marker position={route.geometry[route.geometry.length - 1]} icon={endIcon}><Popup>Destination</Popup></Marker>
              {stops.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={stIcon}>
                  <Popup><b>{s.name}</b><br />₹{s.price_per_kwh}/kWh</Popup>
                </Marker>
              ))}
            </>
          ) : null}
        </MapContainer>
      </div>
    </section>
  );
}