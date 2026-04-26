# Smart EV Charging Assistant Platform

A portable, client-side React + Vite web app for EV charging station discovery, slot booking, queue management, QR-style check-in, external Supabase Auth, driver profiles, simulated UPI payments, rewards, and admin operations.

## What Changed

This project is now a standard static React application:

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
- External Supabase email/password Auth with a `profiles` table for driver data
- Queue join, QR check-in simulation, start charging, and final payment flow
- Reliability verification with cable condition and reward coins
- Battery-based station recommendations and backup station ranking
- Simulated UPI QR payment and transaction ledger
- Rewards system for verification, queue updates, and completed usage
- Admin dashboard for station health, slots, pricing, reliability, usage, and revenue insights
- Demo-data fallback when Supabase environment variables are not configured

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router DOM
- Tailwind CSS v4
- Zustand state management
- Leaflet, React Leaflet, OpenStreetMap tiles
- Supabase JS client for direct external Auth, Postgres, Realtime, and Storage integration

## Project Structure

```text
index.html
src/
  App.tsx
  main.tsx
  styles.css
  components/
  hooks/
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

## Environment Variables

Create these variables locally and in any host if you want live Supabase Auth/database access:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app still runs with bundled dummy data if these variables are absent.

## Supabase Setup

### 1. Enable Auth

In Supabase Dashboard:

1. Go to **Authentication → Providers**.
2. Enable **Email** provider.
3. Optional for easier testing: disable email confirmation while developing.
4. Add deployed URLs to **Authentication → URL Configuration**:
   - Vercel URL
   - Netlify URL
   - GitHub Pages URL
   - `http://localhost:5173`

### 2. Database Schema

Run this SQL in Supabase SQL Editor.

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  vehicle_model text,
  preferred_connector text not null default 'CCS2',
  coins integer not null default 250,
  vehicle_range_km integer not null default 220,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  address text not null,
  city text not null,
  operator text,
  charger_type text not null check (charger_type in ('AC','DC','Fast DC')),
  connector_types text[] not null default array['CCS2'],
  total_slots integer not null check (total_slots > 0),
  available_slots integer not null default 0,
  price_per_kwh numeric(10,2) not null,
  status text not null check (status in ('open','busy','maintenance')),
  reliability_score integer not null default 80,
  last_verified text not null default 'not verified',
  distance_km numeric(8,2) not null default 0,
  amenities text[] not null default '{}',
  wait_minutes integer not null default 0,
  peak_hours text,
  power_kw integer,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists chargers (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references stations(id) on delete cascade not null,
  status text not null check (status in ('available','occupied','offline')),
  type text not null check (type in ('AC','DC','Fast DC')),
  connector text not null,
  power_kw integer,
  created_at timestamptz not null default now()
);

create table if not exists queue (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references stations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text not null,
  position integer not null,
  status text not null check (status in ('waiting','next','arrived','charging','completed','skipped')),
  eta_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
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
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('working','not_working')),
  cable_condition text not null check (cable_condition in ('excellent','usable','damaged')),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  method text not null default 'UPI',
  status text not null check (status in ('pending','success','failed')),
  created_at timestamptz not null default now()
);
```

### 3. Profile Trigger

This creates a profile automatically when a user signs up.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

### 4. Row Level Security

Run these policies before production use.

```sql
alter table profiles enable row level security;
alter table stations enable row level security;
alter table chargers enable row level security;
alter table queue enable row level security;
alter table sessions enable row level security;
alter table reviews_verification enable row level security;
alter table transactions enable row level security;

create policy "Profiles are readable by owner"
on profiles for select
to authenticated
using (auth.uid() = id);

create policy "Profiles are updatable by owner"
on profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Stations are public readable"
on stations for select
to anon, authenticated
using (true);

create policy "Chargers are public readable"
on chargers for select
to anon, authenticated
using (true);

create policy "Queue is public readable"
on queue for select
to anon, authenticated
using (true);

create policy "Users can join their own queue"
on queue for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read their sessions"
on sessions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their sessions"
on sessions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can submit verification"
on reviews_verification for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Verification is public readable"
on reviews_verification for select
to anon, authenticated
using (true);

create policy "Users can create their transactions"
on transactions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read their transactions"
on transactions for select
to authenticated
using (auth.uid() = user_id);
```

### 5. Realtime Setup

Enable Realtime for these tables in Supabase:

- `queue`
- `chargers`
- `sessions`
- `stations`

The frontend subscribes to queue changes by station ID.

### 6. Storage Bucket

Create a bucket named:

```text
verification-proofs
```

Use it for station proof images and cable-condition uploads when you add real upload UI.

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

### Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add environment variables if using Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `bun run build`
5. Output directory: `dist`
6. Deploy.

### Netlify

1. Push the repository to GitHub.
2. Import the project in Netlify.
3. Add environment variables if using Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `bun run build`
5. Publish directory: `dist`
6. Deploy.

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

## Future Integrations

- Replace simulated UPI QR with Razorpay/UPI intent APIs when payment credentials are ready.
- Connect QR scanner hardware or camera scanner to call the existing check-in action.
- Add station owner roles in a separate `user_roles` table before enabling real admin writes.
- Add protected APIs for ESP32 start/stop charging commands if hardware integration is needed.
