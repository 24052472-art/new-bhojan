"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { startOfDay, subDays } from "date-fns";

export async function getAdminDashboardData(resId: string) {
  try {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);

    // Fetch all needed data in parallel
    const [ordersRes, tablesRes, recentRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("grand_total, status, created_at")
        .eq("restaurant_id", resId)
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabaseAdmin
        .from("tables")
        .select("id, status")
        .eq("restaurant_id", resId),
      supabaseAdmin
        .from("orders")
        .select(`*, tables(table_number)`)
        .eq("restaurant_id", resId)
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

    if (ordersRes.error) console.error("Error fetching orders:", ordersRes.error);
    if (tablesRes.error) console.error("Error fetching tables:", tablesRes.error);

    return {
      weekOrders: ordersRes.data || [],
      totalTables: tablesRes.data || [],
      recent: recentRes.data || [],
      error: null
    };
  } catch (err: any) {
    console.error("Error in getAdminDashboardData:", err);
    return { weekOrders: [], totalTables: [], recent: [], error: err.message };
  }
}
