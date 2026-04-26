# Smart EV Charging Assistant Platform

A production-ready React + TypeScript SPA for EV charging station discovery, slot booking, realtime queue management, QR-style check-in, reliability verification, simulated UPI payments, rewards, and station-admin operations.

## Features

- Interactive Leaflet + OpenStreetMap station map with clustered markers
- Filters for charger type, availability, distance, price, and battery reachability
- Station detail panel with live queue states: `waiting`, `next`, `arrived`, `charging`, `completed`, `skipped`
- Queue join, QR check-in simulation, start charging, and final payment flow
- Reliability verification with cable condition and reward coins
- Battery-based station recommendations and backup station ranking
- Simulated UPI QR payment and transaction ledger
- Rewards system for verification, queue updates, and completed usage
- Admin dashboard for stations, slots, pricing, reliability, usage and revenue insights
- Supabase-ready service layer with local demo fallback when env vars are not configured

## Tech Stack

- React 19 + TypeScript
- Vite / TanStack Start frontend shell
- Tailwind CSS v4
- Zustand state management
- Leaflet, React Leaflet, OpenStreetMap tiles
- Supabase JS client for direct Auth, Postgres, Realtime and Storage integration

## Environment Variables

Create these variables in Vercel or Netlify project settings:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app runs with bundled demo data if these variables are absent, which helps with review and UI testing.

## Supabase Database Schema

Run this SQL in Supabase SQL Editor.

```sql
create table if not exists users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  coins integer not null default 0,
  vehicle_range_km integer not null default 220,
  created_at timestamptz not null default now()
);

create table if not exists stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  address text not null,
  city text not null,
  charger_type text not null check (charger_type in ('AC','DC','Fast DC')),
  total_slots integer not null check (total_slots > 0),
  available_slots integer not null default 0,
  price_per_kwh numeric(10,2) not null,
  status text not null check (status in ('open','busy','maintenance')),
  reliability_score integer not null default 80,
  last_verified text not null default 'not verified',
  distance_km numeric(8,2) not null default 0,
  amenities text[] not null default '{}',
  wait_minutes integer not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists chargers (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references stations(id) on delete cascade not null,
  status text not null check (status in ('available','occupied','offline')),
  type text not null check (type in ('AC','DC','Fast DC')),
  connector text not null,
  created_at timestamptz not null default now()
);

create table if not exists queue (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references stations(id) on delete cascade not null,
  user_id uuid not null,
  user_name text not null,
  position integer not null,
  status text not null check (status in ('waiting','next','arrived','charging','completed','skipped')),
  eta_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  station_id uuid references stations(id) on delete cascade not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  energy_used numeric(10,2) not null default 0,
  cost numeric(10,2) not null default 0,
  status text not null check (status in ('pending','active','completed','paid'))
);

create table if not exists reviews_verification (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references stations(id) on delete cascade not null,
  user_id uuid not null,
  status text not null check (status in ('working','not_working')),
  cable_condition text not null check (cable_condition in ('excellent','usable','damaged')),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(10,2) not null,
  method text not null default 'UPI',
  status text not null check (status in ('pending','success','failed')),
  created_at timestamptz not null default now()
);
```

### Realtime Setup

Enable Realtime for these tables in Supabase:

- `queue`
- `chargers`
- `sessions`
- `stations`

The frontend subscribes to queue changes by station ID.

### Storage Buckets

Create a public or policy-controlled bucket named:

```text
verification-proofs
```

Use it for station proof images and cable-condition uploads.

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

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `bun run build` or `npm run build`
5. Output directory: `dist`
6. Deploy.

## Deploy to Netlify

1. Push the repository to GitHub.
2. Import the project in Netlify.
3. Add the environment variables in Site configuration.
4. Build command: `bun run build` or `npm run build`
5. Publish directory: `dist`
6. Deploy.

## Notes for Future Integrations

- Replace simulated UPI QR with Razorpay/UPI intent APIs when payment credentials are ready.
- Connect QR scanner hardware or camera scanner to call the existing check-in action.
- ESP32 integration can call protected endpoints such as `/start-charging` and `/stop-charging` after API authentication is added.
- Add stricter RLS policies before production writes are opened to public users.
