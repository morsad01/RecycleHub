-- 1. PLANS
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('free', 'basic', 'professional', 'business', 'enterprise')),
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  max_products int NOT NULL DEFAULT 10,
  featured_listings_count int NOT NULL DEFAULT 0,
  has_analytics boolean NOT NULL DEFAULT false,
  has_priority_support boolean NOT NULL DEFAULT false,
  ai_usage_limit int NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed basic plans
INSERT INTO public.plans (name, type, price_monthly, price_yearly, max_products, featured_listings_count, has_analytics, has_priority_support, ai_usage_limit)
VALUES 
  ('Free', 'free', 0, 0, 10, 0, false, false, 5),
  ('Basic', 'basic', 199, 1990, 50, 2, false, false, 20),
  ('Professional', 'professional', 499, 4990, 200, 5, true, false, 100),
  ('Business', 'business', 999, 9990, 1000, 15, true, true, 500),
  ('Enterprise', 'enterprise', 2499, 24990, -1, 50, true, true, 2000)
ON CONFLICT DO NOTHING;


-- 2. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- 3. FEATURED LISTINGS
CREATE TABLE IF NOT EXISTS public.featured_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('homepage', 'category', 'search')),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'pending_payment')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "featured_listings_select_all" ON public.featured_listings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "featured_listings_insert_own" ON public.featured_listings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- 4. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_discount_amount numeric(10,2),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  usage_limit int,
  usage_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_select_active" ON public.coupons FOR SELECT TO authenticated USING (is_active = true AND end_date > now());


-- 5. REFERRAL CODES
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  reward_amount numeric(10,2) NOT NULL DEFAULT 50,
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_codes_select_all" ON public.referral_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "referral_codes_insert_own" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- 6. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('flash_sale', 'seasonal', 'discount')),
  banner_image_url text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percentage numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, product_id)
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_select_active" ON public.campaigns FOR SELECT TO anon, authenticated USING (is_active = true);

ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_products_select_all" ON public.campaign_products FOR SELECT TO anon, authenticated USING (true);
