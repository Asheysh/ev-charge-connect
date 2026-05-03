import { useMemo } from "react";
import { BatteryCharging, Car, Gauge, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";

/**
 * Connected-car panel: shows the user's vehicle, battery percent (manual entry
 * or slider), estimated range, and AI-style suggestions. Reused on the home
 * page and the booking page.
 */
export function VehiclePanel() {
  const { user, batteryPercent, setBatteryPercent } = useEvStore();
  const stations = useFilteredStations();
  const range = Math.round((batteryPercent / 100) * (user.vehicleRangeKm || 220));

  const suggestion = useMemo(() => {
    const reachable = stations.filter((s) => s.distance_km <= range);
    const best = [...reachable].sort((a, b) => b.reliability_score - a.reliability_score)[0];
    if (batteryPercent < 20) return `🔋 Critical battery. Head to ${best?.name ?? "the nearest fast charger"} now (${best?.distance_km ?? "?"} km).`;
    if (batteryPercent < 50) return `⚡ Top-up suggested. ${best?.name ?? "Fast DC chargers"} can give you ~80% in ~25 min.`;
    return `✅ Plenty of range. You can comfortably reach ${reachable.length} nearby stations.`;
  }, [batteryPercent, stations, range]);

  const tone = batteryPercent < 20 ? "text-destructive" : batteryPercent < 50 ? "text-amber-500" : "text-primary";

  return (
    <section className="glass-panel premium-border rounded-3xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Car className="size-3.5" /> Connected vehicle
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">{user.vehicleModel ?? "EV vehicle"}</h3>
          <p className="text-sm text-muted-foreground">Preferred connector: {user.preferredConnector ?? "CCS2"} · Range {user.vehicleRangeKm} km</p>
        </div>
        <div className="relative grid place-items-center">
          {/* SVG car silhouette */}
          <svg viewBox="0 0 120 60" className="h-20 w-32 text-primary drop-shadow-[0_4px_12px_oklch(0.7_0.18_180_/0.4)]">
            <path d="M10 42 L18 24 Q24 16 36 16 H78 Q92 16 100 26 L112 32 Q118 34 118 40 V46 H10 Z" fill="currentColor" opacity="0.85" />
            <circle cx="32" cy="48" r="8" fill="oklch(0.2 0 0)" />
            <circle cx="92" cy="48" r="8" fill="oklch(0.2 0 0)" />
            <rect x="36" y="22" width="22" height="14" rx="3" fill="oklch(0.95 0.02 200)" opacity="0.55" />
            <rect x="62" y="22" width="22" height="14" rx="3" fill="oklch(0.95 0.02 200)" opacity="0.55" />
          </svg>
          <span className={`mt-1 text-2xl font-black ${tone}`}>{batteryPercent}%</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3">
          <BatteryCharging className="size-4 text-primary" />
          <Slider value={[batteryPercent]} min={1} max={100} step={1} onValueChange={([v]) => setBatteryPercent(v)} className="flex-1" />
          <Input
            type="number"
            min={1}
            max={100}
            value={batteryPercent}
            onChange={(e) => setBatteryPercent(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
            className="h-9 w-20 text-center"
            aria-label="Battery percent"
          />
        </div>
        <Progress value={batteryPercent} className="h-2" />
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat icon={<Gauge className="size-3.5" />} label="Range" value={`${range} km`} />
          <Stat icon={<BatteryCharging className="size-3.5" />} label="Battery" value={`${batteryPercent}%`} />
          <Stat icon={<Sparkles className="size-3.5" />} label="Reachable" value={`${stations.filter((s) => s.distance_km <= range).length}`} />
        </div>
        <div className="rounded-2xl bg-gradient-soft p-4 text-sm">
          <p className="font-semibold">AI insight</p>
          <p className="mt-1 text-muted-foreground">{suggestion}</p>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-2.5">
      <div className="flex items-center gap-1 text-primary">{icon}<span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}