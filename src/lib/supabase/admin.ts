import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn("Supabase credentials missing. Admin client may not function correctly.");
}

export const supabaseAdmin = createClient(
  supabaseUrl || "",
  serviceRoleKey || ""
);
