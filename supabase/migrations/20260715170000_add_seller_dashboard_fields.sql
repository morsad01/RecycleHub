-- Extend public.profiles table for Seller Central
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS business_hours text,
ADD COLUMN IF NOT EXISTS response_time text DEFAULT 'within a few hours',
ADD COLUMN IF NOT EXISTS response_rate text DEFAULT '100%',
ADD COLUMN IF NOT EXISTS total_sales int DEFAULT 0;

-- Extend public.seller_verifications table for Selfie/License docs & Admin feedback
ALTER TABLE public.seller_verifications
ADD COLUMN IF NOT EXISTS selfie_image_url text,
ADD COLUMN IF NOT EXISTS license_image_url text,
ADD COLUMN IF NOT EXISTS admin_feedback text;

-- RPC function to increment seller sales counter
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

-- Add stock_quantity to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity int DEFAULT 1;
