# Smart EV Charging Assistant Platform

A portable, client-side React + Vite web app for EV charging station discovery, slot booking, queue management, QR-style check-in, Supabase authentication, driver profiles, simulated UPI payments, rewards, and admin operations.

## Current Architecture

This project is a standard static React application:

- No SSR
- No TanStack Start
- No generated route tree
- No server output
- No platform-specific build adapter
- Standard `index.html` + `src/main.tsx` entry
- Standard Vite output in `dist/`

## Features

- Multi-page client-side app: Map, Stations, Booking, Payment, Rewards, Admin, Login
- Interactive Leaflet + OpenStreetMap station map with clustered markers
- Expanded NCR demo network with operators, connectors, power, peak hours, queue states, amenities, and reliability data
- Filters for city, charger type, connector, availability, distance, price, and battery reachability
- Station booking panel with queue states: `waiting`, `next`, `arrived`, `charging`, `completed`, `skipped`
- Supabase email/password authentication with driver profile records
- Google sign-in through Supabase Auth when enabled in the project
- Queue join, QR check-in simulation, start charging, and final payment flow
- Reliability verification with cable condition and reward coins
- Battery-based station recommendations and backup station ranking
- Simulated UPI QR payment and transaction ledger
- Rewards system for verification, queue updates, and completed usage
- Admin dashboard for station health, slots, pricing, reliability, usage, and revenue insights
- Demo station fallback so the UI stays usable even before live station tables are populated

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router DOM
- Tailwind CSS v4
- Zustand state management
- Leaflet, React Leaflet, OpenStreetMap tiles
- Supabase for authentication, profiles, and optional backend data

## Project Structure

```text
index.html
src/
  App.tsx
  main.tsx
  styles.css
  components/
  hooks/
  integrations/
  lib/
  services/
  store/
  types/
package.json
vite.config.ts
```

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Live charging map, filters, recommendations, selected station panel |
| `/stations` | Station directory with richer filter options |
| `/booking` | Slot booking, queue, QR check-in, verification |
| `/payment` | UPI-style payment simulation and transaction ledger |
| `/payments` | Redirects to `/payment` for compatibility |
| `/rewards` | Driver coins, reward rules, redemption status |
| `/admin` | Operator dashboard and station list |
| `/login` | Login/signup with Supabase Auth and driver profile fields |

## Backend / Auth Setup

The client app is wired to Supabase and can run as a static site anywhere. It uses:

- Email/password sign up and login
- Google sign-in
- Driver profile storage
- Secure profile access rules so each user can only access their own profile
- Optional live queue, transaction, verification, and station tables when populated

Default public configuration is included in `src/services/supabaseClient.ts`. To override it per deployment, set:

```text
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## Local Development

```bash
bun install
bun dev
```

Open the local URL printed by Vite.

## Build

```bash
bun run build
```

The static build is written to:

```text
dist/
  index.html
  assets/
```

## Deployment

This app is a normal static Vite app. Deploy the `dist` output anywhere that can host static files.

### Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Framework preset: **Vite**.
4. Build command: `bun run build`.
5. Output directory: `dist`.
6. Deploy.

### Netlify

1. Push the repository to GitHub.
2. Import the project in Netlify.
3. Build command: `bun run build`.
4. Publish directory: `dist`.
5. Deploy.

### GitHub Pages

1. Build locally or in GitHub Actions:
   ```bash
   bun install
   bun run build
   ```
2. Publish the `dist` folder.
3. If hosting under a repository subpath, set the correct Vite base before building, for example:
   ```bash
   bunx vite build --base=/your-repo-name/
   ```

## Routing Notes

This is a pure client-side React Router app. Vercel and Netlify can serve it from `dist` as a static site. For direct refreshes on nested routes like `/stations` or `/payment`, configure your host to fallback to `index.html` if needed. GitHub Pages does not support fallback routing by default, so use the root URL first or add a standard Pages fallback workflow if deep-link refresh support is required.

## Production Notes

- Keep roles in a separate `user_roles` table before enabling real admin writes.
- Replace the simulated UPI QR with a verified payment provider when credentials are ready.
- Add real station owner workflows before letting operators modify station data.
- Connect QR scanner hardware or a camera scanner to call the existing check-in action.
- Add protected APIs for ESP32 start/stop charging commands if hardware integration is needed.
