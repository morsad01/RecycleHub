-- =========================================================================
-- RESELLBD CONSOLIDATED SCHEMA INITIALIZATION SCRIPT
-- Run this script in the Supabase Dashboard SQL Editor to set up all tables, 
-- functions, storage buckets, RLS policies, and realtime subscriptions.
-- =========================================================================

-- =========================================================================
-- PART 1: CORE SCHEMA (Profiles, Categories, Products, Images, Wishlist)
-- =========================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_seller_verified boolean DEFAULT false,
  bio text,
  address text,
  city text,
  rating_avg numeric(2,1) DEFAULT 0,
  rating_count int DEFAULT 0,
  language_pref text DEFAULT 'en' CHECK (language_pref IN ('en','bn')),
  is_banned boolean DEFAULT false,
  cover_image_url text,
  business_name text,
  website text,
  facebook_url text,
  instagram_url text,
  business_hours text,
  response_time text DEFAULT 'within a few hours',
  response_rate text DEFAULT '100%',
  total_sales int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper function: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id),
  price numeric(10,2) NOT NULL,
  ai_suggested_price numeric(10,2),
  condition text CHECK (condition IN ('new','excellent','good','fair','poor')),
  ai_condition text,
  ai_category_confidence numeric(4,3),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','active','sold','rejected','flagged')),
  risk_score numeric(4,3) DEFAULT 0,
  is_flagged boolean DEFAULT false,
  location text,
  views_count int DEFAULT 0,
  brand text,
  original_price numeric(10,2),
  is_negotiable boolean DEFAULT false,
  stock_status text DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock')),
  stock_quantity int DEFAULT 1,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active" ON public.products FOR SELECT
  TO anon, authenticated USING (status = 'active' OR seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products FOR INSERT
  TO authenticated WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products FOR UPDATE
  TO authenticated USING (seller_id = auth.uid() OR public.is_admin()) WITH CHECK (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products FOR DELETE
  TO authenticated USING (seller_id = auth.uid() OR public.is_admin());

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select" ON public.product_images;
CREATE POLICY "product_images_select" ON public.product_images FOR SELECT
  TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
      AND (p.status = 'active' OR p.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "product_images_insert" ON public.product_images;
CREATE POLICY "product_images_insert" ON public.product_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
      AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "product_images_update" ON public.product_images;
CREATE POLICY "product_images_update" ON public.product_images FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
      AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "product_images_delete" ON public.product_images;
CREATE POLICY "product_images_delete" ON public.product_images FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
      AND (p.seller_id = auth.uid() OR public.is_admin())
    )
  );

-- WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
CREATE POLICY "wishlists_select_own" ON public.wishlists FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
CREATE POLICY "wishlists_insert_own" ON public.wishlists FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
CREATE POLICY "wishlists_delete_own" ON public.wishlists FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update updated_at on products
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- =========================================================================
-- PART 2: EXTENDED SCHEMA (Conversations, Messages, Addresses, Orders, etc.)
-- =========================================================================

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (buyer_id, seller_id, product_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants" ON public.conversations FOR SELECT
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "conversations_insert_participants" ON public.conversations;
CREATE POLICY "conversations_insert_participants" ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "conversations_update_participants" ON public.conversations;
CREATE POLICY "conversations_update_participants" ON public.conversations FOR UPDATE
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants" ON public.messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;
CREATE POLICY "messages_insert_participants" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_participants" ON public.messages;
CREATE POLICY "messages_update_participants" ON public.messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text,
  full_address text NOT NULL,
  city text,
  area text,
  phone text,
  is_default boolean DEFAULT false
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int DEFAULT 1,
  total_amount numeric(10,2) NOT NULL,
  delivery_charge numeric(10,2) DEFAULT 0,
  delivery_address_id uuid REFERENCES public.addresses(id),
  delivery_method text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
  payment_method text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_participants" ON public.orders;
CREATE POLICY "orders_select_participants" ON public.orders FOR SELECT
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
CREATE POLICY "orders_insert_buyer" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_participants" ON public.orders;
CREATE POLICY "orders_update_participants" ON public.orders FOR UPDATE
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (reviewer_id = auth.uid());

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_any" ON public.reports;
CREATE POLICY "reports_insert_any" ON public.reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
CREATE POLICY "reports_select_admin" ON public.reports FOR SELECT
  TO authenticated USING (reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SELLER VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  nid_number text,
  nid_image_url text,
  business_info text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  selfie_image_url text,
  license_image_url text,
  admin_feedback text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verifications_select_own_or_admin" ON public.seller_verifications;
CREATE POLICY "verifications_select_own_or_admin" ON public.seller_verifications FOR SELECT
  TO authenticated USING (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "verifications_insert_own" ON public.seller_verifications;
CREATE POLICY "verifications_insert_own" ON public.seller_verifications FOR INSERT
  TO authenticated WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "verifications_update_admin" ON public.seller_verifications;
CREATE POLICY "verifications_update_admin" ON public.seller_verifications FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CHATBOT MESSAGES
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role text CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_select_own" ON public.chatbot_messages;
CREATE POLICY "chatbot_select_own" ON public.chatbot_messages FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chatbot_insert_own" ON public.chatbot_messages;
CREATE POLICY "chatbot_insert_own" ON public.chatbot_messages FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- PLATFORM CONTENT
CREATE TABLE IF NOT EXISTS public.platform_content (
  key text PRIMARY KEY,
  content text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.platform_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_content_select_all" ON public.platform_content;
CREATE POLICY "platform_content_select_all" ON public.platform_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "platform_content_update_admin" ON public.platform_content;
CREATE POLICY "platform_content_update_admin" ON public.platform_content FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "platform_content_insert_admin" ON public.platform_content;
CREATE POLICY "platform_content_insert_admin" ON public.platform_content FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);

-- Trigger: update orders.updated_at
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: update platform_content.updated_at
CREATE OR REPLACE FUNCTION public.update_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_content_updated_at ON public.platform_content;
CREATE TRIGGER platform_content_updated_at
  BEFORE UPDATE ON public.platform_content
  FOR EACH ROW EXECUTE FUNCTION public.update_content_updated_at();


-- =========================================================================
-- PART 3: VIEWS RPC FUNCTION
-- =========================================================================

CREATE OR REPLACE FUNCTION public.increment_product_views(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_seller_sales(amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET total_sales = total_sales + 1
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_seller_sales(numeric) TO authenticated;


-- =========================================================================
-- PART 4: ADDITIONAL SCHEMA (Cart, Payments, Delivery Tracking, AI analyses, etc.)
-- =========================================================================

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
-- Setup standard Storage Buckets
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

-- Create public.ai_logs table to track AI usage & statistics
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  feature_name text NOT NULL,
  confidence_score numeric(4,3),
  was_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_logs_select_own_or_admin" ON public.ai_logs;
CREATE POLICY "ai_logs_select_own_or_admin" ON public.ai_logs FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "ai_logs_insert_own" ON public.ai_logs;
CREATE POLICY "ai_logs_insert_own" ON public.ai_logs FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

-- Fix notifications insert policy to allow other users to insert notifications (e.g. buyer notifying seller)
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_authenticated" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (true);

-- Add reply_to_message_id, image_url, is_deleted, is_reported to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_reported boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS report_reason text;

-- Add conversation customization fields to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_pinned_buyer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pinned_seller boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived_buyer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived_seller boolean DEFAULT false;

-- Add transaction logs table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  provider text NOT NULL,
  transaction_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
