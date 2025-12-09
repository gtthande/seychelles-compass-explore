-- ============================
-- iCompass Seychelles — FINAL SCHEMA (Authoritative)
-- ============================

CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    address text,
    phone text,
    email text,
    website text,
    image_url text,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    searchable boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2),
    duration text,
    image_url text,
    searchable boolean DEFAULT true,
    stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    slug text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE business_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_business_category_id ON businesses(category_id);
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_slug ON products(slug);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;

-- PUBLIC SELECT
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read businesses" ON businesses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (true);

-- ADMIN FULL ACCESS
CREATE POLICY "Admin full categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full businesses" ON businesses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full business_products" ON business_products FOR ALL USING (auth.role() = 'service_role');
