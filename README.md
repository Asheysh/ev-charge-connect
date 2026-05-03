# Smart EV Charging Assistant ⚡

A portable, client-side React app for discovering EV charging stations, joining live queues, planning EV road trips, and (for admins) managing stations on a map. Built with React 19 + Vite + Tailwind v4 + Supabase.

> Looking for the in-depth customization manual? See **[DOCS.md](./DOCS.md)** — it covers every editable surface (branding, routes, theming, payments, AI, Supabase setup, etc.).

## Highlights

- 🗺️ Live map (Leaflet) with clustered station markers and your live GPS location
- 🧭 Travel planner: A → B route + on-route chargers + AI range insight (free OSRM + Nominatim)
- 🚗 Connected-vehicle panel with manual SoC entry and range/suggestion engine
- 🪪 Supabase auth — email/password + Google OAuth, **Guest mode** until you log in
- 🛠️ Admin console — drop-pin to add stations, click any station for pricing/profit/edit
- 💸 Simulated UPI payment, rewards & verification flow
- ☁️ Static SPA — deploys anywhere (Vercel, Netlify, GitHub Pages) with no adapters

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # produces dist/
npm run preview
```

## Configuration

Environment variables are optional — sensible defaults ship inline. Override via `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
VITE_OSRM_URL=https://router.project-osrm.org/route/v1/driving   # optional
```

## Deployment

It's a plain SPA — drop `dist/` on any static host:

| Platform     | Command                              |
| ------------ | ------------------------------------ |
| Vercel       | `vercel` (auto-detects Vite)         |
| Netlify      | `netlify deploy --dir=dist --prod`   |
| GitHub Pages | push `dist/` to `gh-pages` branch    |

For client-side routes to work on hard refresh, configure SPA fallback (rewrite all unknown paths to `/index.html`). Vercel/Netlify do this automatically; for GH Pages copy `index.html` to `404.html`.

## Roles

After signup every user gets the `user` role. Promote yourself to admin with one SQL query (see DOCS.md › Admin role).

## Project layout

```
src/
  App.tsx                   # routes
  components/ev/            # feature components (Map, Vehicle, Planner, Admin…)
  components/ui/            # shadcn primitives
  hooks/                    # useGeolocation, useFilteredStations
  lib/geo.ts                # routing, geocoding, distance helpers
  services/                 # supabaseClient, authApi, evApi, seedData
  store/evStore.ts          # zustand store (single source of truth)
  styles.css                # design tokens
```

See **DOCS.md** for the full guide — branding, theming, adding routes, swapping AI/payments, scaling Supabase.
