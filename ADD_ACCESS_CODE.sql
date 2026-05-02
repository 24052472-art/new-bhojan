-- ADD ACCESS CODE COLUMN TO ORDERS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Generate random 4-digit codes for existing active orders (optional but helpful)
UPDATE orders SET access_code = floor(random() * 9000 + 1000)::text WHERE access_code IS NULL;

NOTIFY pgrst, 'reload schema';
