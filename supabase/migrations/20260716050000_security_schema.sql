-- 1. LOGIN HISTORY
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  device_type text,
  location text,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_history_select_own" ON public.login_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "login_history_insert" ON public.login_history FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 2. USER SESSIONS (For explicit session management)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  device_info text,
  ip_address text,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sessions_select_own" ON public.user_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_sessions_delete_own" ON public.user_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. TWO FACTOR AUTH
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret text NOT NULL,
  is_enabled boolean DEFAULT false,
  recovery_codes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "two_factor_auth_select_own" ON public.two_factor_auth FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "two_factor_auth_update_own" ON public.two_factor_auth FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "two_factor_auth_insert_own" ON public.two_factor_auth FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
