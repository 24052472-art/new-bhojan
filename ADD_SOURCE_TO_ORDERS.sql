-- Add source column to orders to track where orders are coming from
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'staff';
