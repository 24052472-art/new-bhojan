-- SECURITY PROTOCOL: Enable Row Level Security (RLS) and define access policies
-- Run this in the Supabase SQL Editor to resolve the security vulnerability.

-- 1. RESTAURANTS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Public can view restaurants (needed for menu display)
CREATE POLICY "Restaurants are publicly viewable" 
ON restaurants FOR SELECT 
USING (true);

-- Owners can update their own restaurant
CREATE POLICY "Owners can update their own restaurant" 
ON restaurants FOR UPDATE 
USING (auth.uid()::text IN (
    SELECT id::text FROM profiles WHERE restaurant_id = restaurants.id AND role = 'owner'
));


-- 2. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid()::text = id::text);

-- Superadmins can view all profiles
CREATE POLICY "Superadmins can view all profiles" 
ON profiles FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin')
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid()::text = id::text);


-- 3. MENU INFRASTRUCTURE (Categories, Subcategories, Groups, Items)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Menu categories are publicly viewable" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Menu subcategories are publicly viewable" ON menu_subcategories FOR SELECT USING (true);
CREATE POLICY "Menu item groups are publicly viewable" ON menu_item_groups FOR SELECT USING (true);
CREATE POLICY "Menu items are publicly viewable" ON menu_items FOR SELECT USING (true);

-- Staff manage access
CREATE POLICY "Staff manage categories" ON menu_categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND restaurant_id = menu_categories.restaurant_id AND role IN ('owner', 'waiter')));
CREATE POLICY "Staff manage subcategories" ON menu_subcategories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND restaurant_id = menu_subcategories.restaurant_id AND role IN ('owner', 'waiter')));
CREATE POLICY "Staff manage groups" ON menu_item_groups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND restaurant_id = menu_item_groups.restaurant_id AND role IN ('owner', 'waiter')));
CREATE POLICY "Staff manage items" ON menu_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND restaurant_id = menu_items.restaurant_id AND role IN ('owner', 'waiter')));


-- 4. TABLES
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Public can view tables
CREATE POLICY "Tables are publicly viewable" 
ON tables FOR SELECT 
USING (true);

-- Staff can manage tables
CREATE POLICY "Staff can manage tables" 
ON tables FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id::text = auth.uid()::text 
        AND restaurant_id = tables.restaurant_id 
        AND role IN ('owner', 'waiter')
    )
);


-- 5. ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public can insert orders (guests)
CREATE POLICY "Anyone can place an order" 
ON orders FOR INSERT 
WITH CHECK (true);

-- Restaurant staff can view/manage orders
CREATE POLICY "Restaurant staff can view/manage orders" 
ON orders FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id::text = auth.uid()::text 
        AND restaurant_id = orders.restaurant_id
    )
);


-- 6. AUDIT LOGS (Commented out as table might not exist yet)
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Only superadmins can view audit logs" 
-- ON audit_logs FOR SELECT 
-- USING (
--     EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin')
-- );


-- 7. USER PROFILES (Internal Mapping)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- System level access for the service role is automatic. 
-- For safety, we allow authenticated users to see their own mapping if needed.
CREATE POLICY "Users view own mapping" 
ON user_profiles FOR SELECT 
USING (auth.uid()::text = id::text);
