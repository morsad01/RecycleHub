-- =============================================================================
-- HEALTH & MONITORING RPC ENDPOINTS
-- Exposes functions that external monitoring tools (Datadog, UptimeRobot) can use.
-- =============================================================================

-- 1. Basic DB Health Check
-- Returns a simple JSON status of the database time and basic connectivity.
CREATE OR REPLACE FUNCTION db_health_check()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    active_connections int;
BEGIN
    SELECT count(*) INTO active_connections FROM pg_stat_activity;
    
    result := json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'active_connections', active_connections,
        'version', version()
    )::jsonb;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. API Health Check
-- Checks connectivity to critical tables
CREATE OR REPLACE FUNCTION api_health_check()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    user_count int;
    product_count int;
BEGIN
    SELECT count(id) INTO user_count FROM auth.users;
    SELECT count(id) INTO product_count FROM public.products;
    
    result := json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'users_available', user_count >= 0,
        'products_available', product_count >= 0
    )::jsonb;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anonymous access to health checks for external uptime monitors
-- NOTE: In a strict environment, you might require a specific header or API key.
REVOKE EXECUTE ON FUNCTION db_health_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION db_health_check() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION api_health_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api_health_check() TO anon, authenticated;
