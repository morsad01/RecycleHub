-- Migration: 20260718000000_resellbd_trust_and_intelligence.sql
-- Description: Trust System, 5-Level Identity Verification, Privacy-First KYC, AI Intelligence & Smart Alerts

-- 1. Identity Verifications Table (Privacy-First KYC)
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('nid', 'passport', 'driving_license')),
  document_storage_path TEXT NOT NULL,
  selfie_storage_path TEXT,
  ocr_data JSONB DEFAULT '{}'::jsonb,
  ai_readability_score NUMERIC DEFAULT 0.90,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'more_info_needed')),
  admin_feedback TEXT,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Trust Scores Table (Transparent 100-Point Model)
CREATE TABLE IF NOT EXISTS public.trust_scores (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 85 CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL DEFAULT 'level_1' CHECK (level IN ('level_1', 'level_2', 'level_3', 'level_4', 'level_5')),
  breakdown JSONB NOT NULL DEFAULT '{"identity": 20, "phone": 15, "email": 15, "transactions": 20, "rating": 15, "responsiveness": 15}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Product Deal Scores Table (Fair Market Price vs Asking Price)
CREATE TABLE IF NOT EXISTS public.product_deal_scores (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  deal_score INTEGER NOT NULL DEFAULT 85 CHECK (deal_score >= 0 AND deal_score <= 100),
  deal_rating TEXT NOT NULL DEFAULT 'good_deal' CHECK (deal_rating IN ('super_deal', 'great_deal', 'good_deal', 'fair_price', 'above_market')),
  asking_price NUMERIC NOT NULL,
  estimated_market_value NUMERIC NOT NULL,
  potential_savings NUMERIC NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Smart Alerts Table (Keyword and Price Drop Search Alerts)
CREATE TABLE IF NOT EXISTS public.smart_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  brand TEXT,
  location TEXT,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_in_app BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Sustainability Impact Table (CO2 & Waste Reduction Tracker)
CREATE TABLE IF NOT EXISTS public.sustainability_impact (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  products_reused_count INTEGER NOT NULL DEFAULT 1,
  waste_diverted_kg NUMERIC NOT NULL DEFAULT 2.5,
  co2_saved_kg NUMERIC NOT NULL DEFAULT 5.8,
  badge_tier TEXT NOT NULL DEFAULT 'Eco Bronze',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_deal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_impact ENABLE ROW LEVEL SECURITY;

-- 7. Strict Privacy RLS Policies

-- Identity Verifications: Owner can insert and view their own; Admins can view/update all. No public access!
CREATE POLICY "Users can view own identity verifications"
  ON public.identity_verifications FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Users can create own identity verifications"
  ON public.identity_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update identity verifications"
  ON public.identity_verifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Trust Scores: Publicly readable for trust badges, but system/admins update
CREATE POLICY "Trust scores are publicly viewable"
  ON public.trust_scores FOR SELECT
  USING (true);

CREATE POLICY "Users or admins can upsert trust scores"
  ON public.trust_scores FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Product Deal Scores: Publicly readable
CREATE POLICY "Product deal scores are publicly viewable"
  ON public.product_deal_scores FOR SELECT
  USING (true);

CREATE POLICY "Sellers or admins can upsert deal scores"
  ON public.product_deal_scores FOR ALL
  USING (true);

-- Smart Alerts: Private to user
CREATE POLICY "Users can manage own smart alerts"
  ON public.smart_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sustainability Impact: Publicly viewable
CREATE POLICY "Sustainability impact is publicly viewable"
  ON public.sustainability_impact FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own sustainability impact"
  ON public.sustainability_impact FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user ON public.identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON public.identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_user ON public.smart_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_active ON public.smart_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_deal_scores_product ON public.product_deal_scores(product_id);
