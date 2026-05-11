# Developer Manual — Smart EV Charging Assistant

Everything you can edit, configure, or extend, in one place. Each section names the **file(s)** and the **why** so you can scale without breaking other parts.

---

## 1. Site identity / branding

| What             | Where                                                   |
| ---------------- | ------------------------------------------------------- |
| Site title       | `index.html` `<title>`                                  |
| Header name      | `src/components/ev/ControlPanels.tsx` → `TopBar`        |
| Tagline          | Same file, `<p>India-ready station discovery…</p>`      |
| Logo icon        | Same file, `<BatteryCharging>` from `lucide-react`      |
| Favicon          | `public/` (drop `favicon.ico`) and reference in `index.html` |
| OG / SEO meta    | `index.html` `<head>`                                   |

Renaming the product? Search-replace `Smart EV Charging Assistant` and update `package.json` `name`.

---

## 2. Theming & design tokens

All colors are **oklch** semantic tokens defined in `src/styles.css`:

- `:root { --primary, --background, --card, --accent, ... }`
- `.dark { ... }`
- Custom utilities: `.glass-panel`, `.premium-border`, `.shadow-glow`, `.bg-gradient-soft`

Add a new color:
1. Add `--brand: oklch(0.7 0.2 40);` to `:root` (and `.dark`).
2. Register in the `@theme inline` block: `--color-brand: var(--brand);`
3. Use `bg-brand text-brand-foreground` anywhere.

**Never** hardcode hex/rgb in components — always use tokens.

---

## 3. Routing

Routes are declared in `src/App.tsx` using `react-router-dom`:

```tsx
<Route path="/planner" element={<PageFrame><TravelPlanner /></PageFrame>} />
```

Add a new page:
1. Build a component under `src/components/ev/MyThing.tsx`.
2. Add a `<Route>` in `App.tsx`.
3. Add a tab to the `tabs` array in `ControlPanels.tsx` → `TopBar`.

`PageFrame` provides the header, store hydration, and layout; wrap every page in it.

---

## 4. State management (zustand)

Single source of truth: `src/store/evStore.ts`. Every feature reads/writes here.

Key slices:
- **auth**: `user, isAuthenticated, isAdmin, loadAuth, login, signup, logout`
- **stations**: `stations, addStation, updateStation, removeStation`
- **filters**: `filters, setFilters, batteryPercent, setBatteryPercent`
- **queue**: `queues, refreshQueue, joinQueue, checkIn, startCharging`
- **maps**: `liveLocation, setLiveLocation, activeRoute, setActiveRoute`
- **payments**: `transactions, completePayment`

Add a new slice by extending the `EvState` interface and the `create<EvState>()` body. Components consume via `useEvStore((s) => s.thing)`.

---

## 5. Supabase backend

Client: `src/services/supabaseClient.ts`. Reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` with safe inline defaults.

### 5.1 Schema (already migrated)

| Table                   | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `profiles`              | User profile (name, vehicle, coins, range)    |
| `user_roles`            | `(user_id, role: admin\|operator\|user)`      |
| `stations`              | Station catalog                               |
| `chargers`              | Per-charger inventory                         |
| `queue`                 | Live queue entries                            |
| `sessions`              | Charging sessions                             |
| `transactions`          | UPI payments                                  |
| `reviews_verification`  | Crowd-sourced reliability                     |
| `travel_plans`          | Saved AI route plans                          |

Trigger `on_auth_user_created` automatically inserts a `profiles` row + `user` role on signup.

### 5.2 RLS summary

- `profiles` — owner-only read/write
- `stations` — public read; **admin** insert/update/delete
- `queue` — public read; user insert/update/delete own row
- `transactions`, `sessions`, `travel_plans` — owner-only
- `user_roles` — user reads own; admin manages all

### 5.3 Admin role

Promote a signed-up user to admin:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<auth-user-uuid>', 'admin');
```

Find the UUID in the Auth → Users table.

### 5.4 Adding a table

1. Write a migration with `CREATE TABLE`, then `ALTER TABLE … ENABLE ROW LEVEL SECURITY`.
2. Add policies for SELECT/INSERT/UPDATE/DELETE per role.
3. Use the auto-generated types via `import { supabase } from "@/services/supabaseClient"`.
4. Wrap reads/writes in a function inside `src/services/<name>Api.ts`.
5. Expose to UI through the store.

### 5.5 Auth providers

Email + Google are wired in `src/services/authApi.ts`. To add Apple/SAML, enable in Supabase dashboard then call `supabase.auth.signInWithOAuth({ provider: "apple" })`.

