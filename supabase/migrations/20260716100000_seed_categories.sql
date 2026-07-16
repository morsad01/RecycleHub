-- Initial Categories Seed Data

-- Insert Parent Categories
INSERT INTO public.categories (name, slug, icon, parent_id) VALUES
('Electronics', 'electronics', 'monitor', NULL),
('Furniture', 'furniture', 'sofa', NULL),
('Vehicles', 'vehicles', 'car', NULL),
('Clothing', 'clothing', 'shirt', NULL),
('Books & Education', 'books', 'book', NULL),
('Home & Garden', 'home', 'home', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories
INSERT INTO public.categories (name, slug, icon, parent_id) VALUES
('Smartphones', 'smartphones', 'smartphone', (SELECT id FROM public.categories WHERE slug = 'electronics')),
('Laptops', 'laptops', 'laptop', (SELECT id FROM public.categories WHERE slug = 'electronics')),
('Accessories', 'electronics-accessories', 'headphones', (SELECT id FROM public.categories WHERE slug = 'electronics')),

('Chairs', 'chairs', 'armchair', (SELECT id FROM public.categories WHERE slug = 'furniture')),
('Tables', 'tables', 'table', (SELECT id FROM public.categories WHERE slug = 'furniture')),
('Beds', 'beds', 'bed', (SELECT id FROM public.categories WHERE slug = 'furniture')),

('Bicycles', 'bicycles', 'bike', (SELECT id FROM public.categories WHERE slug = 'vehicles')),
('Motorcycles', 'motorcycles', 'motorcycle', (SELECT id FROM public.categories WHERE slug = 'vehicles')),

('Mens Fashion', 'mens-fashion', 'user', (SELECT id FROM public.categories WHERE slug = 'clothing')),
('Womens Fashion', 'womens-fashion', 'users', (SELECT id FROM public.categories WHERE slug = 'clothing')),

('Textbooks', 'textbooks', 'book-open', (SELECT id FROM public.categories WHERE slug = 'books')),
('Fiction', 'fiction', 'book', (SELECT id FROM public.categories WHERE slug = 'books')),

('Tools', 'tools', 'pen-tool', (SELECT id FROM public.categories WHERE slug = 'home')),
('Plants', 'plants', 'leaf', (SELECT id FROM public.categories WHERE slug = 'home'))
ON CONFLICT (slug) DO NOTHING;
