-- Add BD hierarchical location fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS division text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS upazila text,
ADD COLUMN IF NOT EXISTS area text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8);

-- Add BD hierarchical location fields to addresses
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS division text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS upazila text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS latitude numeric(10,8),
ADD COLUMN IF NOT EXISTS longitude numeric(11,8);

-- Add indexes for fast geospatial and hierarchical queries
CREATE INDEX IF NOT EXISTS idx_products_division ON public.products(division);
CREATE INDEX IF NOT EXISTS idx_products_district ON public.products(district);
CREATE INDEX IF NOT EXISTS idx_products_upazila ON public.products(upazila);
CREATE INDEX IF NOT EXISTS idx_products_location_coords ON public.products(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_addresses_division ON public.addresses(division);
CREATE INDEX IF NOT EXISTS idx_addresses_district ON public.addresses(district);
