-- Stations: active flag
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- is_super_admin helper
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;

-- Allow super_admin to manage user_roles
DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- station_reports
CREATE TABLE IF NOT EXISTS public.station_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.station_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reports are public readable" ON public.station_reports;
CREATE POLICY "Reports are public readable" ON public.station_reports
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can submit reports" ON public.station_reports;
CREATE POLICY "Users can submit reports" ON public.station_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update reports" ON public.station_reports;
CREATE POLICY "Admins update reports" ON public.station_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_station_reports_station ON public.station_reports(station_id, status);

-- Auto-disable station after >= 5 open reports in last 24h
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
REVOKE EXECUTE ON FUNCTION public.auto_disable_on_reports() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_auto_disable_on_reports ON public.station_reports;
CREATE TRIGGER trg_auto_disable_on_reports
AFTER INSERT ON public.station_reports
FOR EACH ROW EXECUTE FUNCTION public.auto_disable_on_reports();