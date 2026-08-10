-- =============================================================================
-- ENTERPRISE RBAC & SUPER ADMIN ARCHITECTURE
-- Implements Normalized Role-Based Access Control and Database-level Audit Logging
-- =============================================================================

-- 1. NORMALIZED RBAC TABLES

-- App Permissions (Granular capabilities)
CREATE TABLE IF NOT EXISTS public.app_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE, -- e.g., 'manage_users', 'manage_payments'
    description text,
    created_at timestamptz DEFAULT now()
);

-- App Roles (e.g., 'super_admin', 'admin', 'moderator', 'support')
CREATE TABLE IF NOT EXISTS public.app_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Role Permissions Junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid REFERENCES public.app_roles(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES public.app_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id uuid REFERENCES public.app_roles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- 2. ENTERPRISE TABLES

CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
    name text PRIMARY KEY,
    is_enabled boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Audit Logs (Database-level tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid, -- Can be null for system actions
    action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name text NOT NULL,
    record_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- 3. HIGH-PERFORMANCE RLS RPC FUNCTION
-- Checks if the current user has a specific permission via user_roles -> role_permissions
CREATE OR REPLACE FUNCTION has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.app_permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() 
      AND p.name = permission_name
  );
$$;

-- Checks if user is exactly super admin (fallback)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.app_roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
  );
$$;


-- 4. POSTGRES TRIGGERS FOR AUDIT LOGGING
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_old_data jsonb := null;
  v_new_data jsonb := null;
  v_record_id text;
BEGIN
  v_user_id := auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id::text;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id::text;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (v_user_id, TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Audit Triggers to Critical Tables
DROP TRIGGER IF EXISTS audit_system_settings ON public.system_settings;
CREATE TRIGGER audit_system_settings
AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_feature_flags ON public.feature_flags;
CREATE TRIGGER audit_feature_flags
AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_audit_event();


-- 5. SEEDING INITIAL ROLES AND PERMISSIONS
INSERT INTO public.app_permissions (name, description) VALUES
('manage_system', 'Highest privilege, modify system settings and feature flags'),
('manage_admins', 'Create, update, delete other admin accounts'),
('manage_roles', 'Modify role assignments and permissions'),
('manage_users', 'Moderate standard user accounts'),
('manage_products', 'Moderate listings'),
('manage_payments', 'View and handle financial transactions'),
('manage_ai', 'Configure AI thresholds and usage limits'),
('view_audit_logs', 'Access system security and audit logs')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.app_roles (name, description) VALUES
('super_admin', 'God mode. Has all permissions.'),
('admin', 'General administrator.'),
('moderator', 'Can manage products and users.'),
('support', 'Can view orders and assist users.')
ON CONFLICT (name) DO NOTHING;

-- Seed Super Admin permissions
DO $$
DECLARE
  v_super_admin_id uuid;
  v_perm record;
BEGIN
  SELECT id INTO v_super_admin_id FROM public.app_roles WHERE name = 'super_admin';
  FOR v_perm IN SELECT id FROM public.app_permissions LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_super_admin_id, v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 6. STRICT RLS POLICIES FOR NEW TABLES

ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions/roles
CREATE POLICY "Public read permissions" ON public.app_permissions FOR SELECT USING (true);
CREATE POLICY "Public read roles" ON public.app_roles FOR SELECT USING (true);
CREATE POLICY "Users can read user_roles" ON public.user_roles FOR SELECT USING (true);

-- System management policies
CREATE POLICY "Manage system settings" ON public.system_settings
FOR ALL USING (has_permission('manage_system'));

CREATE POLICY "Read system settings" ON public.system_settings
FOR SELECT USING (true);

CREATE POLICY "Manage feature flags" ON public.feature_flags
FOR ALL USING (has_permission('manage_system'));

CREATE POLICY "Read feature flags" ON public.feature_flags
FOR SELECT USING (true);

CREATE POLICY "View audit logs" ON public.audit_logs
FOR SELECT USING (has_permission('view_audit_logs'));

CREATE POLICY "Manage user roles" ON public.user_roles
FOR ALL USING (has_permission('manage_roles'));
