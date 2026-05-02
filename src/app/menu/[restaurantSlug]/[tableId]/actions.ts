"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function placeGuestOrder(restaurantId: string, tableId: string, guestInfo: any, cart: any[], existingOrderId?: string) {
  try {
    let finalOrderId = existingOrderId;
    let finalAccessCode = "";
    const batchTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    if (existingOrderId) {
      // Update existing order
      const { data: currentOrder } = await supabaseAdmin.from("orders").select("total_amount, grand_total, access_code").eq("id", existingOrderId).single();
      const newTotal = (currentOrder?.total_amount || 0) + batchTotal;
      const newGrand = (currentOrder?.grand_total || 0) + batchTotal;

      const { error: updateError } = await supabaseAdmin.from("orders").update({ 
        total_amount: newTotal,
        grand_total: newGrand,
        status: 'pending'
      }).eq("id", existingOrderId);
      
      if (updateError) throw updateError;
      finalOrderId = existingOrderId;
      finalAccessCode = currentOrder?.access_code || "";
    } else {
      // Create new order
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert([{
        restaurant_id: restaurantId, 
        table_id: tableId, 
        status: 'pending', 
        payment_status: 'unpaid',
        total_amount: batchTotal,
        grand_total: batchTotal,
        customer_name: guestInfo.name,
        customer_phone: guestInfo.phone,
        access_code: accessCode
      }]).select().single();
      
      if (orderError) throw orderError;
      finalOrderId = order.id;
      finalAccessCode = accessCode;
    }

    // Insert order items
    const orderItems = cart.map(item => ({ 
      order_id: finalOrderId, 
      menu_item_id: item.id, 
      quantity: item.quantity, 
      unit_price: item.price, 
      total_price: item.price * item.quantity 
    }));
    
    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    // Update table status to occupied (BYPASS RLS)
    await supabaseAdmin.from("tables").update({ status: 'occupied' }).eq("id", tableId);

    return { success: true, orderId: finalOrderId, accessCode: finalAccessCode };
  } catch (err: any) {
    console.error("Guest Order Action Failed:", err);
    return { success: false, error: err.message };
  }
}
