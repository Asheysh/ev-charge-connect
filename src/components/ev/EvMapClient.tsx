import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  BatteryCharging,
  Clock,
  Crosshair,
  IndianRupee,
  LocateFixed,
  MapPin,
  Navigation,
  Zap,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";
import type { Station } from "@/types/ev";

import { useGeolocation } from "@/hooks/useGeolocation";

import {
  fetchRoute,
  haversineKm,
  type RouteResult,
} from "@/lib/geo";

import { Button } from "@/components/ui/button";

import { StationDetailDialog } from "@/components/ev/StationDetailDialog";

const MP_CENTER: [number, number] = [23.473324, 77.947998];

const NEAR_ROUTES_COUNT = 4;

/* ----------------------------- Marker Icons ----------------------------- */

const stationIcon = new L.DivIcon({
  html: `
    <div style="
      width:34px;
      height:34px;
      border-radius:9999px;
      background:#22c55e;
      border:4px solid white;
      box-shadow:0 4px 16px rgba(0,0,0,0.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-weight:bold;
      font-size:14px;
    ">
      ⚡
    </div>
  `,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const stationIconActive = new L.DivIcon({
  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:9999px;
      background:#16a34a;
      border:5px solid white;
      box-shadow:0 0 0 8px rgba(34,197,94,0.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      font-weight:bold;
    ">
      ⚡
    </div>
  `,
  className: "",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const liveIcon = new L.DivIcon({
  html: `
    <div style="
      width:18px;
      height:18px;
      border-radius:9999px;
      background:#0ea5e9;
      box-shadow:
        0 0 0 6px rgba(14,165,233,0.25),
        0 0 0 14px rgba(14,165,233,0.12);
      border:3px solid white;
    "></div>
  `,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const pickIcon = new L.DivIcon({
  html: `
    <div style="
      width:22px;
      height:22px;
      border-radius:9999px;
      background:#22c55e;
      border:3px solid white;
      box-shadow:0 0 0 6px rgba(34,197,94,0.25);
    "></div>
  `,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/* ----------------------------- Map Helpers ----------------------------- */

function MapClickCapture({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });

  return null;
}

function FlyController({
  trigger,
  position,
}: {
  trigger: number;
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (trigger > 0 && position) {
      map.flyTo(position, Math.max(map.getZoom(), 14), {
        duration: 1,
      });
    }
  }, [trigger, position, map]);

  return null;
}

/* ----------------------------- Props ----------------------------- */

interface EvMapClientProps {
  pickMode?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
  pickPosition?: { lat: number; lng: number } | null;
}

/* ----------------------------- Component ----------------------------- */

export default function EvMapClient({
  pickMode = false,
  onPickLocation,
  pickPosition = null,
}: EvMapClientProps) {
  const filtered = useFilteredStations();

  const allStations = useEvStore((s) => s.stations);

  const selectedStationId = useEvStore(
    (state) => state.selectedStationId
  );

  const setSelectedStation = useEvStore(
    (state) => state.setSelectedStation
  );

  const liveLocation = useEvStore((s) => s.liveLocation);

  const setLiveLocation = useEvStore(
    (s) => s.setLiveLocation
  );

  const activeRoute = useEvStore((s) => s.activeRoute);

  const setActiveRoute = useEvStore(
    (s) => s.setActiveRoute
  );

  const geo = useGeolocation(true);

  const stations = useMemo(
    () => filtered.filter((s) => s.active !== false),
    [filtered]
  );

  const [recenter, setRecenter] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(
    null
  );

  const [nearbyRoutes, setNearbyRoutes] = useState<
    { stationId: string; route: RouteResult }[]
  >([]);

  useEffect(() => {
    if (geo.coords) {
      setLiveLocation(geo.coords);
    }
  }, [geo.coords, setLiveLocation]);

  const nearest = useMemo(() => {
    if (!liveLocation) return [];

    return [...stations]
      .map((s) => ({
        s,
        d: haversineKm(liveLocation, {
          lat: s.lat,
          lng: s.lng,
        }),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, NEAR_ROUTES_COUNT)
      .map((x) => x.s);
  }, [stations, liveLocation]);

  const selected = useMemo(
    () =>
      allStations.find(
        (s) => s.id === selectedStationId
      ),
    [allStations, selectedStationId]
  );

  async function showChargegridRoutes() {
    if (!liveLocation || nearest.length === 0) return;

    const results = await Promise.all(
      nearest.map((s) =>
        fetchRoute(liveLocation, {
          lat: s.lat,
          lng: s.lng,
        })
      )
    );

    const collected = nearest
      .map((s, i) =>
        results[i]
          ? {
              stationId: s.id,
              route: results[i]!,
            }
          : null
      )
      .filter(
        (
          x
        ): x is {
          stationId: string;
          route: RouteResult;
        } => Boolean(x)
      );

    setNearbyRoutes(collected);

    if (collected[0]) {
      setSelectedStation(collected[0].stationId);
      setActiveRoute(collected[0].route);
    }
  }

  async function routeToStation(
    station: Station
  ) {
    if (!liveLocation) return;

    const r = await fetchRoute(liveLocation, {
      lat: station.lat,
      lng: station.lng,
    });

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
    <div className="premium-border relative min-h-[520px] overflow-hidden rounded-3xl border bg-card shadow-panel ring-1 ring-primary/5 lg:min-h-[720px] isolate">
      <MapContainer
        center={MP_CENTER}
        zoom={7}
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom={false}
        className="h-full min-h-[520px] lg:min-h-[720px]"
        style={{ height: '100%', width: '100%', position: 'relative' }}
        whenReady={(map) => {
          // Prevent map from capturing scroll events
          map.target.on('wheel', (e) => {
            if (!e.originalEvent.ctrlKey) {
              e.originalEvent.stopPropagation();
            }
          });
          // Ensure map stays within bounds
          map.target.invalidateSize();
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickMode && onPickLocation ? (
          <MapClickCapture onPick={onPickLocation} />
        ) : null}

        {pickMode &&
        pickPosition &&
        onPickLocation ? (
          <Marker
            position={[
              pickPosition.lat,
              pickPosition.lng,
            ]}
            icon={pickIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (
                  e.target as L.Marker
                ).getLatLng();

                onPickLocation(ll.lat, ll.lng);
              },
            }}
          >
            <Popup>
              Drag to set EV station location
            </Popup>
          </Marker>
        ) : null}

        <FlyController
          trigger={recenter}
          position={
            liveLocation
              ? [
                  liveLocation.lat,
                  liveLocation.lng,
                ]
              : null
          }
        />

        {liveLocation ? (
          <Marker
            position={[
              liveLocation.lat,
              liveLocation.lng,
            ]}
            icon={liveIcon}
          >
            <Popup>
              <div>
                <h3 className="font-bold">
                  Your Live Location
                </h3>

                <p className="text-xs text-muted-foreground">
                  GPS enabled
                </p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {nearbyRoutes.map(
          ({ stationId, route }) => {
            const isPrimary =
              stationId === selectedStationId;

            return (
              <Polyline
                key={stationId}
                positions={route.geometry}
                pathOptions={{
                  color: isPrimary
                    ? "#22c55e"
                    : "#94a3b8",
                  weight: isPrimary ? 6 : 4,
                  opacity: isPrimary ? 1 : 0.5,
                  dashArray: isPrimary
                    ? undefined
                    : "6 8",
                }}
              />
            );
          }
        )}

        {activeRoute &&
        nearbyRoutes.length === 0 ? (
          <Polyline
            positions={activeRoute.geometry}
            pathOptions={{
              color: "#22c55e",
              weight: 6,
            }}
          />
        ) : null}

        <MarkerClusterGroup chunkedLoading>
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[
                station.lat,
                station.lng,
              ]}
              icon={
                selectedStationId === station.id
                  ? stationIconActive
                  : stationIcon
              }
              eventHandlers={{
                click: () =>
                  openDetail(station.id),
              }}
            >
              <Popup>
                <div className="min-w-[230px] space-y-3">

                  <div>
                    <h2 className="text-lg font-bold">
                      ⚡ {station.name}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      📍 {station.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">

                    <div className="rounded-xl bg-green-100 p-2">
                      🔋 {station.available_slots} Slots
                    </div>

                    <div className="rounded-xl bg-yellow-100 p-2">
                      ⏱ {station.wait_minutes} mins
                    </div>

                    <div className="rounded-xl bg-blue-100 p-2">
                      💰 ₹{station.price_per_kwh}
                    </div>

                    <div className="rounded-xl bg-purple-100 p-2">
                      🔌{" "}
                      {station.connector_types?.join(
                        ", "
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={() =>
                      void routeToStation(
                        station
                      )
                    }
                  >
                    Navigate to Station
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Top Brand Panel */}

      <div className="absolute left-4 top-4 z-[500] rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur">

        <div className="flex items-center gap-2 font-bold">
          <MapPin className="size-5 text-green-600" />
          ChargeGrid MP
        </div>

        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">

          <span className="flex items-center gap-1">
            <BatteryCharging className="size-3" />
            {stations.length}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            Live
          </span>

          <span className="flex items-center gap-1">
            <IndianRupee className="size-3" />
            UPI
          </span>
        </div>
      </div>

      {/* Right Controls */}

      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-3">

        <Button
          size="icon"
          className="size-12 rounded-full"
          onClick={() => {
            geo.request();
            setRecenter((n) => n + 1);
          }}
        >
          <LocateFixed className="size-5" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="size-12 rounded-full"
          onClick={() =>
            void showChargegridRoutes()
          }
        >
          <Zap className="size-5" />
        </Button>

        {liveLocation && selected ? (
          <Button
            size="icon"
            variant="outline"
            className="size-12 rounded-full"
            onClick={() =>
              void routeToStation(selected)
            }
          >
            <Navigation className="size-5" />
          </Button>
        ) : null}
      </div>

      <StationDetailDialog
        stationId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRoute={(s) => {
          setDetailOpen(false);
          void routeToStation(s);
        }}
      />
    </div>
  );
}