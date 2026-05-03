import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BatteryCharging, Clock, Crosshair, IndianRupee, LocateFixed, MapPin, Navigation } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";
import type { Station } from "@/types/ev";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchRoute } from "@/lib/geo";
import { Button } from "@/components/ui/button";

const stationIcon = new L.DivIcon({
  html: '<div class="ev-marker"><span></span></div>',
  className: "ev-marker-shell",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const liveIcon = new L.DivIcon({
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:oklch(0.7 0.18 200);box-shadow:0 0 0 6px oklch(0.7 0.18 200/0.25),0 0 0 14px oklch(0.7 0.18 200/0.12);border:3px solid white"></div>',
  className: "ev-live-marker",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function StationPopup({ station }: { station: Station }) {
  const setSelectedStation = useEvStore((state) => state.setSelectedStation);

  return (
    <div className="w-64 space-y-3 p-1 font-sans text-foreground">
      <div>
        <p className="text-sm font-bold">{station.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{station.address}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <span className="rounded-md bg-secondary px-2 py-1">{station.available_slots}/{station.total_slots} slots</span>
        <span className="rounded-md bg-secondary px-2 py-1">₹{station.price_per_kwh}/kWh</span>
        <span className="rounded-md bg-secondary px-2 py-1">{station.reliability_score}%</span>
      </div>
      <button
        className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        onClick={() => setSelectedStation(station.id)}
      >
        Select station
      </button>
    </div>
  );
}

function MapClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 13), { duration: 0.8 });
  }, [position, map]);
  return null;
}

interface EvMapClientProps {
  /** When true, clicking the map calls onPickLocation instead of selecting a station. */
  pickMode?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
}

export default function EvMapClient({ pickMode = false, onPickLocation }: EvMapClientProps) {
  const filteredStations = useFilteredStations();
  const selectedStationId = useEvStore((state) => state.selectedStationId);
  const setSelectedStation = useEvStore((state) => state.setSelectedStation);
  const stations = useEvStore((s) => s.stations);
  const liveLocation = useEvStore((s) => s.liveLocation);
  const setLiveLocation = useEvStore((s) => s.setLiveLocation);
  const activeRoute = useEvStore((s) => s.activeRoute);
  const setActiveRoute = useEvStore((s) => s.setActiveRoute);
  const geo = useGeolocation(true);

  useEffect(() => {
    if (geo.coords) setLiveLocation(geo.coords);
  }, [geo.coords, setLiveLocation]);

  const selected = useMemo(() => stations.find((s) => s.id === selectedStationId), [stations, selectedStationId]);

  async function routeToSelected() {
    if (!liveLocation || !selected) return;
    const r = await fetchRoute(liveLocation, { lat: selected.lat, lng: selected.lng });
    setActiveRoute(r);
  }

  return (
    <div className="premium-border relative min-h-[520px] overflow-hidden rounded-3xl border bg-card shadow-panel ring-1 ring-primary/5 lg:min-h-[720px]">
      <MapContainer center={[28.59, 77.21]} zoom={11} scrollWheelZoom className="h-full min-h-[520px] lg:min-h-[720px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickMode && onPickLocation ? <MapClickCapture onPick={onPickLocation} /> : null}
        {liveLocation ? (
          <>
            <Marker position={[liveLocation.lat, liveLocation.lng]} icon={liveIcon}>
              <Popup>You are here</Popup>
            </Marker>
            <FlyTo position={[liveLocation.lat, liveLocation.lng]} />
          </>
        ) : null}
        {activeRoute ? (
          <Polyline positions={activeRoute.geometry} pathOptions={{ color: "oklch(0.65 0.2 200)", weight: 5, opacity: 0.85 }} />
        ) : null}
        <MarkerClusterGroup chunkedLoading>
          {filteredStations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={stationIcon}
              eventHandlers={{ click: () => setSelectedStation(station.id) }}
            >
              <Popup>
                <StationPopup station={station} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="glass-panel premium-border pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl border p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> NCR charging grid
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BatteryCharging className="size-3" /> {filteredStations.length}</span>
          <span className="flex items-center gap-1"><Clock className="size-3" /> live</span>
          <span className="flex items-center gap-1"><IndianRupee className="size-3" /> UPI</span>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
        <Button size="sm" variant="hero" onClick={geo.request} className="shadow-glow">
          <LocateFixed className="size-4" /> {geo.loading ? "Locating…" : liveLocation ? "Recenter" : "My location"}
        </Button>
        {liveLocation && selected ? (
          <Button size="sm" variant="secondary" onClick={() => void routeToSelected()}>
            <Navigation className="size-4" /> Route to {selected.name.split(" ")[0]}
          </Button>
        ) : null}
        {activeRoute ? (
          <span className="rounded-xl bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-card">
            {activeRoute.distanceKm.toFixed(1)} km · {Math.round(activeRoute.durationMin)} min
          </span>
        ) : null}
        {geo.error ? <span className="rounded-xl bg-destructive/10 px-3 py-1.5 text-xs text-destructive">{geo.error}</span> : null}
        {pickMode ? (
          <span className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow">
            <Crosshair className="mr-1 inline size-3" /> Click map to drop pin
          </span>
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[500] flex flex-wrap gap-2">
        {filteredStations.slice(0, 3).map((station) => (
          <div
            key={station.id}
            className={`rounded-2xl border px-3 py-2 text-xs shadow-card backdrop-blur-xl transition ${
              selectedStationId === station.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/90"
            }`}
          >
            {station.name.split(" ").slice(0, 2).join(" ")} · {station.available_slots} free · {station.wait_minutes}m
          </div>
        ))}
      </div>
    </div>
  );
}
