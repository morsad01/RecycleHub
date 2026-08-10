-- 1. CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_items_select_own" ON public.cart_items;
CREATE POLICY "cart_items_select_own" ON public.cart_items FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_insert_own" ON public.cart_items;
CREATE POLICY "cart_items_insert_own" ON public.cart_items FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_update_own" ON public.cart_items;
CREATE POLICY "cart_items_update_own" ON public.cart_items FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_delete_own" ON public.cart_items;
CREATE POLICY "cart_items_delete_own" ON public.cart_items FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);


-- 2. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.buyer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);


-- 3. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT
  TO authenticated USING (
    buyer_id = auth.uid() OR 
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
      AND o.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_payments_buyer ON public.payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);


-- 4. DELIVERY TRACKING
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  courier_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed')),
  details text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_tracking_select" ON public.delivery_tracking;
CREATE POLICY "delivery_tracking_select" ON public.delivery_tracking FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_tracking.order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "delivery_tracking_write" ON public.delivery_tracking;
CREATE POLICY "delivery_tracking_write" ON public.delivery_tracking FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_tracking.order_id
      AND (o.seller_id = auth.uid() OR public.is_admin())
    )
  );

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON public.delivery_tracking(order_id);


-- 5. ADMIN LOGS
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logs_admin_select" ON public.admin_logs;
CREATE POLICY "admin_logs_admin_select" ON public.admin_logs FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_logs_admin_insert" ON public.admin_logs;
CREATE POLICY "admin_logs_admin_insert" ON public.admin_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());


-- 6. ANALYTICS
CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  dimension text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_admin_select" ON public.analytics;
CREATE POLICY "analytics_admin_select" ON public.analytics FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "analytics_admin_write" ON public.analytics;
CREATE POLICY "analytics_admin_write" ON public.analytics FOR ALL
  TO authenticated USING (public.is_admin());


-- 7. SEARCH LOGS
CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  query text NOT NULL,
  filters jsonb,
  results_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_logs_select" ON public.search_logs;
CREATE POLICY "search_logs_select" ON public.search_logs FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "search_logs_insert" ON public.search_logs;
CREATE POLICY "search_logs_insert" ON public.search_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);


-- 8. PRODUCT VIEWS
CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_views_select" ON public.product_views;
CREATE POLICY "product_views_select" ON public.product_views FOR SELECT
  TO authenticated USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_views.product_id
      AND p.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_views_insert" ON public.product_views;
CREATE POLICY "product_views_insert" ON public.product_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON public.product_views(product_id);


-- 9. AI ANALYSES
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  suggested_category text,
  condition_estimate text,
  confidence numeric(4,3),
  risk_score numeric(4,3),
  risk_reasons text[],
  raw_response jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_analyses_select" ON public.ai_analyses;
CREATE POLICY "ai_analyses_select" ON public.ai_analyses FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR 
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = ai_analyses.product_id
      AND p.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_analyses_insert" ON public.ai_analyses;
CREATE POLICY "ai_analyses_insert" ON public.ai_analyses FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ai_analyses_product ON public.ai_analyses(product_id);


-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_payments_updated_at();

CREATE OR REPLACE FUNCTION public.update_delivery_tracking_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_tracking_updated_at ON public.delivery_tracking;
CREATE TRIGGER delivery_tracking_updated_at
  BEFORE UPDATE ON public.delivery_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_delivery_tracking_updated_at();


-- 10. STORAGE BUCKETS & SECURITY POLICIES
-- Supabase Storage is configured in the storage schema. We populate the buckets table.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('verification-documents', 'verification-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/pdf']),
  ('chat-images', 'chat-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('product-images', 'avatars', 'chat-images'));

DROP POLICY IF EXISTS "Verification Docs Read Access" ON storage.objects;
CREATE POLICY "Verification Docs Read Access" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'verification-documents' AND (owner = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "Owner Insert Access" ON storage.objects;
CREATE POLICY "Owner Insert Access" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
CREATE POLICY "Owner Update Access" ON storage.objects FOR UPDATE
  TO authenticated
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
CREATE POLICY "Owner Delete Access" ON storage.objects FOR DELETE
  TO authenticated
  USING (owner = auth.uid());


-- 11. REALTIME ENABLING
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Messages Realtime
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_publication p ON pr.prpubid = p.oid 
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Notifications Realtime
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_publication p ON pr.prpubid = p.oid 
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Orders Realtime
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_publication p ON pr.prpubid = p.oid 
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    -- Delivery Tracking Realtime
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_publication p ON pr.prpubid = p.oid 
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'delivery_tracking'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
    END IF;
  END IF;
END $$;
