-- Add missing category column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing restaurants to have a default category if null
UPDATE restaurants SET category = 'Dine-in' WHERE category IS NULL;
