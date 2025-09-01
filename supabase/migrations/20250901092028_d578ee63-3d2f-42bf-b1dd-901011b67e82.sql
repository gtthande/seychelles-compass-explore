-- Add missing fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_published_at ON products(published_at);

-- Update trigger to set published_at when status changes to active
CREATE OR REPLACE FUNCTION update_product_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when status changes to active
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    NEW.published_at = now();
  END IF;
  
  -- Clear published_at when status changes from active
  IF NEW.status != 'active' AND OLD.status = 'active' THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_product_published_at ON products;
CREATE TRIGGER trigger_update_product_published_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_published_at();