import { Award, BarChart3, BatteryCharging, Gauge, IndianRupee, QrCode, Search, Settings2, ShieldCheck, Users, WalletCards, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";

export function TopBar() {
  const { user, activeTab, setActiveTab } = useEvStore();
  const tabs = [
    ["map", "Map", Zap],
    ["queue", "Queue", Users],
    ["pay", "Pay", WalletCards],
    ["rewards", "Rewards", Award],
    ["admin", "Admin", BarChart3],
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <BatteryCharging className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Smart EV Charging Assistant</h1>
            <p className="text-xs text-muted-foreground">India-ready station discovery, queues, UPI and rewards</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-card">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === id ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-card">
          <div className="text-right">
            <p className="text-sm font-bold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.coins} reward coins</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-accent font-black text-accent-foreground">AS</div>
        </div>
      </div>
    </header>
  );
}

export function FilterPanel() {
  const { filters, setFilters, batteryPercent, setBatteryPercent } = useEvStore();
  const filteredStations = useFilteredStations();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Filters</p>
          <h2 className="text-xl font-black">Find the best charger</h2>
        </div>
        <Settings2 className="size-5 text-muted-foreground" />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold">Charger type</span>
          <select
            value={filters.chargerType}
            onChange={(event) => setFilters({ chargerType: event.target.value as typeof filters.chargerType })}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          >
            <option value="all">All chargers</option>
            <option value="AC">AC</option>
            <option value="DC">DC</option>
            <option value="Fast DC">Fast DC</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Availability</span>
          <select
            value={filters.availability}
            onChange={(event) => setFilters({ availability: event.target.value as typeof filters.availability })}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          >
            <option value="all">All statuses</option>
            <option value="available">Available now</option>
            <option value="busy">Queue only</option>
          </select>
        </label>
        <label className="space-y-3">
          <span className="flex justify-between text-sm font-semibold"><span>Distance</span><span>{filters.maxDistance} km</span></span>
          <Slider value={[filters.maxDistance]} min={5} max={40} step={1} onValueChange={([value]) => setFilters({ maxDistance: value })} />
        </label>
        <label className="space-y-3">
          <span className="flex justify-between text-sm font-semibold"><span>Battery</span><span>{batteryPercent}%</span></span>
          <Slider value={[batteryPercent]} min={5} max={100} step={1} onValueChange={([value]) => setBatteryPercent(value)} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="rounded-full bg-secondary px-3 py-1">{filteredStations.length} matching stations</span>
        <span className="rounded-full bg-secondary px-3 py-1">Reachable range: {Math.round((batteryPercent / 100) * 240)} km</span>
        <span className="rounded-full bg-secondary px-3 py-1">Max ₹{filters.maxPrice}/kWh</span>
      </div>
    </div>
  );
}

export function RecommendationRail() {
  const filteredStations = useFilteredStations();
  const setSelectedStation = useEvStore((state) => state.setSelectedStation);
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {filteredStations.slice(0, 3).map((station, index) => (
        <button key={station.id} onClick={() => setSelectedStation(station.id)} className="group rounded-2xl border border-border bg-card p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-panel">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">#{index + 1} recommended</span>
            <span className="text-sm font-bold text-primary">{station.reliability_score}%</span>
          </div>
          <h3 className="mt-4 text-lg font-black">{station.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{station.distance_km} km · {station.available_slots} slots · {station.wait_minutes} min wait</p>
        </button>
      ))}
    </div>
  );
}

export function PaymentPanel() {
  const { stations, selectedStationId, completePayment, transactions } = useEvStore();
  const station = stations.find((item) => item.id === selectedStationId) ?? stations[0];
  const amount = Math.round(station.price_per_kwh * 22);

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3"><QrCode className="size-6 text-primary" /><h2 className="text-2xl font-black">Simulated UPI payment</h2></div>
        <div className="mx-auto mt-6 grid size-56 place-items-center rounded-2xl border border-border bg-background p-5 shadow-inner">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 75 }, (_, i) => <span key={i} className={`size-2 rounded-[2px] ${i % 3 === 0 || i % 7 === 0 ? "bg-foreground" : "bg-muted"}`} />)}
          </div>
        </div>
        <div className="mt-6 rounded-xl bg-secondary p-4 text-center">
          <p className="text-sm text-muted-foreground">Payable estimate at {station.name}</p>
          <p className="mt-1 text-4xl font-black">₹{amount}</p>
        </div>
        <Button className="mt-5 w-full" variant="hero" onClick={() => void completePayment(station.id, amount)}>Mark payment successful</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-xl font-black">Transaction ledger</h3>
        <div className="mt-4 space-y-3">
          {transactions.length === 0 ? <EmptyLine text="No payments yet. Complete a simulated UPI payment to create the first transaction." /> : transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between rounded-xl bg-secondary p-4">
              <span className="font-semibold">{txn.method} · {txn.status}</span><span className="font-black">₹{txn.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RewardsPanel() {
  const user = useEvStore((state) => state.user);
  const tiers = [{ label: "Verify stations", value: 75 }, { label: "Join queue", value: 25 }, { label: "Complete charge", value: 40 }];
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-1">
        <Award className="size-8 text-primary" />
        <h2 className="mt-4 text-4xl font-black">{user.coins}</h2>
        <p className="text-muted-foreground">coins available for discounts and priority queue boosts</p>
        <Progress value={Math.min(100, (user.coins / 2000) * 100)} className="mt-5 h-2" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
        <h3 className="text-xl font-black">Reward rules</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {tiers.map((tier) => <div key={tier.label} className="rounded-xl bg-secondary p-4"><p className="font-bold">+{tier.value}</p><p className="text-sm text-muted-foreground">{tier.label}</p></div>)}
        </div>
        <div className="mt-5 rounded-xl bg-gradient-soft p-5"><ShieldCheck className="mb-2 size-5 text-primary" />Use 500 coins for a ₹50 discount or priority queue upgrade.</div>
      </div>
    </section>
  );
}

export function AdminPanel() {
  const stations = useEvStore((state) => state.stations);
  const activeSessions = stations.reduce((sum, station) => sum + (station.total_slots - station.available_slots), 0);
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-2xl font-black">Admin command centre</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric label="Stations" value={stations.length.toString()} icon={<Zap />} />
          <Metric label="Active slots" value={activeSessions.toString()} icon={<Gauge />} />
          <Metric label="Avg reliability" value={`${Math.round(stations.reduce((s, x) => s + x.reliability_score, 0) / stations.length)}%`} icon={<ShieldCheck />} />
          <Metric label="Revenue today" value="₹18.4k" icon={<IndianRupee />} />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2"><Search className="size-5 text-primary" /><Input placeholder="Search stations, charger IDs, operators" /></div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          {stations.map((station) => (
            <div key={station.id} className="grid grid-cols-4 gap-3 border-b border-border p-3 text-sm last:border-0">
              <span className="font-semibold">{station.name}</span><span>{station.charger_type}</span><span>{station.available_slots}/{station.total_slots} free</span><span>₹{station.price_per_kwh}/kWh</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyLine({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>; }
function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl bg-secondary p-4"><div className="text-primary [&_svg]:size-5">{icon}</div><p className="mt-3 text-2xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>; }
