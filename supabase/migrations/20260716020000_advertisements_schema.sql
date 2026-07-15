-- 1. ADVERTISEMENTS
CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_url text NOT NULL,
  image_url text NOT NULL,
  type text NOT NULL CHECK (type IN ('homepage_banner', 'sidebar', 'category_banner', 'popup')),
  position int DEFAULT 0,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'scheduled')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  budget numeric(10,2),
  spend numeric(10,2) DEFAULT 0,
  impressions_limit int,
  clicks_limit int,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_select_active" ON public.advertisements FOR SELECT TO anon, authenticated USING (status = 'active' AND start_date <= now() AND end_date >= now());
CREATE POLICY "ads_admin_all" ON public.advertisements FOR ALL TO authenticated USING (public.is_admin());

-- 2. AD IMPRESSIONS & CLICKS LOGS
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_impressions_insert" ON public.ad_impressions FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_clicks_insert" ON public.ad_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
