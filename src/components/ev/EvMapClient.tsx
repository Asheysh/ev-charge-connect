import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BatteryCharging, Clock, IndianRupee, MapPin } from "lucide-react";
import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";
import type { Station } from "@/types/ev";

const stationIcon = new L.DivIcon({
  html: '<div class="ev-marker"><span></span></div>',
  className: "ev-marker-shell",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
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

export default function EvMapClient() {
  const filteredStations = useFilteredStations();
  const selectedStationId = useEvStore((state) => state.selectedStationId);
  const setSelectedStation = useEvStore((state) => state.setSelectedStation);

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-panel lg:min-h-[720px]">
      <MapContainer center={[28.59, 77.21]} zoom={11} scrollWheelZoom className="h-full min-h-[520px] lg:min-h-[720px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-border bg-card/90 p-3 shadow-card backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> NCR charging grid
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BatteryCharging className="size-3" /> {filteredStations.length}</span>
          <span className="flex items-center gap-1"><Clock className="size-3" /> live</span>
          <span className="flex items-center gap-1"><IndianRupee className="size-3" /> UPI</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[500] flex flex-wrap gap-2">
        {filteredStations.slice(0, 3).map((station) => (
          <div
            key={station.id}
            className={`rounded-xl border px-3 py-2 text-xs shadow-card backdrop-blur-xl ${
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
