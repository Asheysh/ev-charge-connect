import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Award, BarChart3, BatteryCharging, Compass, Crown, Flag, Gauge, IndianRupee, LogOut, Map, Navigation, QrCode, Search, Settings2, ShieldCheck, Sparkles, UserRound, Users, WalletCards, Zap, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useEvStore } from "@/store/evStore";
import { useFilteredStations } from "@/hooks/useFilteredStations";
import { DEMO_ACCOUNTS } from "@/lib/roles";

export function TopBar() {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, guestMode, logout } = useEvStore();
  const { pathname } = useLocation();
  // Build the nav based on the visitor's role.
  // - guest: map, stations, planner, login
  // - normal user (signed in): full app minus admin & login
  // - station manager / admin: full app + admin, no login
  // - super-admin: same as admin (master controls live inside /admin)
  type Tab = readonly [string, string, typeof Map];
  const all: Record<string, Tab> = {
    map: ["/", "Map", Map],
    stations: ["/stations", "Stations", Zap],
    queue: ["/booking", "Queue", Users],
    planner: ["/planner", "Planner", Compass],
    pay: ["/payment", "Pay", WalletCards],
    rewards: ["/rewards", "Rewards", Award],
    admin: ["/admin", "Admin", BarChart3],
    login: ["/login", "Login", UserRound],
  };
  const tabs: Tab[] = (() => {
    if (guestMode && !isAuthenticated) return [all.map, all.stations, all.planner, all.login];
    if (isAdmin || isSuperAdmin) return [all.map, all.stations, all.queue, all.planner, all.pay, all.rewards, all.admin];
    if (isAuthenticated) return [all.map, all.stations, all.queue, all.planner, all.pay, all.rewards];
    return [all.login];
  })();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/82 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow ring-1 ring-primary/20">
            <BatteryCharging className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Smart EV Charging Assistant</h1>
            <p className="text-xs text-muted-foreground">India-ready station discovery, queues, UPI and rewards</p>
          </div>
        </Link>
        <nav className="glass-panel premium-border flex gap-1 overflow-x-auto rounded-2xl border p-1.5">
          {tabs.map(([to, label, Icon]) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="glass-panel premium-border flex items-center gap-3 rounded-2xl border px-3 py-2">
          <div className="text-right">
            <p className="text-sm font-bold">{isAuthenticated ? user.name : guestMode ? "Guest" : "—"}</p>
            <p className="text-xs text-muted-foreground">
              {isSuperAdmin ? "Main admin" : isAdmin ? "Station manager" : isAuthenticated ? `Signed in · ${user.coins} coins` : guestMode ? "Browsing as guest" : "Not signed in"}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-accent font-black text-accent-foreground">
            {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          {(isAuthenticated || guestMode) ? <Button size="icon" variant="ghost" onClick={() => void logout()} aria-label="Sign out"><LogOut /></Button> : null}
        </div>
      </div>
    </header>
  );
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  const { loadStations, loadAuth, refreshQueue, selectedStationId } = useEvStore();

  useEffect(() => {
    void loadAuth();
    void loadStations();
  }, [loadAuth, loadStations]);

  useEffect(() => {
    void refreshQueue(selectedStationId);
  }, [refreshQueue, selectedStationId]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="mx-auto grid max-w-[1560px] gap-6 px-4 py-6 lg:px-6">{children}</div>
    </main>
  );
}

export function FilterPanel() {
  const { filters, setFilters, batteryPercent, setBatteryPercent, stations } = useEvStore();
  const filteredStations = useFilteredStations();
  const cities = useMemo(() => Array.from(new Set(stations.map((station) => station.city))).sort(), [stations]);
  const connectors = useMemo(() => Array.from(new Set(stations.flatMap((station) => station.connector_types))).sort(), [stations]);

  return (
    <div className="glass-panel premium-border rounded-3xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary"><Sparkles className="size-3.5" /> Filters</p>
          <h2 className="text-2xl font-black tracking-tight">Find the best charger</h2>
        </div>
        <Settings2 className="size-5 text-muted-foreground" />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-2">
          <span className="text-sm font-semibold">City</span>
          <select value={filters.city} onChange={(event) => setFilters({ city: event.target.value })} className="h-11 w-full rounded-xl border border-input bg-card/70 px-3 text-sm shadow-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring">
            <option value="all">All cities</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Charger type</span>
          <select value={filters.chargerType} onChange={(event) => setFilters({ chargerType: event.target.value as typeof filters.chargerType })} className="h-11 w-full rounded-xl border border-input bg-card/70 px-3 text-sm shadow-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring">
            <option value="all">All chargers</option>
            <option value="AC">AC</option>
            <option value="DC">DC</option>
            <option value="Fast DC">Fast DC</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Connector</span>
          <select value={filters.connector} onChange={(event) => setFilters({ connector: event.target.value })} className="h-11 w-full rounded-xl border border-input bg-card/70 px-3 text-sm shadow-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring">
            <option value="all">All connectors</option>
            {connectors.map((connector) => <option key={connector} value={connector}>{connector}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Availability</span>
          <select value={filters.availability} onChange={(event) => setFilters({ availability: event.target.value as typeof filters.availability })} className="h-11 w-full rounded-xl border border-input bg-card/70 px-3 text-sm shadow-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring">
            <option value="all">All statuses</option>
            <option value="available">Available now</option>
            <option value="busy">Queue only</option>
          </select>
        </label>
        <label className="space-y-3">
          <span className="flex justify-between text-sm font-semibold"><span>Distance</span><span>{filters.maxDistance} km</span></span>
          <Slider value={[filters.maxDistance]} min={5} max={45} step={1} onValueChange={([value]) => setFilters({ maxDistance: value })} />
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
    <div className="grid gap-4 lg:grid-cols-3">
      {filteredStations.slice(0, 3).map((station, index) => (
        <button key={station.id} onClick={() => setSelectedStation(station.id)} className="group glass-panel premium-border rounded-3xl border p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-panel">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-glow">#{index + 1} recommended</span>
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">{station.reliability_score}%</span>
          </div>
          <h3 className="mt-4 text-xl font-black tracking-tight">{station.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{station.distance_km} km · {station.available_slots} slots · {station.wait_minutes} min wait</p>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Navigation className="size-3.5 text-primary" /> {station.connector_types.join(" / ")} · {station.power_kw} kW</p>
        </button>
      ))}
    </div>
  );
}

export function StationsDirectory() {
  const stations = useFilteredStations();
  const setSelectedStation = useEvStore((state) => state.setSelectedStation);
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {stations.map((station) => (
        <article key={station.id} className="glass-panel premium-border rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{station.operator}</p>
              <h2 className="mt-2 text-xl font-black">{station.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{station.address}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize">{station.status}</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
            <Metric label="Slots" value={`${station.available_slots}/${station.total_slots}`} icon={<Zap />} />
            <Metric label="Wait" value={`${station.wait_minutes}m`} icon={<Users />} />
            <Metric label="Power" value={`${station.power_kw}kW`} icon={<Gauge />} />
            <Metric label="Price" value={`₹${station.price_per_kwh}`} icon={<IndianRupee />} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {station.connector_types.map((connector) => <span key={connector} className="rounded-full bg-secondary px-3 py-1 text-xs">{connector}</span>)}
          </div>
          <Button className="mt-5 w-full" asChild variant="hero" onClick={() => setSelectedStation(station.id)}>
            <Link to="/booking">Book slot</Link>
          </Button>
        </article>
      ))}
    </section>
  );
}

export function PaymentPanel() {
  const { stations, selectedStationId, completePayment, transactions } = useEvStore();
  const station = stations.find((item) => item.id === selectedStationId) ?? stations[0];
  if (!station) return <EmptyLine text="Loading payment details…" />;
  const amount = Math.round(station.price_per_kwh * 22);

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="glass-panel premium-border rounded-3xl border p-6">
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
      <div className="glass-panel premium-border rounded-3xl border p-6">
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
        <div className="glass-panel premium-border rounded-3xl border p-6 lg:col-span-1">
        <Award className="size-8 text-primary" />
        <h2 className="mt-4 text-4xl font-black">{user.coins}</h2>
        <p className="text-muted-foreground">coins available for discounts and priority queue boosts</p>
        <Progress value={Math.min(100, (user.coins / 2000) * 100)} className="mt-5 h-2" />
      </div>
      <div className="glass-panel premium-border rounded-3xl border p-6 lg:col-span-2">
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
  const { stations, toggleStationActive, reports, loadReports, isSuperAdmin } = useEvStore();
  useEffect(() => { void loadReports(); }, [loadReports]);
  const activeSessions = stations.reduce((sum, station) => sum + (station.total_slots - station.available_slots), 0);
  const averageReliability = stations.length > 0 ? Math.round(stations.reduce((s, x) => s + x.reliability_score, 0) / stations.length) : 0;
  const offline = stations.filter((s) => s.active === false).length;
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <div className="glass-panel premium-border rounded-3xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Admin command centre</h2>
          {isSuperAdmin ? <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600"><Crown className="size-3.5" /> Super-admin</span> : null}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric label="Stations" value={stations.length.toString()} icon={<Zap />} />
          <Metric label="Active slots" value={activeSessions.toString()} icon={<Gauge />} />
          <Metric label="Avg reliability" value={`${averageReliability}%`} icon={<ShieldCheck />} />
          <Metric label="Offline stations" value={offline.toString()} icon={<Flag />} />
        </div>
      </div>
      <div className="glass-panel premium-border rounded-3xl border p-6">
        <div className="flex items-center gap-2"><Search className="size-5 text-primary" /><Input placeholder="Search stations, charger IDs, operators" /></div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          {stations.map((station) => {
            const r = reports.filter((x) => x.station_id === station.id && x.status === "open").length;
            return (
              <div key={station.id} className="grid gap-3 border-b border-border p-3 text-sm last:border-0 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_auto]">
                <span className="font-semibold">{station.name}</span>
                <span>{station.city}</span>
                <span>{station.charger_type}</span>
                <span>{station.available_slots}/{station.total_slots} free</span>
                <span className="flex items-center gap-1">{r > 0 ? <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground"><Flag className="mr-1 inline size-2.5" />{r}</span> : <span className="text-muted-foreground">—</span>}</span>
                <Switch checked={station.active !== false} onCheckedChange={(v) => void toggleStationActive(station.id, v)} aria-label="Toggle active" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AuthPanel() {
  const { login, loginWithGoogle, signup, authError, isAuthenticated, user, logout, enterGuestMode } = useEvStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", vehicleModel: "" });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") await login(form.email, form.password);
      else await signup(form);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function quickDemo(email: string, password: string) {
    setLoading(true); setError("");
    try { await login(email, password); navigate("/"); }
    catch (err) { setError(err instanceof Error ? err.message : "Demo sign-in failed. Make sure the account is created in Supabase Auth."); }
    finally { setLoading(false); }
  }

  function continueAsGuest() {
    enterGuestMode();
    navigate("/");
  }

  if (isAuthenticated) {
    return (
      <section className="glass-panel premium-border mx-auto w-full max-w-2xl rounded-3xl border p-6">
        <UserRound className="size-8 text-primary" />
        <h2 className="mt-4 text-2xl font-black">Signed in as {user.name}</h2>
        <p className="mt-2 text-muted-foreground">{user.email} · {user.vehicleModel ?? "EV profile ready"}</p>
        <Button className="mt-6" variant="outline" onClick={() => void logout()}>Sign out</Button>
      </section>
    );
  }

  return (
    <section className="glass-panel premium-border mx-auto w-full max-w-2xl rounded-3xl border p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Sign in to continue</p>
          <h2 className="text-2xl font-black">{mode === "login" ? "Login" : "Create driver profile"}</h2>
        </div>
        <Button variant="secondary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign up" : "Login"}</Button>
      </div>
      <Button className="mt-6 w-full" type="button" variant="outline" disabled={loading} onClick={() => void handleGoogleLogin()}>
        <UserRound className="size-4" /> Continue with Google
      </Button>
      <Button className="mt-2 w-full" type="button" variant="ghost" disabled={loading} onClick={continueAsGuest}>
        Continue as guest (limited access)
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> Email <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        {mode === "signup" ? <Input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /> : null}
        <Input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Input required type="password" minLength={6} placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {mode === "signup" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <Input placeholder="Vehicle model" value={form.vehicleModel} onChange={(event) => setForm({ ...form, vehicleModel: event.target.value })} />
          </div>
        ) : null}
        {(error || authError) ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error || authError}</p> : null}
        <Button type="submit" variant="hero" disabled={loading}>{loading ? "Please wait" : mode === "login" ? "Login" : "Create account"}</Button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-border/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Demo accounts</p>
        <p className="mt-1 text-xs text-muted-foreground">Quick-fill the seeded admin / station-manager credentials. Accounts must exist in Supabase Auth (see DOCS.md).</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((acc) => (
            <Button key={acc.email} type="button" size="sm" variant="secondary" disabled={loading} onClick={() => void quickDemo(acc.email, acc.password)}>
              {acc.role === "super_admin" ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />} {acc.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyLine({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>; }
function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl bg-secondary p-3"><div className="text-primary [&_svg]:size-5">{icon}</div><p className="mt-2 text-lg font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }
