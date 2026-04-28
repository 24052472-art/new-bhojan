
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking DB...");
  
  const { data: restaurants } = await supabase.from('restaurants').select('*');
  console.log("Restaurants:", restaurants?.length);
  if (restaurants && restaurants.length > 0) {
    console.log("First Restaurant ID:", restaurants[0].id);
  }

  const { data: orders } = await supabase.from('orders').select('status, grand_total').limit(5);
  console.log("Sample Orders Statuses:", orders?.map(o => o.status));

  const { data: tables } = await supabase.from('tables').select('status').limit(5);
  console.log("Sample Tables Statuses:", tables?.map(t => t.status));
}

check();
