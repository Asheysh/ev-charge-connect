import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BatteryCharging, Clock, Crosshair, IndianRupee, LocateFixed, MapPin, Navigation, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";
import type { Station } from "@/types/ev";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchRoute, haversineKm, type RouteResult } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { StationDetailDialog } from "@/components/ev/StationDetailDialog";

/** How many of the nearest stations to draw secondary (grey) routes for. */
const NEAR_ROUTES_COUNT = 4;

const stationIcon = new L.DivIcon({
  html: '<div class="ev-marker"><span></span></div>',
  className: "ev-marker-shell",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const stationIconActive = new L.DivIcon({
  html: '<div class="ev-marker ev-marker-active"><span></span></div>',
  className: "ev-marker-shell",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const liveIcon = new L.DivIcon({
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:oklch(0.7 0.18 200);box-shadow:0 0 0 6px oklch(0.7 0.18 200/0.25),0 0 0 14px oklch(0.7 0.18 200/0.12);border:3px solid white"></div>',
  className: "ev-live-marker",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * Imperative recenter helper. IMPORTANT: only fly when `trigger` changes
 * (i.e. user pressed the recenter button). Listening on `position` would
 * re-fly the map every time the geolocation watcher emits a new fix, which
 * makes selecting a station / clicking on the map snap back to the user.
 */
function FlyController({ trigger, getPosition }: { trigger: number; getPosition: () => [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (trigger <= 0) return;
    const p = getPosition();
    if (p) map.flyTo(p, Math.max(map.getZoom(), 14), { duration: 0.7 });
    // intentionally exclude getPosition / map from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

interface EvMapClientProps {
  pickMode?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
}

export default function EvMapClient({ pickMode = false, onPickLocation }: EvMapClientProps) {
  const filtered = useFilteredStations();
  const allStations = useEvStore((s) => s.stations);
  const selectedStationId = useEvStore((state) => state.selectedStationId);
  const setSelectedStation = useEvStore((state) => state.setSelectedStation);
  const liveLocation = useEvStore((s) => s.liveLocation);
  const setLiveLocation = useEvStore((s) => s.setLiveLocation);
  const activeRoute = useEvStore((s) => s.activeRoute);
  const setActiveRoute = useEvStore((s) => s.setActiveRoute);
  const geo = useGeolocation(true);

  // Visible stations: only those marked active (or undefined for legacy seed data) and matching filters.
  const stations = useMemo(() => filtered.filter((s) => s.active !== false), [filtered]);

  const [recenter, setRecenter] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [nearbyRoutes, setNearbyRoutes] = useState<{ stationId: string; route: RouteResult }[]>([]);
  const liveRef = useRef<LatLng | null>(null);
  liveRef.current = liveLocation;

  useEffect(() => {
    if (geo.coords) setLiveLocation(geo.coords);
  }, [geo.coords, setLiveLocation]);

  // Pull live charging stations from Open Charge Map whenever the user's
  // location changes meaningfully (or first becomes known).
  const loadStationsNear = useEvStore((s) => s.loadStationsNear);
  useEffect(() => {
    if (!liveLocation) return;
    void loadStationsNear(liveLocation.lat, liveLocation.lng, 25);
  }, [liveLocation?.lat, liveLocation?.lng, loadStationsNear]);

  // Nearest stations to the user, used for grey alternate routes.
  const nearest = useMemo(() => {
    if (!liveLocation) return [];
    return [...stations]
      .map((s) => ({ s, d: haversineKm(liveLocation, { lat: s.lat, lng: s.lng }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, NEAR_ROUTES_COUNT)
      .map((x) => x.s);
  }, [stations, liveLocation]);

  const selected = useMemo(() => allStations.find((s) => s.id === selectedStationId), [allStations, selectedStationId]);

  /** Build "ChargeGrid" overlay: nearest station route in green + alternates in grey. */
  async function showChargegridRoutes() {
    if (!liveLocation || nearest.length === 0) return;
    const results = await Promise.all(nearest.map((s) => fetchRoute(liveLocation, { lat: s.lat, lng: s.lng })));
    const collected = nearest
      .map((s, i) => (results[i] ? { stationId: s.id, route: results[i]! } : null))
      .filter((x): x is { stationId: string; route: RouteResult } => Boolean(x));
    setNearbyRoutes(collected);
    if (collected[0]) {
      setSelectedStation(collected[0].stationId);
      setActiveRoute(collected[0].route);
    }
  }

  async function routeToStation(station: Station) {
    if (!liveLocation) return;
    const r = await fetchRoute(liveLocation, { lat: station.lat, lng: station.lng });
    if (r) {
      setActiveRoute(r);
      setSelectedStation(station.id);
    }
  }

  function openDetail(stationId: string) {
    setSelectedStation(stationId);
    setDetailId(stationId);
    setDetailOpen(true);
  }

  return (
    <div className="premium-border relative min-h-[520px] overflow-hidden rounded-3xl border bg-card shadow-panel ring-1 ring-primary/5 lg:min-h-[720px]">
      <MapContainer center={[28.59, 77.21]} zoom={11} scrollWheelZoom className="h-full min-h-[520px] lg:min-h-[720px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickMode && onPickLocation ? <MapClickCapture onPick={onPickLocation} /> : null}

        {/* Imperative recenter (manual button only — no auto-fly on geo updates) */}
        <FlyController trigger={recenter} getPosition={() => (liveRef.current ? [liveRef.current.lat, liveRef.current.lng] : null)} />

        {liveLocation ? (
          <Marker position={[liveLocation.lat, liveLocation.lng]} icon={liveIcon}>
            <Popup>You are here</Popup>
          </Marker>
        ) : null}

        {/* Grey alternate routes — clickable to switch primary station */}
        {nearbyRoutes.map(({ stationId, route }) => {
          const isPrimary = stationId === selectedStationId;
          return (
            <Polyline
              key={stationId}
              positions={route.geometry}
              pathOptions={{
                color: isPrimary ? "oklch(0.65 0.2 162)" : "oklch(0.7 0.02 230)",
                weight: isPrimary ? 6 : 4,
                opacity: isPrimary ? 0.95 : 0.55,
                dashArray: isPrimary ? undefined : "6 8",
              }}
              eventHandlers={{
                click: () => {
                  setSelectedStation(stationId);
                  setActiveRoute(route);
                },
              }}
            />
          );
        })}

        {/* Single explicit route (e.g. Navigate from detail dialog) */}
        {activeRoute && nearbyRoutes.length === 0 ? (
          <Polyline positions={activeRoute.geometry} pathOptions={{ color: "oklch(0.65 0.2 162)", weight: 6, opacity: 0.95 }} />
        ) : null}

        <MarkerClusterGroup chunkedLoading>
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={selectedStationId === station.id ? stationIconActive : stationIcon}
              eventHandlers={{ click: () => openDetail(station.id) }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Top-left brand chip */}
      <div className="glass-panel premium-border pointer-events-none absolute left-3 top-3 z-[500] rounded-2xl border p-2.5 sm:left-4 sm:top-4 sm:p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> Charging grid
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><BatteryCharging className="size-3" /> {stations.length}</span>
          <span className="flex items-center gap-1"><Clock className="size-3" /> live</span>
          <span className="flex items-center gap-1"><IndianRupee className="size-3" /> UPI</span>
        </div>
      </div>

      {/* Right-side floating action stack — Maps-app style */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2 sm:right-4 sm:top-4">
        <Button size="icon" variant="hero" aria-label="Recenter to my location" className="size-12 rounded-full shadow-glow" onClick={() => { geo.request(); setRecenter((n) => n + 1); }}>
          <LocateFixed className="size-5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          aria-label="Show ChargeGrid routes to nearest stations"
          title="ChargeGrid: route to nearest stations"
          className="size-12 rounded-full"
          onClick={() => {
            if (!liveLocation) { geo.request(); return; }
            void showChargegridRoutes();
          }}
        >
          <Zap className="size-5" />
        </Button>
        {liveLocation && selected ? (
          <Button size="icon" variant="outline" aria-label="Route to selected" className="size-12 rounded-full" onClick={() => void routeToStation(selected)}>
            <Navigation className="size-5" />
          </Button>
        ) : null}
        {nearbyRoutes.length > 0 ? (
          <Button size="sm" variant="ghost" className="rounded-full bg-card/80 px-3 backdrop-blur" onClick={() => { setNearbyRoutes([]); setActiveRoute(null); }}>
            Clear routes
          </Button>
        ) : null}
      </div>

      {/* Bottom info / status */}
      <div className="absolute bottom-3 left-3 right-3 z-[500] flex flex-wrap items-end justify-between gap-2 sm:bottom-4 sm:left-4 sm:right-4">
        <div className="flex flex-wrap gap-1.5">
          {activeRoute ? (
            <span className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-card backdrop-blur">
              {activeRoute.distanceKm.toFixed(1)} km · {Math.round(activeRoute.durationMin)} min
            </span>
          ) : null}
          {pickMode ? (
            <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow">
              <Crosshair className="mr-1 inline size-3" /> Tap map to drop pin
            </span>
          ) : null}
          {geo.error ? <span className="rounded-full bg-destructive/10 px-3 py-1.5 text-xs text-destructive">{geo.error}</span> : null}
        </div>
        {/* Mobile bottom-sheet style strip of nearest stations */}
        <div className="pointer-events-auto flex max-w-full flex-1 gap-2 overflow-x-auto pb-1 sm:flex-none">
          {stations.slice(0, 6).map((station) => (
            <button
              key={station.id}
              onClick={() => openDetail(station.id)}
              className={`shrink-0 rounded-2xl border px-3 py-2 text-left text-xs shadow-card backdrop-blur-xl transition ${
                selectedStationId === station.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/90 hover:border-primary"
              }`}
            >
              <p className="font-bold">{station.name.split(" ").slice(0, 3).join(" ")}</p>
              <p className="opacity-80">{station.available_slots} free · {station.wait_minutes}m · ₹{station.price_per_kwh}</p>
            </button>
          ))}
        </div>
      </div>

      <StationDetailDialog
        stationId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRoute={(s) => { setDetailOpen(false); void routeToStation(s); }}
      />
    </div>
  );
}
