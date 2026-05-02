"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getKitchenOrders(restaurantId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`*, tables (table_number), order_items (*, menu_items (name))`)
      .eq("restaurant_id", restaurantId)
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false });

    return { orders: data || [], error: error?.message || null };
  } catch (err: any) {
    return { orders: [], error: err.message };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    return { error: error?.message || null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getStaffMap(restaurantId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("restaurant_id", restaurantId);

    if (error) throw error;

    const map: Record<string, string> = {};
    data?.forEach(s => map[s.id] = s.full_name);
    
    return { staffMap: map, error: null };
  } catch (err: any) {
    return { staffMap: {}, error: err.message };
  }
}
