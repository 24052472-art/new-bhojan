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

export async function getAdminCustomers(resId: string) {
  const { data, error } = await supabaseAdmin.from("customers").select("*").eq("restaurant_id", resId);
  return { data, error: error?.message };
}

export async function getAdminFeedback(resId: string) {
  const { data, error } = await supabaseAdmin.from("feedbacks").select("*, orders(id, tables(table_number))").eq("restaurant_id", resId).order("created_at", { ascending: false });
  return { data, error: error?.message };
}

export async function getAdminStaff(resId: string) {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("restaurant_id", resId).neq("role", "owner").neq("role", "super_admin");
  return { data, error: error?.message };
}

export async function getAdminAnalyticsData(resId: string) {
  try {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);

    const [ordersRes, itemsRes, customersRes] = await Promise.all([
      // Get all orders from last 7 days for the chart, and also all-time orders for total counts
      supabaseAdmin
        .from("orders")
        .select("id, grand_total, status, created_at")
        .eq("restaurant_id", resId),
      // Get order items for category mix
      supabaseAdmin
        .from("order_items")
        .select("total_price, menu_items(category_id)")
        .eq("orders.restaurant_id", resId), // Note: this inner join filter might not work directly in supabase if not set up, let's just fetch all items for this res if possible, or simpler: fetch order_items that belong to orders. Actually better to get orders with items.
      supabaseAdmin
        .from("customers")
        .select("id")
        .eq("restaurant_id", resId)
    ]);

    // Better category mix approach:
    const { data: catData } = await supabaseAdmin
      .from("order_items")
      .select("total_price, orders!inner(restaurant_id), menu_items(name, category_id, menu_categories(name))")
      .eq("orders.restaurant_id", resId);

    return {
      orders: ordersRes.data || [],
      orderItems: catData || [],
      customersCount: customersRes.data?.length || 0,
      error: null
    };
  } catch (err: any) {
    return { orders: [], orderItems: [], customersCount: 0, error: err.message };
  }
}

export async function addAdminStaff(staffId: string, fullName: string, role: string, restaurantId: string, passcode: string) {
  const { error } = await supabaseAdmin.from("profiles").insert([{
    id: staffId,
    full_name: fullName,
    role: role,
    restaurant_id: restaurantId,
    staff_passcode: passcode,
  }]);
  return { error: error?.message };
}

export async function deleteAdminStaff(staffId: string) {
  const { error } = await supabaseAdmin.from("profiles").delete().eq("id", staffId);
  return { error: error?.message };
}

export async function getAdminMenuData(resId: string) {
  try {
    const [catRes, subRes, groupRes, itemRes] = await Promise.all([
      supabaseAdmin.from("menu_categories").select("*").eq("restaurant_id", resId),
      supabaseAdmin.from("menu_subcategories").select("*").eq("restaurant_id", resId),
      supabaseAdmin.from("menu_item_groups").select("*").eq("restaurant_id", resId),
      supabaseAdmin.from("menu_items").select("*").eq("restaurant_id", resId)
    ]);

    return {
      categories: catRes.data || [],
      subcategories: subRes.data || [],
      itemGroups: groupRes.data || [],
      items: itemRes.data || [],
      error: null
    };
  } catch (err: any) {
    return { categories: [], subcategories: [], itemGroups: [], items: [], error: err.message };
  }
}

export async function addAdminCategory(resId: string, name: string) {
  const { data, error } = await supabaseAdmin.from("menu_categories").insert([{ name, restaurant_id: resId }]).select().single();
  return { data, error: error?.message };
}

export async function addAdminSubcategory(payload: any) {
  const { data, error } = await supabaseAdmin.from("menu_subcategories").insert([payload]).select().single();
  return { data, error: error?.message };
}

export async function updateAdminSubcategory(id: string, payload: any) {
  const { error } = await supabaseAdmin.from("menu_subcategories").update(payload).eq("id", id);
  return { error: error?.message };
}

export async function addAdminItemGroup(payload: any) {
  const { data, error } = await supabaseAdmin.from("menu_item_groups").insert([payload]).select().single();
  return { data, error: error?.message };
}

export async function updateAdminItemGroup(id: string, payload: any) {
  const { error } = await supabaseAdmin.from("menu_item_groups").update(payload).eq("id", id);
  return { error: error?.message };
}

export async function addAdminItem(payload: any) {
  const { data, error } = await supabaseAdmin.from("menu_items").insert([payload]).select().single();
  return { data, error: error?.message };
}

export async function updateAdminItem(id: string, payload: any) {
  const { error } = await supabaseAdmin.from("menu_items").update(payload).eq("id", id);
  return { error: error?.message };
}



