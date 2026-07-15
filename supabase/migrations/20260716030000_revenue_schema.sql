-- 1. REVENUE LOGS
CREATE TABLE IF NOT EXISTS public.revenue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('commission', 'subscription', 'advertisement', 'featured_listing', 'payment_fee')),
  amount numeric(10,2) NOT NULL,
  source_id uuid, -- Can link to order_id, subscription_id, ad_id, etc.
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.revenue_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_logs_admin_select" ON public.revenue_logs FOR SELECT TO authenticated USING (public.is_admin());

-- 2. COMMISSION RULES
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  seller_plan_type text, -- Apply rule to specific seller plans
  percentage numeric(5,2) NOT NULL DEFAULT 5.00,
  fixed_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_commission_amount numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_rules_select" ON public.commission_rules FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "commission_rules_admin_all" ON public.commission_rules FOR ALL TO authenticated USING (public.is_admin());
