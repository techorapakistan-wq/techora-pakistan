-- Insert or update CHOICE Electric Coffee Mug Warmer Set in Supabase
insert into public.products (
  id,
  name,
  category,
  description,
  price,
  discount,
  stock,
  image_url,
  gallery,
  colors,
  is_active
) values (
  'e8b23c91-4475-4d78-b198-5c4d0a1b2e3f',
  'CHOICE Electric Coffee Mug & Desk Warmer Set',
  'Smart Gadgets',
  'CHOICE Coffee Mug-Warmer, Electric Coffee Cup Warmer for Desk with automatic on/off to keep temperature up to 104-122°F / 40-50°C. Includes matching Ceramic Mug, Cover, and Gold Spoon to enjoy hot drinks anytime. 5 Days Warranty • Return within 5 days with refund • WhatsApp order 0322-9701332.',
  2800.00,
  0.00,
  25,
  '/products/mug-warmer/mug-1.png',
  '[
    "/products/mug-warmer/mug-1.png",
    "/products/mug-warmer/mug-2.png",
    "/products/mug-warmer/mug-3.png",
    "/products/mug-warmer/mug-4.png"
  ]'::jsonb,
  '[
    {"name": "Emerald Green", "hex": "#1b4332", "image": "/products/mug-warmer/mug-1.png"},
    {"name": "Pastel Pink", "hex": "#f4b6c2", "image": "/products/mug-warmer/mug-4.png"},
    {"name": "Classic White", "hex": "#f8fafc", "image": "/products/mug-warmer/mug-2.png"},
    {"name": "Random Assorted", "hex": "#334155", "image": "/products/mug-warmer/mug-2.png"}
  ]'::jsonb,
  true
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price = excluded.price,
  discount = excluded.discount,
  stock = excluded.stock,
  image_url = excluded.image_url,
  gallery = excluded.gallery,
  colors = excluded.colors,
  is_active = excluded.is_active;
