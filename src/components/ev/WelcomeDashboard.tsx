import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, Calendar, HelpCircle, MapPin, ShieldCheck, WalletCards, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEvStore } from "@/store/evStore";
import { VehiclePanel } from "@/components/ev/VehiclePanel";

/**
 * Mobile-first welcome dashboard shown on the home route. Mirrors the
 * Charging Dashboard mock: a live-status hero band + 6 quick action tiles
 * and a latest-alerts strip. Each tile is wired to a working route or
 * an in-place dialog/sheet — no dead buttons.
 */
export function WelcomeDashboard() {
  const stations = useEvStore((s) => s.stations);
  const selectedStationId = useEvStore((s) => s.selectedStationId);
  const queues = useEvStore((s) => s.queues);
  const user = useEvStore((s) => s.user);

  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const station = stations.find((s) => s.id === selectedStationId) ?? stations[0];
  const stationQueue = station ? queues[station.id] ?? [] : [];
  const yourSlot = stationQueue.find((q) => q.user_id === user.id)?.position ?? stationQueue.length + 1;
  const currentSlot = stationQueue.find((q) => q.status === "charging")?.position ?? Math.max(1, (stationQueue[0]?.position ?? 1));
  const waitMin = station?.wait_minutes ?? 0;

  const alerts = useMemo(() => {
    if (!station) return [] as { id: string; title: string; body: string; ago: string }[];
    return [
      { id: "a1", title: "Slot Confirmation: Your session is locked.", body: `Your vehicle is confirmed for Slot #${yourSlot} at '${station.name}'. Estimated arrival time: 4:35 PM.`, ago: "2m ago" },
      { id: "a2", title: "Queue update", body: `${stationQueue.length} drivers in queue · avg wait ${waitMin} min.`, ago: "8m ago" },
    ];
  }, [station, stationQueue.length, waitMin, yourSlot]);

  const tiles: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; tone: string; onClick?: () => void; to?: string }> = [
    { label: "Book Charging", icon: Calendar, tone: "text-primary", to: "/booking" },
    { label: "Payments", icon: WalletCards, tone: "text-amber-500", to: "/payment" },
    { label: "Notifications", icon: Bell, tone: "text-amber-500", onClick: () => setNotifOpen(true) },
    { label: "My Activity", icon: Activity, tone: "text-destructive", to: "/rewards" },
    { label: "Help Support", icon: HelpCircle, tone: "text-primary", onClick: () => setHelpOpen(true) },
    { label: "Find Stations", icon: MapPin, tone: "text-primary", to: "/stations" },
  ];

  return (
    <section className="grid gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Charging Dashboard</h1>
          <p className="text-sm text-muted-foreground">Get charged up for your next drive.</p>
        </div>
        <Button onClick={() => setVehiclesOpen(true)} variant="hero" className="rounded-full px-4">
          <Car className="size-4" /> Manage Vehicles
        </Button>
      </div>

      {/* Live status hero */}
      <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-glow p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-widest opacity-90">Live Station Status</p>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">Active</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <HeroStat label="Your slot" value={`#${yourSlot.toString().padStart(2, "0")}`} icon="#" />
          <HeroStat label="Current" value={`#${currentSlot.toString().padStart(2, "0")}`} icon="~" />
          <HeroStat label="Wait time" value={`${waitMin} min`} icon="⏱" />
        </div>
      </div>

      {/* Quick action tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          const inner = (
            <div className="glass-panel premium-border flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border p-4 text-center transition active:scale-95 hover:-translate-y-0.5 hover:shadow-panel">
              <Icon className={`size-7 ${t.tone}`} />
              <span className="text-sm font-semibold">{t.label}</span>
            </div>
          );
          return t.to ? (
            <Link key={t.label} to={t.to} className="block">{inner}</Link>
          ) : (
            <button key={t.label} type="button" onClick={t.onClick} className="block w-full text-left">{inner}</button>
          );
        })}
      </div>

      {/* Latest alerts */}
      <div className="glass-panel premium-border rounded-3xl border p-4">
        <p className="text-sm font-bold">Latest Alerts</p>
        <div className="mt-3 space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl bg-secondary p-3">
              <ShieldCheck className="mt-0.5 size-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.body}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">{a.ago}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Vehicles sheet */}
      <Sheet open={vehiclesOpen} onOpenChange={setVehiclesOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Manage vehicle</SheetTitle>
            <SheetDescription>Update battery, range and connector preferences.</SheetDescription>
          </SheetHeader>
          <div className="mt-4"><VehiclePanel /></div>
        </SheetContent>
      </Sheet>

      {/* Notifications */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Recent activity from your charging sessions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-xl bg-secondary p-3 text-sm">
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Help */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Help &amp; Support</DialogTitle>
            <DialogDescription>Common answers and quick contact.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl bg-secondary p-3"><b>Booking a slot:</b> open Find Stations → pick a station → tap “Book slot”.</li>
            <li className="rounded-xl bg-secondary p-3"><b>Payments:</b> use the Payments tile to settle UPI charges.</li>
            <li className="rounded-xl bg-secondary p-3"><b>Report an issue:</b> tap any station marker → Report.</li>
            <li className="rounded-xl bg-secondary p-3"><b>Email:</b> support@chargegrid.app</li>
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function HeroStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-2xl font-black"><span className="opacity-70">{icon}</span>{value}</p>
    </div>
  );
}