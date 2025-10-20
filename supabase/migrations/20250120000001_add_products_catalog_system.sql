-- Products Catalog System Migration
-- Streamlined schema with shared categories and optimized search

-- 1) reference categories (shared by businesses & products)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 2) businesses (already exists; extend if needed)
alter table businesses
  add column if not exists owner_id uuid references auth.users(id),
  add column if not exists is_verified boolean default false,
  add column if not exists created_at timestamp with time zone default now(),
  add column if not exists updated_at timestamp with time zone default now();

create index if not exists idx_businesses_owner on businesses(owner_id);
create index if not exists idx_businesses_status on businesses(status);
create index if not exists idx_businesses_updated_at on businesses(updated_at);

-- 3) N:M business<->categories
create table if not exists business_categories (
  business_id uuid references businesses(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (business_id, category_id)
);

-- 4) products (per business)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price_cents integer not null default 0,            -- store as integer cents
  currency text not null default 'SCR',
  is_active boolean not null default true,
  stock integer,                                     -- optional inventory
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists uq_products_business_slug on products(business_id, slug);
create index if not exists idx_products_business on products(business_id);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_products_updated on products(updated_at);

-- 5) product categories (N:M)
create table if not exists product_categories (
  product_id uuid references products(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- 6) product images (multiple images, orderable)
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,              -- e.g. product-images/{productId}/filename.jpg
  alt text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_product_images_sort on product_images(product_id, sort_order);

-- 7) Full-text search: add TSVECTOR fields & triggers to businesses and products
alter table businesses add column if not exists search_vector tsvector;
create index if not exists idx_businesses_search on businesses using gin(search_vector);

alter table products add column if not exists search_vector tsvector;
create index if not exists idx_products_search on products using gin(search_vector);

create or replace function businesses_tsvector_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.category_text,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'C');
  return new;
end;
$$ language plpgsql;

create or replace function products_tsvector_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'B');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_businesses_tsv on businesses;
create trigger trg_businesses_tsv
  before insert or update on businesses
  for each row execute function businesses_tsvector_trigger();

drop trigger if exists trg_products_tsv on products;
create trigger trg_products_tsv
  before insert or update on products
  for each row execute function products_tsvector_trigger();

-- RLS Policies

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Business categories policies
CREATE POLICY "Anyone can view business categories" ON business_categories FOR SELECT USING (true);
CREATE POLICY "Business owners can manage their business categories" ON business_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM businesses b
        JOIN profiles p ON p.id = b.owner_id
        WHERE b.id = business_categories.business_id
        AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage business categories" ON business_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM businesses b
        JOIN profiles p ON p.id = b.owner_id
        WHERE b.id = products.business_id
        AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Product categories policies
CREATE POLICY "Anyone can view product categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Business owners can manage their product categories" ON product_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM products pr
        JOIN businesses b ON b.id = pr.business_id
        JOIN profiles p ON p.id = b.owner_id
        WHERE pr.id = product_categories.product_id
        AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage product categories" ON product_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Product images policies
CREATE POLICY "Anyone can view product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Business owners can manage their product images" ON product_images FOR ALL USING (
    EXISTS (
        SELECT 1 FROM products pr
        JOIN businesses b ON b.id = pr.business_id
        JOIN profiles p ON p.id = b.owner_id
        WHERE pr.id = product_images.product_id
        AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all product images" ON product_images FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Create storage buckets for product images
INSERT INTO storage.buckets (id, name, public) VALUES 
('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Business owners can upload product images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
        SELECT 1 FROM products pr
        JOIN businesses b ON b.id = pr.business_id
        JOIN profiles p ON p.id = b.owner_id
        WHERE pr.id::text = (storage.foldername(name))[2]
        AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Business owners can update their product images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'product-images' AND
    EXISTS (
        SELECT 1 FROM products pr
        JOIN businesses b ON b.id = pr.business_id
        JOIN profiles p ON p.id = b.owner_id
        WHERE pr.id::text = (storage.foldername(name))[2]
        AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Business owners can delete their product images" ON storage.objects FOR DELETE USING (
    bucket_id = 'product-images' AND
    EXISTS (
        SELECT 1 FROM products pr
        JOIN businesses b ON b.id = pr.business_id
        JOIN profiles p ON p.id = b.owner_id
        WHERE pr.id::text = (storage.foldername(name))[2]
        AND p.user_id = auth.uid()
    )
);

-- Insert default categories
INSERT INTO categories (slug, name) VALUES
('restaurants', 'Restaurants'),
('hotels', 'Hotels & Accommodation'),
('tours', 'Tours & Activities'),
('retail', 'Retail & Shopping'),
('services', 'Professional Services'),
('health', 'Health & Wellness'),
('transport', 'Transportation'),
('entertainment', 'Entertainment')
ON CONFLICT (slug) DO NOTHING;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();