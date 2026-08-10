/*
# ResellBD — Core Schema (Profiles, Categories, Products, Images, Wishlist)

## Summary
Creates the foundational tables for the ResellBD marketplace:
- `profiles` — extends auth.users with full name, role, seller verification, rating, language pref, ban status.
- `categories` — hierarchical product categories (self-referencing parent_id).
- `products` — seller listings with AI fields (suggested price, condition, category confidence, risk score), status workflow.
- `product_images` — multiple images per product with primary flag and sort order.
- `wishlists` — user-product save pairs (unique per user+product).

## Tables
1. `profiles` — id (uuid, PK, FK to auth.users), full_name, phone, avatar_url, role ('user'|'admin'), is_seller_verified, bio, address, city, rating_avg, rating_count, language_pref ('en'|'bn'), is_banned, created_at.
2. `categories` — id (uuid PK), name, slug (unique), icon, parent_id (self FK), created_at.
3. `products` — id (uuid PK), seller_id (FK profiles), title, description, category_id (FK), price, ai_suggested_price, condition, ai_condition, ai_category_confidence, status, risk_score, is_flagged, location, views_count, created_at, updated_at.
4. `product_images` — id (uuid PK), product_id (FK products cascade), url, is_primary, sort_order.
5. `wishlists` — id (uuid PK), user_id (FK profiles cascade), product_id (FK products cascade), created_at, unique(user_id, product_id).

## Security (RLS)
- `profiles`: anyone can SELECT; only owner can UPDATE own row.
- `categories`: anyone can SELECT; only admin can INSERT/UPDATE/DELETE.
- `products`: anyone can SELECT active products; sellers can CRUD their own; admins can do everything.
- `product_images`: anyone can SELECT images of active products; sellers can CRUD images of their own products; admins full access.
- `wishlists`: only owner can SELECT/INSERT/DELETE their wishlist entries.

## Helper
- `is_admin()` SQL function: checks if current user's profile role is 'admin'.
*/

-- PROFILES (must come first so is_admin() can reference it)
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
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper function: is_admin() — must come after profiles table
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

-- Indexes
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
