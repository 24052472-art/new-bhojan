import { supabaseAdmin } from "./src/lib/supabase/admin";

async function checkSchema() {
  const { data, error } = await supabaseAdmin.from('order_items').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
  }
}

checkSchema();
