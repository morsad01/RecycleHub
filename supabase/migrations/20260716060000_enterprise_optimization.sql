-- =============================================================================
-- ENTERPRISE DB OPTIMIZATION MIGRATION
-- Adds advanced composite indexes, audit triggers, and constraint tuning.
-- =============================================================================

-- 1. ADVANCED COMPOSITE INDEXES
-- Optimize homepage queries (status + category + location)
CREATE INDEX IF NOT EXISTS idx_products_status_category ON public.products(status, category_id);
CREATE INDEX IF NOT EXISTS idx_products_status_division_district ON public.products(status, division, district);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON public.products(seller_id, status);

-- Optimize message queries (conversation + unread status)
CREATE INDEX IF NOT EXISTS idx_messages_convo_read ON public.messages(conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(buyer_id, seller_id);

-- Optimize orders (buyer + status / seller + status)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON public.orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON public.orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Optimize subscriptions (user + status + dates)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status_end ON public.subscriptions(user_id, status, current_period_end);

-- 2. ENHANCED CONSTRAINTS & CASCADING
-- Ensure products cannot have negative prices (if not already handled)
ALTER TABLE public.products ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0);

-- 3. AUDIT LOGGING SYSTEM (Table & Triggers)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create generic function to log critical row changes
CREATE OR REPLACE FUNCTION log_critical_action()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_logs(admin_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_logs(admin_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_logs(admin_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit trigger to critical tables (e.g., plans, subscriptions)
DROP TRIGGER IF EXISTS audit_plans_changes ON public.plans;
CREATE TRIGGER audit_plans_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION log_critical_action();

-- =============================================================================
-- End of Optimization Migration
-- =============================================================================
