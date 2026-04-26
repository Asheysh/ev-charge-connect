import { useMemo } from "react";
import { useEvStore } from "@/store/evStore";

export function useFilteredStations() {
  const stations = useEvStore((state) => state.stations);
  const filters = useEvStore((state) => state.filters);
  const batteryPercent = useEvStore((state) => state.batteryPercent);

  return useMemo(() => {
    const reachableKm = Math.max(8, Math.round((batteryPercent / 100) * 240));
    return stations
      .filter((station) => filters.chargerType === "all" || station.charger_type === filters.chargerType)
      .filter((station) => filters.availability === "all" || (filters.availability === "available" ? station.available_slots > 0 : station.available_slots === 0))
      .filter((station) => station.distance_km <= filters.maxDistance)
      .filter((station) => station.price_per_kwh <= filters.maxPrice)
      .map((station) => ({
        ...station,
        reachable: station.distance_km <= reachableKm,
        recommendationScore:
          station.reliability_score + station.available_slots * 4 - station.wait_minutes * 0.8 - station.distance_km * 0.7,
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }, [batteryPercent, filters, stations]);
}
