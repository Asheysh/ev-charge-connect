/**
 * Geo + routing utilities. Pure functions only — keep UI out of here so the
 * helpers stay easy to unit-test or swap. See DOCS.md › Routing.
 */
export interface LatLng { lat: number; lng: number }

export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export interface RouteResult {
  geometry: [number, number][]; // [lat, lng] pairs ready for leaflet Polyline
  distanceKm: number;
  durationMin: number;
}

/**
 * OSRM public demo router. Free, no key. Swap the base URL via env if needed:
 *   VITE_OSRM_URL=https://your-osrm/route/v1/driving
 */
export async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteResult | null> {
  const base = import.meta.env.VITE_OSRM_URL || "https://router.project-osrm.org/route/v1/driving";
  const url = `${base}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const route = json.routes?.[0];
    if (!route) return null;
    return {
      geometry: (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch {
    return null;
  }
}

/** OpenStreetMap Nominatim free geocoding. Use sparingly. */
export async function geocode(query: string): Promise<LatLng | null> {
  if (!query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!json[0]) return null;
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
  } catch {
    return null;
  }
}

/** Stations whose perpendicular distance to the route is within thresholdKm. */
export function stationsAlongRoute<T extends LatLng>(
  route: [number, number][],
  stations: T[],
  thresholdKm = 8,
): T[] {
  if (!route.length) return [];
  return stations.filter((s) => {
    let min = Infinity;
    for (let i = 0; i < route.length; i += Math.max(1, Math.floor(route.length / 80))) {
      const [lat, lng] = route[i];
      const d = haversineKm({ lat, lng }, s);
      if (d < min) min = d;
    }
    return min <= thresholdKm;
  });
}