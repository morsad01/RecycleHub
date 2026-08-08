/*
# ResellBD — Extended Schema (Messaging, Orders, Reviews, Reports, Notifications, Verifications, Chatbot, Content)

## Summary
Creates the remaining tables for ResellBD:
- `conversations` — buyer-seller chat threads scoped to a product.
- `messages` — individual chat messages with read tracking.
- `addresses` — user delivery address book with default flag.
- `orders` — buyer-seller orders with status workflow and payment tracking.
- `reviews` — ratings (1-5) and comments between users after delivery.
- `reports` — trust & safety reports for users/products.
- `notifications` — in-app notification center.
- `seller_verifications` — NID/business verification submissions for admin review.
- `chatbot_messages` — AI support chatbot conversation history.
- `platform_content` — admin-editable static content (privacy policy, terms, safety guidelines).

## Tables
1. `conversations` — buyer_id, seller_id, product_id, last_message_at, unique(buyer_id, seller_id, product_id).
2. `messages` — conversation_id, sender_id, content, is_read.
3. `addresses` — user_id, label, full_address, city, area, phone, is_default.
4. `orders` — buyer_id, seller_id, product_id, quantity, total_amount, delivery_charge, delivery_address_id, delivery_method, status, payment_status, payment_method, tracking_number.
5. `reviews` — order_id, reviewer_id, reviewee_id, product_id, rating (1-5), comment.
6. `reports` — reporter_id, reported_user_id, reported_product_id, reason, description, status.
7. `notifications` — user_id, title, message, type, is_read.
8. `seller_verifications` — seller_id, nid_number, nid_image_url, business_info, status, reviewed_by.
9. `chatbot_messages` — user_id, role ('user'|'assistant'), content.
10. `platform_content` — key (PK), content, updated_at.

## Security (RLS)
- `conversations`/`messages`: visible only to buyer_id/seller_id/sender_id participants.
- `addresses`: only owner can SELECT/INSERT/UPDATE/DELETE.
- `orders`: visible to buyer_id, seller_id, or admin; buyer can insert; seller can update status.
- `reviews`: anyone can SELECT; only reviewer can INSERT.
- `reports`: any authenticated user can INSERT; only admin can SELECT/UPDATE.
- `seller_verifications`: seller can SELECT/INSERT own; admin can SELECT/UPDATE all.
- `notifications`: only owner can SELECT/UPDATE.
- `chatbot_messages`: only owner can SELECT/INSERT.
- `platform_content`: anyone can SELECT; only admin can UPDATE.
*/

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

-- Indexes
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
