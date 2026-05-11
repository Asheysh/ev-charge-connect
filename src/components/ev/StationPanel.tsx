import React from "react";

import {
  Battery,
  CheckCircle2,
  Clock3,
  IndianRupee,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

import { useEvStore } from "../../store/evStore";
export function StationPanel() {
  const navigate = useNavigate();
  const { stations, selectedStationId, queues, user, joinQueue, checkIn, startCharging, verifyStation } = useEvStore();
  const station = stations.find((item) => item.id === selectedStationId) ?? stations[0];
  if (!station) {
    return (
      <aside className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
        Loading charging station details…
      </aside>
    );
  }
  const queue = queues[station.id] ?? [];
  const userQueue = queue.find((entry) => entry.user_id === user.id);
  const estimate = Math.round(22 * station.price_per_kwh);

  return (
    <aside className="space-y-4">
      <div className="glass-panel premium-border rounded-3xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Selected station</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{station.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{station.address}</p>
          </div>
          <div className="rounded-2xl bg-secondary px-3 py-2 text-center shadow-sm">
            <p className="text-xl font-black">{station.reliability_score}%</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">reliable</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric icon={<Zap className="size-4" />} label="Slots" value={`${station.available_slots}/${station.total_slots}`} />
          <Metric icon={<Clock3 className="size-4" />} label="Wait" value={`${station.wait_minutes}m`} />
          <Metric icon={<IndianRupee className="size-4" />} label="Price" value={`₹${station.price_per_kwh}`} />
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Charger availability</span>
            <span className="font-semibold">{Math.round((station.available_slots / station.total_slots) * 100)}%</span>
          </div>
          <Progress value={(station.available_slots / station.total_slots) * 100} className="h-2" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {station.amenities.map((amenity) => (
            <span key={amenity} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="hero" onClick={() => void joinQueue(station.id)} disabled={Boolean(userQueue)}>
            {userQueue ? `Queue #${userQueue.position}` : "Join queue"}
          </Button>
          <Button variant="outline" onClick={() => checkIn(station.id)} disabled={!userQueue}>
            QR check-in
          </Button>
          <Button
  variant="secondary"
  disabled={!userQueue || userQueue.status === "charging"}
  onClick={() => {
    startCharging(station.id);

    navigate("/payment", {
      state: {
        station: station.name,
        charger: station.chargerType || "Fast DC Charger",
        amount: 250,
      },
    });
  }}
>
  Start charging
</Button>
          <Button variant="success" onClick={() => void verifyStation(station.id, "working", "excellent")}>
            Verify +75 coins
          </Button>
        </div>
      </div>

      <div className="glass-panel premium-border rounded-3xl border p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Live queue</h3>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Realtime ready</span>
        </div>
        <div className="mt-4 space-y-3">
          {queue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              No active queue. You can charge immediately.
            </div>
          ) : (
            queue.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl bg-secondary p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{entry.position}</span>
                  <div>
                    <p className="text-sm font-semibold">{entry.user_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.status} · ETA {entry.eta_minutes}m</p>
                  </div>
                </div>
                {entry.user_id === user.id && <CheckCircle2 className="size-5 text-primary" />}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="premium-border rounded-3xl border bg-gradient-soft p-5 shadow-card">
        <div className="flex items-center gap-3">
          <Battery className="size-5 text-primary" />
          <div>
            <p className="font-bold">Pre-charge estimate</p>
            <p className="text-sm text-muted-foreground">22 kWh top-up · simulated UPI final billing</p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-3xl font-black">₹{estimate}</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground"><ShieldCheck className="size-4" /> earn {Math.round(estimate / 10)} coins</span>
        </div>
      </div>
    </aside>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="text-primary">{icon}</div>
      <p className="mt-2 text-lg font-black">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
