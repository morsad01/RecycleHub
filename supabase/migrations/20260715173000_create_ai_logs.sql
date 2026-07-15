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