---

## 6. Maps & routing

- Tiles: free OpenStreetMap (no key).
- Routing: free **OSRM demo** — for production, host your own and set `VITE_OSRM_URL`.
- Geocoding: free **Nominatim** — same caveat (rate limits, usage policy).
- Live position: `src/hooks/useGeolocation.ts` (browser API, no SDK).

Pure helpers live in `src/lib/geo.ts`: `haversineKm`, `fetchRoute`, `geocode`, `stationsAlongRoute`.

To swap providers (Mapbox, HERE), replace the body of those two helpers — UI stays untouched.

---

## 7. Vehicle / battery panel

`src/components/ev/VehiclePanel.tsx`. Range = `batteryPercent/100 × user.vehicleRangeKm`. Suggestion logic is heuristic; replace `useMemo` with a call to your AI gateway for smarter advice.

---

## 8. Travel planner

`src/components/ev/TravelPlanner.tsx`. Pipeline: geocode origin/destination → OSRM route → filter stations within 12 km perpendicular distance → estimate stops needed.

Persist a plan with the `travel_plans` table — UI hook not yet wired; sample insert:

```ts
await supabase.from("travel_plans").insert({
  user_id: user.id,
  origin_label, destination_label,
  origin_lat, origin_lng, dest_lat, dest_lng,
  distance_km, duration_min,
  station_ids: stops.map(s => s.id),
  ai_summary: insight,
});
```

---

## 9. Admin console

`src/components/ev/AdminStationManager.tsx`. Three actions:
1. **Drop pin** → toggles map `pickMode`, click anywhere to fill lat/lng.
2. **Add station** → pushes to local store; for persistence call `supabase.from("stations").insert(...)` (admin RLS already permits it).
3. **Click station name** → modal with rating, price, slots, derived `Profit/day = total_slots × 120 kWh × price × 0.35`. Tweak the formula to your tariff.

To persist edits: in `updateStation` add `await supabase.from("stations").update(patch).eq("id", id)`.

---

## 10. Payments

Currently a simulated UPI flow in `src/components/ev/ControlPanels.tsx` → `PaymentPanel`. To plug a real provider:

- Razorpay/Stripe → enable via Lovable Connectors, replace `completePayment` in the store with a checkout call, then insert into `transactions` on webhook success.

---

## 11. Rewards

Coins are a numeric column on `profiles`. Earn rules live in:
- `joinQueue` (+25), `verifyStation` (+75), `completePayment` (+amount/10).

Change values in `src/store/evStore.ts`.

---

## 12. Adding a new feature — recipe

1. **Model** — extend types in `src/types/ev.ts`.
2. **Persist** — add table + RLS in a migration.
3. **API** — add a function in `src/services/<name>Api.ts`.
4. **State** — extend the store slice.
5. **UI** — drop a component in `src/components/ev/`.
6. **Route** — register in `App.tsx` + tab in `TopBar`.

Modular, no cross-imports between feature components — they all talk through the store.

---

## 13. Build & deploy gotchas

- SPA fallback required (Vercel/Netlify auto, GH Pages → copy `index.html` → `404.html`).
- Geolocation requires HTTPS (works on `localhost`).
- OSRM demo throttles — host your own at scale.
- Supabase publishable keys are safe in the bundle; never ship the **service role** key.

---

## 14. File map (quick jump)

```
index.html                          ← title, meta, favicon
src/styles.css                      ← all theme tokens
src/App.tsx                         ← routes
src/main.tsx                        ← React root
src/components/ev/
  ControlPanels.tsx                 ← TopBar, FilterPanel, AdminPanel summary, AuthPanel
  EvMap.tsx + EvMapClient.tsx       ← Leaflet map + live location + routing
  StationPanel.tsx                  ← Selected-station card
  VehiclePanel.tsx                  ← Connected-car / battery
  TravelPlanner.tsx                 ← A→B trip planner
  AdminStationManager.tsx           ← Station CRUD + pin drop
src/hooks/
  useGeolocation.ts                 ← live GPS
  useFilteredStations.ts            ← derived list
src/lib/geo.ts                      ← routing/geocoding helpers
src/services/
  supabaseClient.ts                 ← single Supabase instance
  authApi.ts, evApi.ts              ← typed wrappers
  seedData.ts                       ← demo content (delete once Supabase is populated)
src/store/evStore.ts                ← zustand store
src/types/ev.ts                     ← domain types
```

Happy hacking ⚡
