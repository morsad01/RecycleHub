-- Add marketplace fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS original_price numeric(10,2),
ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_status text DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock')),
ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb;
