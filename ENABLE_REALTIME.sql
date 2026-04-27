-- Enable Realtime for the ordering system
-- This ensures that changes to orders and order_items are broadcast to the KDS

-- 1. Add tables to the supabase_realtime publication
BEGIN;
  -- Remove them if they exist to avoid errors
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS order_items;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS tables;

  -- Add them back
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  ALTER PUBLICATION supabase_realtime ADD TABLE tables;
COMMIT;

-- 2. Ensure REPLICA IDENTITY is set to FULL for accurate change tracking
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER TABLE tables REPLICA IDENTITY FULL;

-- 3. Notify schema reload
NOTIFY pgrst, 'reload schema';
