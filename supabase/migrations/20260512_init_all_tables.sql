-- Complete EV Charging App Database Schema
-- This migration sets up all tables, indexes, RLS policies, and functions

-- ==================== ENUMS ====================
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('user', 'admin', 'operator', 'super_admin');

-- ==================== TABLES ====================

-- Profiles table (user accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'EV Driver',
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  vehicle_model TEXT DEFAULT 'Tata Nexon EV',
  preferred_connector TEXT DEFAULT 'CCS2',
  coins INTEGER NOT NULL DEFAULT 250,
  vehicle_range_km INTEGER NOT NULL DEFAULT 220,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  operator TEXT,
  charger_type TEXT NOT NULL DEFAULT 'AC',
  connector_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  total_slots INTEGER NOT NULL DEFAULT 1,
  available_slots INTEGER NOT NULL DEFAULT 1,
  price_per_kwh NUMERIC NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'open',
  reliability_score INTEGER NOT NULL DEFAULT 85,
  last_verified TEXT DEFAULT 'now',
  distance_km NUMERIC DEFAULT 0,
  amenities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  wait_minutes INTEGER DEFAULT 0,
  peak_hours TEXT,
  power_kw NUMERIC,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stations_city ON public.stations(city);
CREATE INDEX idx_stations_status ON public.stations(status);
CREATE INDEX idx_stations_active ON public.stations(active);

-- Chargers table
CREATE TABLE IF NOT EXISTS public.chargers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  connector TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  power_kw NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chargers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chargers_station ON public.chargers(station_id);

-- Queue table
CREATE TABLE IF NOT EXISTS public.queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  eta_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_queue_station ON public.queue(station_id);
CREATE INDEX idx_queue_user ON public.queue(user_id);

-- Reviews/Verification table
CREATE TABLE IF NOT EXISTS public.reviews_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  cable_condition TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews_verification ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reviews_station ON public.reviews_verification(station_id);

-- Charging Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  energy_used NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sessions_user ON public.sessions(user_id);
CREATE INDEX idx_sessions_station ON public.sessions(station_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL DEFAULT 'UPI',
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user ON public.transactions(user_id);

-- Station Reports table
CREATE TABLE IF NOT EXISTS public.station_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.station_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_station_reports_station ON public.station_reports(station_id, status);

-- User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Travel Plans table
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  origin_label TEXT NOT NULL,
  destination_label TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  duration_min NUMERIC NOT NULL DEFAULT 0,
  station_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_travel_plans_user ON public.travel_plans(user_id);

-- ==================== FUNCTIONS ====================

-- Helper function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

-- Function to create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile and role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-disable station after >= 5 open reports in last 24h
CREATE OR REPLACE FUNCTION public.auto_disable_on_reports()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM public.station_reports
   WHERE station_id = NEW.station_id AND status = 'open'
     AND created_at > now() - interval '24 hours';
  IF n >= 5 THEN
    UPDATE public.stations SET active = false, status = 'maintenance' WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for auto-disabling stations
DROP TRIGGER IF EXISTS trg_auto_disable_on_reports ON public.station_reports;
CREATE TRIGGER trg_auto_disable_on_reports
AFTER INSERT ON public.station_reports
FOR EACH ROW EXECUTE FUNCTION public.auto_disable_on_reports();

-- ==================== RLS POLICIES ====================

-- Profiles policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

-- Stations policies
DROP POLICY IF EXISTS "Stations are public readable" ON public.stations;
CREATE POLICY "Stations are public readable" ON public.stations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins insert stations" ON public.stations;
CREATE POLICY "Admins insert stations" ON public.stations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update stations" ON public.stations;
CREATE POLICY "Admins update stations" ON public.stations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete stations" ON public.stations;
CREATE POLICY "Admins delete stations" ON public.stations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Chargers policies
DROP POLICY IF EXISTS "Chargers are public readable" ON public.chargers;
CREATE POLICY "Chargers are public readable" ON public.chargers FOR SELECT TO anon, authenticated USING (true);

-- Queue policies
DROP POLICY IF EXISTS "Queue is public readable" ON public.queue;
CREATE POLICY "Queue is public readable" ON public.queue FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own queue entry" ON public.queue;
CREATE POLICY "Users insert own queue entry" ON public.queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own queue" ON public.queue;
CREATE POLICY "Users update own queue" ON public.queue FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own queue" ON public.queue;
CREATE POLICY "Users delete own queue" ON public.queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reviews/Verification policies
DROP POLICY IF EXISTS "Reviews are public readable" ON public.reviews_verification;
CREATE POLICY "Reviews are public readable" ON public.reviews_verification FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users submit verifications" ON public.reviews_verification;
CREATE POLICY "Users submit verifications" ON public.reviews_verification FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Sessions policies
DROP POLICY IF EXISTS "Users read own sessions" ON public.sessions;
CREATE POLICY "Users read own sessions" ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create sessions" ON public.sessions;
CREATE POLICY "Users create sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users read own transactions" ON public.transactions;
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create transactions" ON public.transactions;
CREATE POLICY "Users create transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Station Reports policies
DROP POLICY IF EXISTS "Reports are public readable" ON public.station_reports;
CREATE POLICY "Reports are public readable" ON public.station_reports FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can submit reports" ON public.station_reports;
CREATE POLICY "Users can submit reports" ON public.station_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update reports" ON public.station_reports;
CREATE POLICY "Admins update reports" ON public.station_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- User Roles policies
DROP POLICY IF EXISTS "Users read their roles" ON public.user_roles;
CREATE POLICY "Users read their roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Travel Plans policies
DROP POLICY IF EXISTS "Users read own plans" ON public.travel_plans;
CREATE POLICY "Users read own plans" ON public.travel_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own plans" ON public.travel_plans;
CREATE POLICY "Users create own plans" ON public.travel_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==================== REVOKE DANGEROUS PERMISSIONS ====================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_disable_on_reports() FROM PUBLIC, anon, authenticated;
