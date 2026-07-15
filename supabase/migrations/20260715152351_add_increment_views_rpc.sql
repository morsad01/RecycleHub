/*
# Add increment_product_views RPC function

## Summary
Creates a SECURITY DEFINER function that safely increments the views_count column on a product. This allows anon/authenticated users to increment views without needing UPDATE permission on the products table directly (which would allow editing other fields).

## Security
- SECURITY DEFINER: runs with the function owner's privileges
- Only increments views_count, no other fields can be modified
*/

CREATE OR REPLACE FUNCTION public.increment_product_views(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO anon, authenticated;
