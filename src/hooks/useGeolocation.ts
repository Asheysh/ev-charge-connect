import { useEffect, useState } from "react";

export interface GeoState {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

/**
 * Subscribes to the browser geolocation API. Auto-starts on mount and keeps
 * the position updated while the component is alive. See DOCS.md › Live Location.
 */
export function useGeolocation(autoStart = true) {
  const [state, setState] = useState<GeoState>({ coords: null, error: null, loading: autoStart });
  const [enabled, setEnabled] = useState(autoStart);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    setState((s) => ({ ...s, loading: true }));
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        }),
      (err) => setState({ coords: null, error: err.message, loading: false }),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { ...state, request: () => setEnabled(true), stop: () => setEnabled(false) };
}