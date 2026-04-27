-- 1. Create Subcategories Table
CREATE TABLE IF NOT EXISTS menu_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    service_types TEXT[] DEFAULT '{"Dine-in", "Takeaway", "Delivery"}',
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Item Groups Table
CREATE TABLE IF NOT EXISTS menu_item_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES menu_subcategories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    service_types TEXT[] DEFAULT '{"Dine-in", "Takeaway", "Delivery"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update menu_items to support item groups
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS item_group_id UUID REFERENCES menu_item_groups(id) ON DELETE SET NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS item_type TEXT CHECK (item_type IN ('Veg', 'Non-Veg', 'Vegan', 'Not Applicable'));
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS health_options TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- 4. Disable RLS on new tables (Crucial for Firebase setup)
ALTER TABLE menu_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_groups DISABLE ROW LEVEL SECURITY;

-- 5. Add Operational Columns to Restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '[]'::jsonb;

-- 6. Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    rating INTEGER,
    categories TEXT[],
    comment TEXT,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Disable RLS
ALTER TABLE menu_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- 9. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
