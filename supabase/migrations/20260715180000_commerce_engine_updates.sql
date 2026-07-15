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
