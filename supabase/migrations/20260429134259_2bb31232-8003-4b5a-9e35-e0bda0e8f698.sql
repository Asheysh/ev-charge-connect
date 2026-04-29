CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  operator TEXT,
  charger_type TEXT NOT NULL,
  connector_types TEXT[] NOT NULL DEFAULT ARRAY['CCS2'],
  total_slots INTEGER NOT NULL DEFAULT 1,
  available_slots INTEGER NOT NULL DEFAULT 0,
  price_per_kwh NUMERIC(10,2) NOT NULL DEFAULT 18,
  status TEXT NOT NULL DEFAULT 'open',
  reliability_score INTEGER NOT NULL DEFAULT 80,
  last_verified TEXT NOT NULL DEFAULT 'not verified',
  distance_km NUMERIC(8,2) NOT NULL DEFAULT 0,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  wait_minutes INTEGER NOT NULL DEFAULT 0,
  peak_hours TEXT,
  power_kw INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chargers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available',
  type TEXT NOT NULL DEFAULT 'Fast DC',
  connector TEXT NOT NULL DEFAULT 'CCS2',
  power_kw INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  eta_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  energy_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.reviews_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  cable_condition TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'UPI',
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stations are public readable" ON public.stations;
CREATE POLICY "Stations are public readable" ON public.stations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Chargers are public readable" ON public.chargers;
CREATE POLICY "Chargers are public readable" ON public.chargers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Queue is public readable" ON public.queue;
CREATE POLICY "Queue is public readable" ON public.queue FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can join their own queue" ON public.queue;
CREATE POLICY "Users can join their own queue" ON public.queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their sessions" ON public.sessions;
CREATE POLICY "Users can read their sessions" ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their sessions" ON public.sessions;
CREATE POLICY "Users can create their sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Verification is public readable" ON public.reviews_verification;
CREATE POLICY "Verification is public readable" ON public.reviews_verification FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can submit verification" ON public.reviews_verification;
CREATE POLICY "Users can submit verification" ON public.reviews_verification FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their transactions" ON public.transactions;
CREATE POLICY "Users can read their transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their transactions" ON public.transactions;
CREATE POLICY "Users can create their transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_queue_station_status ON public.queue(station_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_station_id ON public.reviews_verification(station_id);