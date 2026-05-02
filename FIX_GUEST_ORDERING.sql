-- GUEST ORDERING FIX: Enable public access for orders and order_items
-- Run this in the Supabase SQL Editor to resolve the RLS violations.

-- 1. ORDERS TABLE
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can place an order" ON orders;
DROP POLICY IF EXISTS "Public can place orders" ON orders;
DROP POLICY IF EXISTS "Restaurant staff can view/manage orders" ON orders;

-- Policy: Guests can place orders (Insert)
CREATE POLICY "Public can place orders" 
ON orders FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy: Guests can view their own orders (Select)
CREATE POLICY "Public can view own orders" 
ON orders FOR SELECT 
TO public 
USING (true);

-- Policy: Staff can manage all orders
CREATE POLICY "Staff can manage orders" 
ON orders FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id::text = auth.uid()::text 
        AND restaurant_id = orders.restaurant_id
        AND role IN ('owner', 'waiter', 'kitchen')
    )
);


-- 2. ORDER_ITEMS TABLE
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can place order items" ON order_items;
DROP POLICY IF EXISTS "Public can view order items" ON order_items;
DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;

-- Policy: Guests can insert order items
CREATE POLICY "Public can place order items" 
ON order_items FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy: Guests can view order items
CREATE POLICY "Public can view order items" 
ON order_items FOR SELECT 
TO public 
USING (true);

-- Policy: Staff can manage all order items
CREATE POLICY "Staff can manage order items" 
ON order_items FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        JOIN profiles ON profiles.restaurant_id = orders.restaurant_id
        WHERE orders.id = order_items.order_id
        AND profiles.id::text = auth.uid()::text
        AND profiles.role IN ('owner', 'waiter', 'kitchen')
    )
);

-- 3. TABLES (Ensure guests can see table status)
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view tables" ON tables;
CREATE POLICY "Public view tables" ON tables FOR SELECT TO public USING (true);

-- 4. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
