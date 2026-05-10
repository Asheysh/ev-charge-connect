import { useMemo, useState } from "react";
import { AlertTriangle, BatteryCharging, Clock, Flag, IndianRupee, MapPin, Navigation, ShieldCheck, Users, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useEvStore } from "@/store/evStore";
import { haversineKm } from "@/lib/geo";
import type { ReportCategory, Station } from "@/types/ev";

/** Average city-driving speed used for the live ETA estimate when no route is computed. */
const AVG_KMH = 32;

interface Props {
  stationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user wants to navigate to this station (route on the map). */
  onRoute?: (station: Station) => void;
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "not_working", label: "Not working" },
  { value: "faulty_cable", label: "Faulty cable" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "no_station", label: "Station does not exist" },
  { value: "safety", label: "Safety issue" },
  { value: "other", label: "Other" },
];

export function StationDetailDialog({ stationId, open, onOpenChange, onRoute }: Props) {
  const { stations, liveLocation, isAuthenticated, reportStation, joinQueue, user, queues } = useEvStore();
  const station = stations.find((s) => s.id === stationId);
  const [reporting, setReporting] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("not_working");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const eta = useMemo(() => {
    if (!station || !liveLocation) return null;
    const km = haversineKm(liveLocation, { lat: station.lat, lng: station.lng });
    return { km, minutes: (km / AVG_KMH) * 60 };
  }, [station, liveLocation]);

  if (!station) return null;
  const queue = queues[station.id] ?? [];
  const userQueue = queue.find((entry) => entry.user_id === user.id);

  async function handleReport() {
    setSubmitting(true);
    try {
      await reportStation({ stationId: station.id, category, message: message.trim() });
      setSubmitted(true);
      setMessage("");
      setTimeout(() => { setReporting(false); setSubmitted(false); }, 1400);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><Zap className="size-4" /></span>
            {station.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1 text-xs"><MapPin className="size-3.5" /> {station.address} · {station.city}</DialogDescription>
        </DialogHeader>

        {/* ETA + key stats */}
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={<Clock className="size-4" />} label="ETA from you" value={eta ? `${Math.round(eta.minutes)} min · ${eta.km.toFixed(1)} km` : "Allow location"} />
          <Stat icon={<BatteryCharging className="size-4" />} label="Power" value={`${station.power_kw ?? 0} kW`} />
          <Stat icon={<Users className="size-4" />} label="Slots" value={`${station.available_slots}/${station.total_slots}`} />
          <Stat icon={<IndianRupee className="size-4" />} label="Price" value={`₹${station.price_per_kwh}/kWh`} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs"><span>Reliability</span><span className="font-semibold">{station.reliability_score}%</span></div>
          <Progress value={station.reliability_score} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {station.connector_types.map((c) => <span key={c} className="rounded-full bg-secondary px-2.5 py-1">{c}</span>)}
          {station.amenities.map((a) => <span key={a} className="rounded-full bg-secondary/60 px-2.5 py-1">{a}</span>)}
          <span className={`rounded-full px-2.5 py-1 capitalize ${station.active === false ? "bg-destructive text-destructive-foreground" : "bg-primary/10 text-primary"}`}>{station.active === false ? "Offline" : station.status}</span>
        </div>

        {!reporting ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="hero" className="h-11" onClick={() => onRoute?.(station)}>
              <Navigation className="size-4" /> Navigate
            </Button>
            <Button variant="secondary" className="h-11" onClick={() => void joinQueue(station.id)} disabled={Boolean(userQueue)}>
              {userQueue ? `Queue #${userQueue.position}` : "Join queue"}
            </Button>
            <Button variant="outline" className="col-span-2 h-11" onClick={() => setReporting(true)}>
              <Flag className="size-4 text-destructive" /> Report a problem
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-destructive" /> Report this station</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${category === c.value ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"}`}>{c.label}</button>
              ))}
            </div>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Describe the issue (optional)" className="min-h-20" />
            {!isAuthenticated ? <p className="text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline size-3" /> Sign in to submit. Demo report will be saved locally.</p> : null}
            {submitted ? <p className="text-xs font-semibold text-primary">Thanks — report submitted.</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReporting(false)} disabled={submitting}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => void handleReport()} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit report"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">5+ reports in 24h auto-disable the station; admins can re-enable from the dashboard.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="flex items-center gap-1.5 text-primary text-[10px] font-semibold uppercase tracking-wider">{icon}{label}</div>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
