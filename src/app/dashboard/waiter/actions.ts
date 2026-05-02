"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getWaiterDashboardData(restaurantId: string) {
  try {
    const [tablesRes, ordersRes, menuRes] = await Promise.all([
      supabaseAdmin
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number", { ascending: true }),
      supabaseAdmin
        .from("orders")
        .select(`*, order_items(*, menu_items(*))`)
        .eq("restaurant_id", restaurantId)
        .not("status", "in", "(completed,cancelled)")
        .not("payment_status", "eq", "paid"),
      supabaseAdmin
        .from("menu_items")
        .select(`
          *,
          menu_item_groups (
            name,
            menu_subcategories (
              menu_categories (
                name
              )
            )
          )
        `)
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true)
    ]);

    // Flatten menu items for the waiter dashboard to match expected 'category' and 'group' fields
    const flattenedMenu = (menuRes.data || []).map((item: any) => ({
      ...item,
      group: item.menu_item_groups?.name || "General",
      category: item.menu_item_groups?.menu_subcategories?.menu_categories?.name || "Uncategorized"
    }));

    return {
      tables: tablesRes.data || [],
      orders: ordersRes.data || [],
      menu: flattenedMenu,
      error: null
    };
  } catch (err: any) {
    return { tables: [], orders: [], menu: [], error: err.message };
  }
}


export async function placeOrder(orderData: any, orderItems: any[], existingOrderId?: string, tableId?: string) {
  try {
    let finalOrderId = existingOrderId;

    if (existingOrderId) {
      // Update existing order
      const { error: updateError } = await supabaseAdmin.from("orders").update({
        status: 'pending',
        total_amount: orderData.total_amount,
        grand_total: orderData.grand_total
      }).eq("id", existingOrderId);
      
      if (updateError) throw updateError;
    } else {
      // Create new order
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert([orderData]).select().single();
      if (orderError) throw orderError;
      finalOrderId = order.id;
      
      // Update table status
      if (tableId) {
        await supabaseAdmin.from("tables").update({ status: 'occupied' }).eq("id", tableId);
      }
    }

    // Insert order items
    const itemsWithOrderId = orderItems.map(item => ({ ...item, order_id: finalOrderId }));
    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(itemsWithOrderId);
    if (itemsError) throw itemsError;

    return { orderId: finalOrderId, error: null };
  } catch (err: any) {
    return { orderId: null, error: err.message };
  }
}

export async function settleBill(orderId: string, tableId: string, settlementData: any) {
  try {
    const { error: orderError } = await supabaseAdmin.from("orders").update(settlementData).eq("id", orderId);
    if (orderError) throw orderError;

    const { error: tableError } = await supabaseAdmin.from("tables").update({ status: 'available' }).eq("id", tableId);
    if (tableError) throw tableError;

    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}
export async function updateOrderItemStatus(itemId: string, status: string) {
  try {
    const { error } = await supabaseAdmin.from("order_items").update({ status }).eq("id", itemId);
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}
