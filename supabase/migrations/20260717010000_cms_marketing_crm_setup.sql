-- =============================================================================
-- ResellBD — Enterprise CMS, CRM and Marketing Schema
-- =============================================================================

-- 1. HOMEPAGE SECTIONS BUILDER
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. SCHEDULABLE ADVERTISING BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('homepage', 'sidebar', 'popup', 'category', 'offer', 'flash_sale')),
  image_url text NOT NULL,
  link_url text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. BROADCAST ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('notice', 'maintenance', 'security', 'promo')),
  target text NOT NULL CHECK (target IN ('everyone', 'buyers', 'sellers', 'admins')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. BLOGS & EDITORIAL POSTS
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  featured_image_url text,
  tags text[] DEFAULT '{}'::text[],
  category text,
  seo_title text,
  seo_description text,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. NEWSLETTER DIRECTORY
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 6. REFERRAL LEADS & CONVERSIONS
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  reward_amount numeric(10,2) NOT NULL DEFAULT 50.00,
  status text NOT NULL CHECK (status IN ('invited', 'registered', 'rewarded')) DEFAULT 'invited',
  created_at timestamptz DEFAULT now()
);

-- 7. SEO METADATA & OPEN GRAPH MAPS
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  keywords text,
  canonical_url text,
  og_image text,
  twitter_card text NOT NULL DEFAULT 'summary_large_image',
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- RLS ENABLEMENT & SECURITY POLICIES
-- =============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- 1. homepage_sections Policies
CREATE POLICY "homepage_sections_select" ON public.homepage_sections FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "homepage_sections_write" ON public.homepage_sections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. banners Policies
CREATE POLICY "banners_select" ON public.banners FOR SELECT USING (is_active = true AND now() BETWEEN start_date AND end_date OR public.is_admin());
CREATE POLICY "banners_write" ON public.banners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. announcements Policies
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "announcements_write" ON public.announcements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. blog_posts Policies
CREATE POLICY "blog_posts_select" ON public.blog_posts FOR SELECT USING (status = 'published' AND (published_at IS NULL OR published_at <= now()) OR public.is_admin());
CREATE POLICY "blog_posts_write" ON public.blog_posts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. newsletter_subscribers Policies
CREATE POLICY "newsletter_subscribers_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "newsletter_subscribers_admin" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. referrals Policies
CREATE POLICY "referrals_select" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR public.is_admin());
CREATE POLICY "referrals_write" ON public.referrals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. seo_metadata Policies
CREATE POLICY "seo_metadata_select" ON public.seo_metadata FOR SELECT USING (true);
CREATE POLICY "seo_metadata_write" ON public.seo_metadata FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- AUDIT LOGGING TRIGGERS
-- =============================================================================

CREATE TRIGGER audit_homepage_sections AFTER INSERT OR UPDATE OR DELETE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_banners AFTER INSERT OR UPDATE OR DELETE ON public.banners FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_announcements AFTER INSERT OR UPDATE OR DELETE ON public.announcements FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_blog_posts AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_newsletter_subscribers AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_referrals AFTER INSERT OR UPDATE OR DELETE ON public.referrals FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_seo_metadata AFTER INSERT OR UPDATE OR DELETE ON public.seo_metadata FOR EACH ROW EXECUTE FUNCTION log_audit_event();
